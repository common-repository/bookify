<?php

namespace Bookify\Controllers\REST;

use WP_REST_Response;
use WP_Error;
use Bookify\Models\Bookify_Appointment_Models;
use Bookify\Models\Bookify_Service_Models;
use BookifyPro\Models\Bookify_Pro_Location_Models;

// don't call the file directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Bookify_Appointments_Rest_API' ) ) {

	class Bookify_Appointments_Rest_API {

		public function __construct() {

			add_action( 'rest_api_init' , array( $this, 'rest_api_appointments' ) );
		}

		public function rest_api_appointments() {

			register_rest_route('bookify/v1', '/appointments', array(
				'methods'               => 'GET',
				'callback'              => array( $this, 'rest_appointments_data_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			)); 

			register_rest_route('bookify/v1', '/add-appointment', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'rest_add_appointments_data_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			)); 

			register_rest_route('bookify/v1', '/delete-appointment', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'rest_delete_appointments_data_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			));

			register_rest_route('bookify/v1', '/update-appointment', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'rest_update_appointments_data_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			));

			register_rest_route('bookify/v1', '/available-slots', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'rest_available_slots_callback' ),
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

		public function rest_update_appointments_data_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}
			
			$general_settings = get_option( 'bookify_general_settings');
			$default_appointment_status = is_array( $general_settings ) && isset( $general_settings['DefaultAppointmentStatus'] ) ? $general_settings['DefaultAppointmentStatus'] : 'Pending';

			$appointment_id = isset( $_POST['appointment_id'] ) && ! empty( $_POST['appointment_id'] ) ? sanitize_text_field( $_POST['appointment_id'] ) : '';
			$appointment_service = isset( $_POST['appointment_service'] ) && ! empty( $_POST['appointment_service'] ) ? sanitize_text_field( $_POST['appointment_service'] ) : '';
			$appointment_staff = isset( $_POST['appointment_staff'] ) && ! empty( $_POST['appointment_staff'] ) ? sanitize_text_field( $_POST['appointment_staff'] ) : '';
			$appointment_date = isset( $_POST['appointment_date'] ) && ! empty( $_POST['appointment_date'] ) ? sanitize_text_field( $_POST['appointment_date'] ) : '';
			$appointment_duration = isset( $_POST['appointment_duration'] ) && ! empty( $_POST['appointment_duration'] ) ? sanitize_text_field( $_POST['appointment_duration'] ) : '';
			$appointment_price = isset( $_POST['appointment_price'] ) && ! empty( $_POST['appointment_price'] ) ? sanitize_text_field( $_POST['appointment_price'] ) : '';
			$customer_id = isset( $_POST['customer_id'] ) && ! empty( $_POST['customer_id'] ) ? sanitize_text_field( $_POST['customer_id'] ) : '';
			$appointment_status = isset( $_POST['appointment_status'] ) && ! empty( $_POST['appointment_status'] ) ? sanitize_text_field( $_POST['appointment_status'] ) : $default_appointment_status;
			$note = isset( $_POST['note'] ) && ! empty( $_POST['note'] ) ? sanitize_text_field( $_POST['note'] ) : '';

			if ( ! $appointment_id || ! $appointment_service ||  ! $appointment_staff ||  ! $appointment_date || ! $appointment_duration || ! $appointment_price || ! $customer_id ) {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Please Fill the required fields!',
				), 200);
			}

			$appointment_data = Bookify_Appointment_Models::bookify_get_all_appointments_by_id( $appointment_id );
			$prev_status = $appointment_data['appointment_status'];

			$data = array(
				'appointment_service' => $appointment_service,
				'appointment_staff' => $appointment_staff,
				'appointment_date' => $appointment_date,
				'appointment_duration' => $appointment_duration,
				'appointment_price' => $appointment_price,
				'appointment_customer' => $customer_id,
				'appointment_status' => $appointment_status,
				'appointment_note' => $note,
			);

			$result = Bookify_Appointment_Models::bookify_update_appointment( $appointment_id, $data );

			/**
			 * Action - Sends email on changed status of appointment.
			 * 
			 * @since 1.0
			**/
			do_action( 'bookify_appointment_status_changed_email', $appointment_id, $prev_status, $appointment_status );

			if ( $result ) {
				return new WP_REST_Response(array(
					'success' => $result,
					'message' => 'Appointment has been updated successfully!'
				), 200);
			} else {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Error while updating appointment!'
				), 200);
			}
		}

		public function rest_delete_appointments_data_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$appointment_id = isset( $_POST['appointment_id'] ) && ! empty( $_POST['appointment_id'] ) ? sanitize_text_field( $_POST['appointment_id'] ) : '';

			if ( ! $appointment_id ) {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'No appointment id is selected for deleting!',
				), 200);
			}

			$result = Bookify_Appointment_Models::bookify_delete_appointment( $appointment_id );

			if ( $result ) {
				return new WP_REST_Response(array(
					'success' => $result,
					'message' => 'Appointmnet has been deleted successfully!'
				), 200);
			} else {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Error while deleting appointmnet!'
				), 200);
			}
		}

		public function rest_available_slots_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}
		
			$date = isset( $_POST['date'] ) && ! empty( $_POST['date'] ) ? sanitize_text_field( $_POST['date'] ) : '';
			$slots = isset( $_POST['slots'] ) && ! empty( $_POST['slots'] ) ? sanitize_text_field( stripslashes( $_POST['slots'] ) ) : '';
			$staff_id = isset( $_POST['staff_id'] ) && ! empty( $_POST['staff_id'] ) ? sanitize_text_field( $_POST['staff_id'] ) : '';
		
			$general_settings = get_option( 'bookify_general_settings' );
			$get_time_format = is_array( $general_settings ) && isset( $general_settings['DefaultTimeFormat'] ) ? sanitize_text_field( $general_settings['DefaultTimeFormat'] ) : '12-hour';
		
			if ( '12-hour' == $get_time_format ) {
				$time_format = 'h:i A';
			} else {
				$time_format = 'H:i';
			}
		
			$slots = json_decode( $slots, true );
			$current_time = current_time('H:i');
			
			if ( $date === current_time('Y-m-d') ) {
				$slots = array_filter( $slots, function ( $slot ) use ( $current_time ) {
					list( $start_time, $end_time ) = explode( ' - ', $slot );
					$start_time_24hr = gmdate( 'H:i', strtotime( $start_time ) );
		
					return $start_time_24hr > $current_time;
				} );
			}
		
			$booked_slots = Bookify_Appointment_Models::bookify_get_appointments_by_date_staff( $date, $staff_id );
		
			$available_slots = array_values( array_diff( $slots, $booked_slots ) );
			$formatted_slots = array();
		
			foreach ( $available_slots as $available_slot ) {
				list( $start_time, $end_time ) = explode(' - ', $available_slot);
		
				$formatted_start_time = gmdate( $time_format, strtotime( $start_time ) );
				$formatted_end_time = gmdate( $time_format, strtotime( $end_time ) );
				$formatted_slots[] = $formatted_start_time . ' - ' . $formatted_end_time;
			}
		
			return new WP_REST_Response(array(
				'timeFormat' => $time_format,
				'available_slots' => $formatted_slots,
			), 200);
		}

		public function rest_add_appointments_data_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$general_settings = get_option( 'bookify_general_settings');
			$default_appointment_status = is_array( $general_settings ) && isset( $general_settings['DefaultAppointmentStatus'] ) ? $general_settings['DefaultAppointmentStatus'] : 'Pending';

			$appointment_service = isset( $_POST['appointment_service'] ) && ! empty( $_POST['appointment_service'] ) ? sanitize_text_field( $_POST['appointment_service'] ) : '';
			$appointment_staff = isset( $_POST['appointment_staff'] ) && ! empty( $_POST['appointment_staff'] ) ? sanitize_text_field( $_POST['appointment_staff'] ) : '';
			$appointment_date = isset( $_POST['appointment_date'] ) && ! empty( $_POST['appointment_date'] ) ? sanitize_text_field( $_POST['appointment_date'] ) : '';
			$appointment_duration = isset( $_POST['appointment_duration'] ) && ! empty( $_POST['appointment_duration'] ) ? sanitize_text_field( $_POST['appointment_duration'] ) : '';
			$appointment_price = isset( $_POST['appointment_price'] ) && ! empty( $_POST['appointment_price'] ) ? sanitize_text_field( $_POST['appointment_price'] ) : '';
			$customer_id = isset( $_POST['customer_id'] ) && ! empty( $_POST['customer_id'] ) ? sanitize_text_field( $_POST['customer_id'] ) : '';
			$appointment_status = isset( $_POST['appointment_status'] ) && ! empty( $_POST['appointment_status'] ) ? sanitize_text_field( $_POST['appointment_status'] ) : $default_appointment_status;
			$note = isset( $_POST['note'] ) && ! empty( $_POST['note'] ) ? sanitize_text_field( $_POST['note'] ) : '';

			

			if ( ! $appointment_service ||  ! $appointment_staff ||  ! $appointment_date || ! $appointment_duration || ! $appointment_price || ! $customer_id ) {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Please Fill the required fields!',
				), 200);
			}

			$appointment_data = array(
				'appointment_service' => $appointment_service,
				'appointment_staff' => $appointment_staff,
				'appointment_date' => $appointment_date,
				'appointment_duration' => $appointment_duration,
				'appointment_price' => $appointment_price,
				'appointment_customer' => $customer_id,
				'appointment_created' => current_datetime()->format('Y-m-d H:i:s'),
				'appointment_status' => $appointment_status,
				'appointment_note' => $note,
			);

			$appointment_id = Bookify_Appointment_Models::bookify_add_appointment( $appointment_data );

			/**
			 * Action - Sends email on requested appointment.
			 * 
			 * @since 1.0
			**/
			do_action( 'bookify_appointment_requested_email', $appointment_id );
			
			if ( ! is_wp_error( $appointment_id ) ) {
				return new WP_REST_Response(array(
					'success' => $appointment_id,
					'message' => 'Appointment has been added successfully!'
				), 200);
			} else {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Error while adding appointment!'
				), 200);
			}
		}

		public function rest_appointments_data_callback( $request ) {

			$page = $request->get_param('page');
			$pageSize = $request->get_param('pageSize');
			$search = $request->get_param('search');
			$is_staff = false;
			$current_staff_id = false;

			if ( is_user_logged_in() ) {

				$current_user = wp_get_current_user();
				
				if ( in_array( 'bookify-staff', (array) $current_user->roles ) ) {
					$current_staff_id = $current_user->ID;
					$is_staff = true;
				}
			}
			$all_services = array();
			$all_location = array();

			$apointment_data = Bookify_Appointment_Models::bookify_get_all_appointments_for_table( $current_staff_id );
			if ( class_exists( '\BookifyPro\Bookify_Pro_Main' ) ) {
				$all_location = Bookify_Pro_Location_Models::bookify_get_all_locations();
			} else {
				$all_services = Bookify_Service_Models::bookify_get_all_services();
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

			$general_settings = get_option( 'bookify_general_settings' );
			$default_status = is_array( $general_settings ) && isset( $general_settings['DefaultAppointmentStatus'] ) ? $general_settings['DefaultAppointmentStatus'] : 'Pending';
			$date_format = is_array( $general_settings ) && isset( $general_settings['DefaultDateFormat'] ) ? $general_settings['DefaultDateFormat'] : 'DD/MM/YY';
			$time_format = is_array( $general_settings ) && isset( $general_settings['DefaultTimeFormat'] ) ? $general_settings['DefaultTimeFormat'] : '12-hour';
			$prior_booking_toggle = is_array( $general_settings ) && isset( $general_settings['DefaultPriorToBooking'] ) ? $general_settings['DefaultPriorToBooking'] : 'Disable';
			$prior_booking_time = is_array( $general_settings ) && isset( $general_settings['PriorTimeToBooking'] ) ? $general_settings['PriorTimeToBooking'] : '3';
			$currency = is_array( $general_settings ) && isset( $general_settings['DefaultGeneralCurrencies'] ) ? $general_settings['DefaultGeneralCurrencies'] : 'USD';

			if ( ! empty( $search ) ) {
				$apointment_data = array_filter( $apointment_data, function ( $appointment ) use ( $search ) {
					$search_lower = strtolower( $search );
					return (
						strpos( strtolower( $appointment['appointment_date'] ), $search_lower ) !== false ||
						strpos( strtolower( $appointment['appointment_customer_name'] ), $search_lower ) !== false ||
						strpos( strtolower( $appointment['appointment_customer_email'] ), $search_lower ) !== false ||
						strpos( strtolower( $appointment['appointment_staff_name'] ), $search_lower ) !== false ||
						strpos( strtolower( $appointment['appointment_staff_email'] ), $search_lower ) !== false ||
						strpos( strtolower( $appointment['service_name'] ), $search_lower ) !== false ||
						strpos( strtolower( $appointment['appointment_price'] ), $search_lower ) !== false ||
						strpos( strtolower( $appointment['appointment_duration'] ), $search_lower ) !== false ||
						strpos( strtolower( $appointment['appointment_created'] ), $search_lower ) !== false ||
						strpos( strtolower( $appointment['appointment_status'] ), $search_lower ) !== false
					);
				});
			}

			$startIndex = ( $page - 1 ) * $pageSize;

			$paginatedData = array_slice($apointment_data, $startIndex, $pageSize);
			
			return new WP_REST_Response(array(
				'data' => $paginatedData,
				'total' => count($apointment_data),
				'locations' => $all_location,
				'services' => $all_services,
				'customers' => $all_customers,
				'currency' => $currency,
				'default_status' => $default_status,
				'dateFormat' => $date_format,
				'timeFormat' => $time_format,
				'priorToggle' => $prior_booking_toggle,
				'priorTime' => $prior_booking_time,
				'is_staff' => $is_staff
			), 200);
		}
	}

	new Bookify_Appointments_Rest_API();

}
