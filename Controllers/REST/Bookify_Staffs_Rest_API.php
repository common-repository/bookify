<?php

namespace Bookify\Controllers\REST;

use WP_REST_Response;
use WP_Error;
use Bookify\Models\Bookify_Service_Models;
use Bookify\Controllers\Bookify_Helper;

// don't call the file directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Bookify_Staffs_Rest_API' ) ) {

	class Bookify_Staffs_Rest_API {

		public function __construct() {

			add_action( 'rest_api_init', array( $this, 'rest_api_staffs' ) );
			add_action( 'user_register', array( $this, 'restrict_bookify_staff_creation' ), 10, 2 );
		}

		public function rest_api_staffs() {

			register_rest_route('bookify/v1', '/staffs', array(
				'methods'               => 'GET',
				'callback'              => array( $this, 'rest_staffs_data_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' ),
			)); 

			register_rest_route('bookify/v1', '/add-staff', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'add_bookify_staff_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			));

			register_rest_route('bookify/v1', '/update-staff', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'update_bookify_staff_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			));

			register_rest_route('bookify/v1', '/delete-staff', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'delete_bookify_staff_callback' ),
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

		public function restrict_bookify_staff_creation( $user_id, $userdata ) {
			if ( class_exists('\BookifyPro\Bookify_Pro_Main') ) {
				return;
			}

			$user = get_userdata( $user_id );
			
			if ( in_array( 'bookify-staff', $user->roles ) ) {
				$args = array(
					'role'    => 'bookify-staff',
					'number'  => -1,
				);
				$users = get_users( $args );
		
				if ( count( $users ) >= 2 ) {
					wp_delete_user( $user_id );
					wp_die( 'You can only have one user with the "WPB Staff" role.' );
				}
			}
		}

		public function add_bookify_staff_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$staff_name = isset( $_POST['staff_name'] ) && ! empty( $_POST['staff_name'] ) ? sanitize_text_field( $_POST['staff_name'] ) : '';
			$staff_phone = isset( $_POST['staff_phone'] ) && ! empty( $_POST['staff_phone'] ) ? sanitize_text_field( $_POST['staff_phone'] ) : '';
			$staff_email = isset( $_POST['staff_email'] ) && ! empty( $_POST['staff_email'] ) ? sanitize_text_field( $_POST['staff_email'] ) : '';
			$staff_profession = isset( $_POST['staff_profession'] ) && ! empty( $_POST['staff_profession'] ) ? sanitize_text_field( $_POST['staff_profession'] ) : '';
			$staff_password = isset( $_POST['staff_password'] ) && ! empty( $_POST['staff_password'] ) ? sanitize_text_field( $_POST['staff_password'] ) : wp_generate_password( 8, true );
			$staff_note = isset( $_POST['staff_note'] ) && ! empty( $_POST['staff_note'] ) ? sanitize_text_field( $_POST['staff_note'] ) : '';
			$staff_img = isset( $_POST['staff_img'] ) && ! empty( $_POST['staff_img'] ) ? sanitize_text_field( $_POST['staff_img'] ) : '';

			$staff_username = str_replace( ' ', '-', strtolower( $staff_name) );

			if ( username_exists( $staff_username ) || email_exists( $staff_email ) ) {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Username or Email already Exist, try another one!',
				), 200);    
			}

			$staff_id = wp_insert_user( 
				array(
					'user_login' => $staff_username, 
					'user_pass' => $staff_password,
					'user_email' => $staff_email,
					'display_name' => $staff_name,
					'role' => 'bookify-staff',
				)
			);

			if ( ! is_wp_error( $staff_id ) ) {
				update_user_meta( $staff_id, 'bookify_staff_note', $staff_note );
				update_user_meta( $staff_id, 'bookify_staff_profession', $staff_profession );
				update_user_meta( $staff_id, 'bookify_staff_phone', $staff_phone );
				update_user_meta( $staff_id, 'bookify_staff_img', $staff_img );
				update_user_meta( $staff_id, 'bookify_staff_services', '' );
				update_user_meta( $staff_id, 'bookify_staff_schedule', '');
				update_user_meta( $staff_id, 'bookify_staff_special_days', '' );
				update_user_meta( $staff_id, 'bookify_staff_holidays', '' );
				
				/**
				 * Action Sends email on staff created
				 * 
				 * @since 1.0
				**/
				do_action( 'bookify_staff_created_email', $staff_id );

				return new WP_REST_Response(array(
					'success' => $staff_id,
					'message' => 'Staff has been created successfully!'
				), 200);
			} else {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Error while creating staff!'
				), 200);
			}
		}

		public function update_bookify_staff_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$current_user = wp_get_current_user();
			$staff_id = isset( $_POST['staff_id'] ) && ! empty( $_POST['staff_id'] ) ? sanitize_text_field( $_POST['staff_id'] ) : '';

			if ( ! in_array( 'administrator', $current_user->roles ) && (int) $current_user->ID !== (int) $staff_id ) {
				return new WP_Error( 'rest_forbidden', __('You do not have permission to update this staff.', 'bookify'), array( 'status' => 403 ) );
			}

			$staff_name = isset( $_POST['staff_name'] ) && ! empty( $_POST['staff_name'] ) ? sanitize_text_field( $_POST['staff_name'] ) : '';
			$staff_phone = isset( $_POST['staff_phone'] ) && ! empty( $_POST['staff_phone'] ) ? sanitize_text_field( $_POST['staff_phone'] ) : '';
			$staff_email = isset( $_POST['staff_email'] ) && ! empty( $_POST['staff_email'] ) ? sanitize_text_field( $_POST['staff_email'] ) : '';
			$staff_profession = isset( $_POST['staff_profession'] ) && ! empty( $_POST['staff_profession'] ) ? sanitize_text_field( $_POST['staff_profession'] ) : '';
			$staff_password = isset( $_POST['staff_password'] ) && ! empty( $_POST['staff_password'] ) ? sanitize_text_field( $_POST['staff_password'] ) : '';
			$staff_note = isset( $_POST['staff_note'] ) && ! empty( $_POST['staff_note'] ) ? sanitize_text_field( $_POST['staff_note'] ) : '';
			$staff_img = isset( $_POST['staff_img'] ) && ! empty( $_POST['staff_img'] ) ? sanitize_text_field( $_POST['staff_img'] ) : '';
			$staff_services = isset( $_POST['selected_services'] ) && ! empty( $_POST['selected_services'] ) ? sanitize_text_field( stripslashes( $_POST['selected_services'] ) ) : '';
			
			$general_settings = get_option( 'bookify_general_settings');
			$slot_duration = is_array( $general_settings ) && isset( $general_settings['DefaultGlobalSlotTimeDuration'] ) ? $general_settings['DefaultGlobalSlotTimeDuration'] : '30';
			$slot_interval = is_array( $general_settings ) && isset( $general_settings['DefaultGlobalSlotTimeInterval'] ) ? $general_settings['DefaultGlobalSlotTimeInterval'] : '15';
			
			$staff_slot_duration = isset( $_POST['slot_duration'] ) && ! empty( $_POST['slot_duration'] ) ? sanitize_text_field( $_POST['slot_duration'] ) : $slot_duration;
			$staff_slot_interval = isset( $_POST['slot_interval'] ) && ! empty( $_POST['slot_interval'] ) ? sanitize_text_field( $_POST['slot_interval'] ) : $slot_interval;
			
			$staff_schedule = isset( $_POST['schedules'] ) && ! empty( $_POST['schedules'] ) ? sanitize_text_field( stripslashes( $_POST['schedules'] ) ) : '';
			$staff_special_days = isset( $_POST['special_days'] ) && ! empty( $_POST['special_days'] ) ? sanitize_text_field( stripslashes( $_POST['special_days'] ) ) : '';
			$staff_holidays = isset( $_POST['holidays'] ) && ! empty( $_POST['holidays'] ) ? sanitize_text_field( stripslashes( $_POST['holidays'] ) ) : '';

			$timeslots = Bookify_Helper::bookify_split_time( json_decode( $staff_schedule, true ), $staff_slot_duration, $staff_slot_interval );
			$special_timeslots = Bookify_Helper::bookify_split_time( json_decode( $staff_special_days, true ), $staff_slot_duration, $staff_slot_interval, true );

			$args = array(
				'ID' => $staff_id,
				'user_email' => $staff_email,
				'display_name' => $staff_name,
			);

			if ( !empty( $staff_password ) ) {
				$args['user_pass'] = $staff_password;
			}

			$updated_staff = wp_update_user( 
				$args
			);

			if ( ! is_wp_error( $updated_staff ) ) {
				update_user_meta( $staff_id, 'bookify_staff_note', $staff_note );
				update_user_meta( $staff_id, 'bookify_staff_profession', $staff_profession );
				update_user_meta( $staff_id, 'bookify_staff_phone', $staff_phone );
				update_user_meta( $staff_id, 'bookify_staff_img', $staff_img );
				update_user_meta( $staff_id, 'bookify_staff_services', $staff_services );
				update_user_meta( $staff_id, 'bookify_staff_slot_duration', $staff_slot_duration );
				update_user_meta( $staff_id, 'bookify_staff_slot_interval', $staff_slot_interval );
				update_user_meta( $staff_id, 'bookify_staff_schedule', $staff_schedule );
				update_user_meta( $staff_id, 'bookify_staff_timeslots', $timeslots );
				update_user_meta( $staff_id, 'bookify_staff_special_days', $staff_special_days );
				update_user_meta( $staff_id, 'bookify_staff_special_days_timeslots', $special_timeslots );
				update_user_meta( $staff_id, 'bookify_staff_holidays', $staff_holidays );

				if ( ! empty( $staff_password ) && ! in_array( 'administrator', $current_user->roles ) ) {
					wp_logout();
					return new WP_REST_Response(array(
						'success' => true,
						'message' => 'Staff has been updated successfully!',
						'redirect' => wp_login_url(),
					), 200);
				}

				return new WP_REST_Response(array(
					'success' => $updated_staff,
					'message' => 'Staff has been updated successfully!'
				), 200);
			} else {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Error while updating staff!'
				), 200);
			}
		}

		public function delete_bookify_staff_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			global $wpdb;

			$staff_id = isset( $_POST['staff_id'] ) && ! empty( $_POST['staff_id'] ) ? sanitize_text_field( $_POST['staff_id'] ) : '';

			if ( ! $staff_id ) {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'No Staff id is selected for delete!',
				), 200);
			}

			$result = $wpdb->delete($wpdb->users, array( 'ID' => $staff_id ), array( '%d' ));

			if ( $result ) {
				$wpdb->delete($wpdb->usermeta, array( 'user_id' => $staff_id ), array( '%d' ));

				return new WP_REST_Response(array(
					'success' => $result,
					'message' => 'Staff has been deleted successfully!'
				), 200);
			} else {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Error while deleting staff!'
				), 200);
			}
		}

		public function rest_staffs_data_callback( $request ) {

			$page = $request->get_param('page');
			$pageSize = $request->get_param('pageSize');
			$search = $request->get_param('search');

			$all_services = Bookify_Service_Models::bookify_get_all_category_services();
			$all_services = Bookify_Helper::bookify_services_sort( $all_services );

			$general_settings = get_option( 'bookify_general_settings');
			$slot_duration = is_array( $general_settings ) && isset( $general_settings['DefaultGlobalSlotTimeDuration'] ) ? $general_settings['DefaultGlobalSlotTimeDuration'] : '30';
			$slot_interval = is_array( $general_settings ) && isset( $general_settings['DefaultGlobalSlotTimeInterval'] ) ? $general_settings['DefaultGlobalSlotTimeInterval'] : '15';
			$date_format = is_array( $general_settings ) && isset( $general_settings['DefaultDateFormat'] ) ? $general_settings['DefaultDateFormat'] : 'DD/MM/YY';
			$time_format = is_array( $general_settings ) && isset( $general_settings['DefaultTimeFormat'] ) ? $general_settings['DefaultTimeFormat'] : '12-hour';
			$currency = is_array( $general_settings ) && isset( $general_settings['DefaultGeneralCurrencies'] ) ? $general_settings['DefaultGeneralCurrencies'] : 'USD';
			$is_staff = false;

			if ( is_user_logged_in() ) {

				$current_user = wp_get_current_user();
				
				if ( in_array( 'bookify-staff', (array) $current_user->roles ) ) {
					$bookify_staffs = get_users( array(
						'include' => array( $current_user->ID )
					) );
					$is_staff = true;
				} else {
					$bookify_staffs = get_users( array(
						'role__in' => array( 'bookify-staff' )
					) );
				}
			} else {
				$bookify_staffs = get_users( array(
					'role__in' => array( 'bookify-staff' )
				) );
			}
			
			$staff_data = array();
			foreach ( $bookify_staffs as $staff ) {
				$assigned = 'Not Assigned';
				$services = get_user_meta($staff->ID, 'bookify_staff_services', true);
				$staff_slot_duration = get_user_meta($staff->ID, 'bookify_staff_slot_duration', true);
				$staff_slot_interval = get_user_meta($staff->ID, 'bookify_staff_slot_interval', true);
				$staff_schedule = get_user_meta($staff->ID, 'bookify_staff_schedule', true);
				$staff_special_days = get_user_meta($staff->ID, 'bookify_staff_special_days', true);
				$staff_holidays = get_user_meta($staff->ID, 'bookify_staff_holidays', true);
				if ( $services  ) {
					foreach ( json_decode( $services, true ) as $service ) {
						if ( $service['checked'] ) {
							$assigned = 'Assigned';
							break;
						}
					}
				}
				$staff_data[] = array(
					'id' => $staff->ID,
					'staff_name' => $staff->display_name,
					'staff_note' => get_user_meta($staff->ID, 'bookify_staff_note', true),
					'staff_profession' => get_user_meta($staff->ID, 'bookify_staff_profession', true),
					'staff_phone' => get_user_meta($staff->ID, 'bookify_staff_phone', true),
					'staff_email' => $staff->user_email,
					'staff_img' => get_user_meta($staff->ID, 'bookify_staff_img', true),
					'service_assigned' => $assigned,
					'staff_services' => json_decode( $services, true ),
					'staff_slot_duration' => $staff_slot_duration,
					'staff_slot_interval' => $staff_slot_interval,
					'staff_shedule' => json_decode( $staff_schedule, true ),
					'staff_special_days' => json_decode( $staff_special_days, true ),
					'staff_holidays' => json_decode( $staff_holidays, true ),
				);
			}

			if ( ! empty( $search ) ) {
				$staff_data = array_filter( $staff_data, function ( $staff ) use ( $search ) {
					$search_lower = strtolower( $search );
					return (
						strpos( strtolower( $staff['staff_name'] ), $search_lower ) !== false ||
						strpos( strtolower( $staff['staff_phone'] ), $search_lower ) !== false ||
						strpos( strtolower( $staff['staff_email'] ), $search_lower ) !== false ||
						strpos( strtolower( $staff['service_assigned'] ), $search_lower ) !== false
					);
				});
			}
		
			$startIndex = ( $page - 1 ) * $pageSize;
		
			$paginatedData = array_slice($staff_data, $startIndex, $pageSize);
		
			return new WP_REST_Response(array(
				'data' => $paginatedData,
				'total' => count($staff_data),
				'dateFormat' => $date_format,
				'timeFormat' => $time_format,
				'services' => $all_services,
				'duration'  => $slot_duration,
				'interval'  => $slot_interval,
				'currency' => $currency,
				'is_staff' => $is_staff
			), 200);
		}        
	}

	new Bookify_Staffs_Rest_API();

}
