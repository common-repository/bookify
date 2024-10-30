<?php

namespace Bookify\Controllers\REST;

use WP_REST_Response;
use WP_User_Query;
use WP_Error;
use Bookify\Models\Bookify_Service_Models;
use Bookify\Models\Bookify_Appointment_Models;

// don't call the file directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Bookify_Calendar_Rest_API' ) ) {

	class Bookify_Calendar_Rest_API {

		public function __construct() {

			add_action( 'rest_api_init' , array( $this, 'rest_api_calendar' ) );
		}

		public function rest_api_calendar() {

			register_rest_route('bookify/v1', '/calendar', array(
				'methods'               => 'GET',
				'callback'              => array( $this, 'rest_calendar_data_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			)); 

			register_rest_route('bookify/v1', '/staffs-by-service', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'rest_staffs_by_service_data_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			)); 

			register_rest_route('bookify/v1', '/dates-by-staff', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'rest_dates_by_staff_data_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			));
		}

		public function verify_nonce_and_permissions( $request ) {
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
		
		public function rest_dates_by_staff_data_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}
			
			$staff_id = isset( $_POST['staff_id'] ) && ! empty( $_POST['staff_id'] ) ? sanitize_text_field( $_POST['staff_id'] ) : '';

			if ( ! $staff_id || 'none' === $staff_id ) {
				return new WP_REST_Response(array(
					'dates' => array(),
					'special' => array(),
					'holidays' => array(),
				), 200);
			} 

			$timeslots = get_user_meta( $staff_id, 'bookify_staff_timeslots', true );
			$special_days = get_user_meta( $staff_id, 'bookify_staff_special_days_timeslots', true );
			$holidays = get_user_meta( $staff_id, 'bookify_staff_holidays', true );

			return new WP_REST_Response(array(
				'dates' => $timeslots,
				'special' => $special_days,
				'holidays' => $holidays,
			), 200);
		}

		public function rest_staffs_by_service_data_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$service_id = isset( $_POST['service_id'] ) && ! empty( $_POST['service_id'] ) ? sanitize_text_field( $_POST['service_id'] ) : '';
		
			if ( ! $service_id ) {
				return new WP_REST_Response(array(
					'staffs' => array(),
				), 200);
			}
		
			$user_query = new WP_User_Query( 
				array(
					'role' => 'bookify-staff',
					'meta_query' => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
						array(
							'key'     => 'bookify_staff_services',
							'compare' => 'EXISTS',
						),
					),
				)
			);

			$users = $user_query->get_results();
			$filtered_users = array();
			$service_price = '';
		
			if ( ! empty( $users ) ) {
				foreach ( $users as $user ) {
					$services = get_user_meta( $user->ID, 'bookify_staff_services', true );
					if ( $services ) {
						$services = json_decode( $services, true );
						if ( isset( $services[ $service_id ] ) && $services[ $service_id ]['checked'] ) {
							$filtered_users[] = $user;
							$service_price = $services[ $service_id ]['price'];
						}
					}
				}
			}

			if ( ! empty( $filtered_users ) ) {
				$data_arrays = array();
				foreach ( $filtered_users as $user ) {
					$data_arrays[] = array(
						'staff_id' => $user->data->ID,
						'staff_name' => $user->data->display_name,
						'staff_email' => $user->data->user_email,
						'staff_img' => get_user_meta( $user->ID, 'bookify_staff_img', true ),
						'service_price' => $service_price
					);
				}

				return new WP_REST_Response(array(
					'staffs' => $data_arrays,
				), 200);
			} else {
				return new WP_REST_Response(array(
					'staffs' => array(),
				), 200);
			}
		}
		

		public function rest_calendar_data_callback( $request ) {

			$searchStaff = $request->get_param('staff') ? sanitize_text_field($request->get_param('staff')) : '';

			$general_settings = get_option( 'bookify_general_settings');
			$date_format = is_array( $general_settings ) && isset( $general_settings['DefaultDateFormat'] ) ? $general_settings['DefaultDateFormat'] : 'DD/MM/YY';
			$prior_booking_toggle = is_array( $general_settings ) && isset( $general_settings['DefaultPriorToBooking'] ) ? $general_settings['DefaultPriorToBooking'] : 'Disable';
			$prior_booking_time = is_array( $general_settings ) && isset( $general_settings['PriorTimeToBooking'] ) ? $general_settings['PriorTimeToBooking'] : '3';
			$default_status = is_array( $general_settings ) && isset( $general_settings['DefaultAppointmentStatus'] ) ? $general_settings['DefaultAppointmentStatus'] : 'Pending';

			$all_services = Bookify_Service_Models::bookify_get_all_services();

			$all_staffs = array();
			$bookify_staffs = get_users(
				array(
					'role__in' => array( 'bookify-staff' )
				)
			);

			if ( $bookify_staffs ) {
				foreach ($bookify_staffs as $staff) {
					$all_staffs[] = array(
						'id' => $staff->ID,
						'staff_name' => $staff->display_name,
					);
				}
			}

			$all_customers = array();
			$bookify_customers = get_users(
				array(
					'role__in' => array( 'bookify-customer' )
				)
			);

			if ( $bookify_customers ) {
				foreach ($bookify_customers as $customer) {
					$all_customers[] = array(
						'id' => $customer->ID,
						'customer_name' => $customer->display_name,
					);
				}
			}

			$is_staff = false;
			$current_staff_id = false;
			
			if ( is_user_logged_in() ) {
				$current_user = wp_get_current_user();
				if ( in_array( 'bookify-staff', (array) $current_user->roles ) ) {
					$current_staff_id = $current_user->ID;
					$is_staff = true;
				}
			}

			$calender_data = Bookify_Appointment_Models::bookify_get_all_appointments_for_calender( $current_staff_id );

			foreach ( $calender_data as &$appointment ) {
				$customer_id = $appointment['appointment_customer'];
				$customer = get_user_by( 'ID', $customer_id );
				if ( $customer ) {
					$appointment['customer_name'] = ucwords( $customer->display_name );
				} else {
					$appointment['customer_name'] = 'Guest';
				}
			}

			return new WP_REST_Response(array(
				'calender_data' => $calender_data,
				'dateFormat' => $date_format,
				'priorToggle' => $prior_booking_toggle,
				'priorTime' => $prior_booking_time,
				'staffs' => $all_staffs,
				'services' => $all_services,
				'customers' => $all_customers,
				'defaultAppointmentStatus' => $default_status,
				'is_staff' => $is_staff
			), 200);
		}
	}

	new Bookify_Calendar_Rest_API();

}
