<?php
namespace Bookify\Controllers\REST;

use WP_REST_Response;
use WP_Error;
use Bookify\Models\Bookify_Category_Models;
use Bookify\Models\Bookify_Service_Models;
use Bookify\Models\Bookify_Payment_Models;
use Bookify\Models\Bookify_Appointment_Models;
use Bookify\Controllers\Bookify_Helper;

// don't call the file directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Bookify_Frontend_Rest_API' ) ) {

	class Bookify_Frontend_Rest_API {

		public function __construct() {

			add_action( 'rest_api_init' , array( $this, 'rest_api_frontend' ) );
		}

		public function rest_api_frontend() {

			register_rest_route('bookify/frontend/v1', '/get-categories', array(
				'methods'               => 'GET',
				'callback'              => array( $this, 'get_categories' ),
				'permission_callback'   => array( $this, 'nonce_authentication' )
			)); 

			register_rest_route('bookify/frontend/v1', '/get-services', array(
				'methods'               => 'GET',
				'callback'              => array( $this, 'get_services' ),
				'permission_callback'   => array( $this, 'nonce_authentication' )
			)); 

			register_rest_route('bookify/frontend/v1', '/get-appointments', array(
				'methods'               => 'GET',
				'callback'              => array( $this, 'get_appointments_by_current_user' ),
				'permission_callback'   => array( $this, 'nonce_authentication' )
			));

			register_rest_route('bookify/frontend/v1', '/add-appointment', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'add_appointment' ),
				'permission_callback'   => array( $this, 'nonce_authentication' )
			)); 

			register_rest_route('bookify/frontend/v1', '/appointment-status', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'appointment_status_change' ),
				'permission_callback'   => array( $this, 'nonce_authentication' )
			));

			register_rest_route('bookify/frontend/v1', '/get-services-by-location', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'get_services_by_location_callback' ),
				'permission_callback'   => array( $this, 'nonce_authentication' )
			));
		}

		public function nonce_authentication( $request ) {
			
			$nonce = $request->get_header('X-WP-Nonce'); 

			if ( !$nonce ) {
				return new WP_Error( 
					'rest_missing_nonce', 
					__('You do not have permission to access this resource. Please contact the administrator if you believe this is an error.', 'bookify'), 
					array( 
						'status' => 403, 
						'message' => 'Nonce is missing.' 
					) 
				);
			}

			return true;
		}

		public function get_services_by_location_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$location_id = isset( $_POST['location_id'] ) && ! empty( $_POST['location_id'] ) ? sanitize_text_field( $_POST['location_id'] ) : '';

			$all_services = Bookify_Service_Models::bookify_get_all_categorizedservices_by_location( $location_id );
			$all_services = Bookify_Helper::bookify_services_sort( $all_services );

			return new WP_REST_Response(array(
				'services' => $all_services,
			), 200);
		}

		public function appointment_status_change( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$appointment_id = isset( $_POST['appointment_id'] ) && ! empty( $_POST['appointment_id'] ) ? sanitize_text_field( $_POST['appointment_id'] ) : '';

			if ( ! $appointment_id ) {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'No appointment id is selected for cancellation!',
				), 200);
			};

			$data = array(
				'appointment_status' => 'Cancelled'
			);

			$result = Bookify_Appointment_Models::bookify_update_appointment( $appointment_id, $data );

			if ( $result ) {
				return new WP_REST_Response(array(
					'success' => $result,
					'message' => 'Appointment has been cancelled!'
				), 200);
			} else {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Error while updating appointment!'
				), 200);
			}
		}

		public function get_appointments_by_current_user( $request ) {
			if ( is_user_logged_in() ) {
				$user = wp_get_current_user();

				$page = $request->get_param('page');
				$pageSize = $request->get_param('pageSize');

				$apointment_data = Bookify_Appointment_Models::bookify_get_all_appointments_frontend_by_customer( $user->ID );

				if ( $apointment_data ) {
					foreach ( $apointment_data as &$appointment ) {
						$bookify_staff = get_user_by( 'ID', $appointment['appointment_staff'] );
						$bookify_staff_name = $bookify_staff->display_name;
						$bookify_staff_img = get_user_meta( $bookify_staff->ID, 'bookify_staff_img', true );
						$bookify_staff_email = $bookify_staff->user_email;
						$appointment['appointment_staff_name'] = $bookify_staff_name;
						$appointment['appointment_staff_img'] = $bookify_staff_img;
						$appointment['appointment_staff_email'] = $bookify_staff_email;
					}
				}

				$general_settings = get_option( 'bookify_general_settings' );
				$currency = is_array( $general_settings ) && isset( $general_settings['DefaultGeneralCurrencies'] ) ? $general_settings['DefaultGeneralCurrencies'] : 'USD';

				$startIndex = ( $page - 1 ) * $pageSize;

				$paginatedData = array_slice($apointment_data, $startIndex, $pageSize);

				return new WP_REST_Response(array(
					'data' => $paginatedData,
					'total' => count($apointment_data),
					'currency' => $currency,
				), 200);


			}
		}

		public function get_categories() {

			$categories = Bookify_Category_Models::bookify_get_all_service_categories();

			return new WP_REST_Response(array(
				'categories' => $categories,
			), 200);
		}

		public function get_services() {

			$services = Bookify_Service_Models::bookify_get_all_services();

			return new WP_REST_Response(array(
				'services' => $services,
			), 200);
		}

		public function add_appointment( $request ) {

			$data = $request->get_json_params();

			$location_id = isset( $data['location_id'] ) && ! empty( $data['location_id'] ) ? sanitize_text_field( $data['location_id'] ) : 0;
			$service_id = isset( $data['service_id'] ) && ! empty( $data['service_id'] ) ? sanitize_text_field( $data['service_id'] ) : '';
			$staff_id = isset( $data['staff_id'] ) && ! empty( $data['staff_id'] ) ? sanitize_text_field( $data['staff_id'] ) : '';
			$date = isset( $data['date'] ) && ! empty( $data['date'] ) ? sanitize_text_field( $data['date'] ) : '';
			$duration = isset( $data['slot'] ) && ! empty( $data['slot'] ) ? sanitize_text_field( $data['slot'] ) : '';
			$customer_id = isset( $data['customer_id'] ) ? sanitize_text_field( $data['customer_id'] ) : '';
			$fname = isset( $data['first_name'] ) && ! empty( $data['first_name'] ) ? sanitize_text_field( $data['first_name'] ) : '';
			$lname = isset( $data['last_name'] ) && ! empty( $data['last_name'] ) ? sanitize_text_field( $data['last_name'] ) : '';
			$email = isset( $data['email'] ) && ! empty( $data['email'] ) ? sanitize_email( $data['email'] ) : '';
			$phone = isset( $data['phone'] ) && ! empty( $data['phone'] ) ? sanitize_text_field( $data['phone'] ) : '';
			$note = isset( $data['note'] ) && ! empty( $data['note'] ) ? sanitize_text_field( $data['note'] ) : '';
			$gateway = isset( $data['gateway'] ) && ! empty( $data['gateway'] ) ? sanitize_text_field( ucwords( $data['gateway'] ) ) : 'on-site';
			$total = isset( $data['total'] ) && ! empty( $data['total'] ) ? sanitize_text_field( $data['total'] ) : 0;
			$paidAmount = isset( $data['paidAmount'] ) && ! empty( $data['paidAmount'] ) ? sanitize_text_field( $data['paidAmount'] ) : false;

			if ( ! $service_id ||  ! $staff_id ||  ! $date || ! $duration || ! $fname || ! $lname || ! $email || ! $phone ) {
				return new WP_Error( 'missing_required_fields', 'Required data is missing!', array( 'status' => 400 ) );
			}

			if ( class_exists('\BookifyPro\Bookify_Pro_Main') && ! $location_id ) {
				return new WP_Error( 'missing_required_fields', 'Required data is missing!', array( 'status' => 400 ) );
			}
			
			$general_settings = get_option( 'bookify_general_settings');
			$status = is_array( $general_settings ) && isset( $general_settings['DefaultAppointmentStatus'] ) ? $general_settings['DefaultAppointmentStatus'] : 'Pending';

			$staff_services = get_user_meta( $staff_id, 'bookify_staff_services', true );
			$staff_services = json_decode( $staff_services );

			if ( empty( $staff_services->$service_id->price ) ) {
				return new WP_Error( 'price_not_defined', 'Service price is not defined.', array( 'status' => 400 ) );
			}

			if ( empty( $customer_id ) ) {

				if ( email_exists( $email ) ) {
					return new WP_Error( 'email_exists', 'Email already exists. Please log in first.', array( 'status' => 400 ) );
				}

				$password = Bookify_Helper::generate_strong_password();

				$bookify_customer_arg = array(
					'user_pass' => $password,
					'user_login' => $email,
					'user_email' => $email,
					'first_name' => $fname,
					'last_name' => $lname,
					'role' => 'bookify-customer',
					'meta_input' => array(
						'bookify_customer_phone' => $phone,
					)
				);

				$customer_id = wp_insert_user( $bookify_customer_arg );

				if ( is_wp_error( $customer_id ) ) {
					return $customer_id;
				}

				$body = __('Your account details has been updated, below are the credentials to login', 'bookify');

				Bookify_Helper::new_customer_notification( $customer_id, $body, $password );

				wp_signon( array(
					'user_login'    => $email,
					'user_password' => $password,
					'remember'      => true,
				), false );

			}

			$appointment_data = array(
				'appointment_location' => $location_id,
				'appointment_service' => $service_id,
				'appointment_staff' => $staff_id,
				'appointment_date' => $date,
				'appointment_duration' => $duration,
				'appointment_price' => $staff_services->$service_id->price,
				'appointment_customer' => $customer_id,
				'appointment_created' => current_datetime()->format('Y-m-d H:i:s'),
				'appointment_status' => $status,
				'appointment_note' => $note,
			);

			$appointment_id = Bookify_Appointment_Models::bookify_add_appointment( $appointment_data );

			if ( ! is_wp_error( $appointment_id ) ) {
				/**
				 * Action - Sends email on requested appointment.
				 * 
				 * @since 1.0
				**/
				do_action( 'bookify_appointment_requested_email', $appointment_id );
				
				if ( 'Paypal' === $gateway || 'Stripe' === $gateway ) {
					$dueAmount = $total - $paidAmount;

					$args = array(
						'appointment_id' => $appointment_id,
						'payment_method' => $gateway,
						'payment_total' => $total,
						'payment_paid' => $paidAmount,
						'payment_due' => abs( $dueAmount ),
						'payment_status' => 'Paid',
					);

					$payment_id = Bookify_Payment_Models::bookify_add_payment( $args );

					if ( ! is_wp_error( $payment_id ) ) {
						return new WP_REST_Response(array(
							'success' => true,
							'message' => 'payment has been created successfully!',
							'appointment_id' => $appointment_id
						), 200);
					} else {
						return new WP_Error( 'unable_adding_payment', 'Error while adding payment!.', array( 'status' => 400 ) );
					}
				} else {
					return new WP_REST_Response(array(
						'success' => true,
						'message' => 'Appointment has been created successfully!',
						'appointment_id' => $appointment_id
					), 200);
				}
			} else {
				return new WP_Error( 'unable_adding_appointment', 'Error while adding appointment!.', array( 'status' => 400 ) );
			}
		}
	}

	new Bookify_Frontend_Rest_API();

}
