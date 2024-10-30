<?php

namespace Bookify\Controllers\REST;

use WP_Error;
use WP_REST_Response;
use Bookify\Models\Bookify_Appointment_Models;

// don't call the file directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Bookify_Customers_Rest_API' ) ) {

	class Bookify_Customers_Rest_API {

		public function __construct() {

			add_action( 'rest_api_init' , array( $this, 'rest_api_customers' ) );
		}

		public function rest_api_customers() {

			register_rest_route('bookify/v1', '/customers', array(
				'methods'               => 'GET',
				'callback'              => array( $this, 'rest_customers_data_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			)); 

			register_rest_route('bookify/v1', '/add-customer', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'add_bookify_customer_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			));

			register_rest_route('bookify/v1', '/update-customer', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'update_bookify_customer_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			));

			register_rest_route('bookify/v1', '/delete-customer', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'delete_bookify_customer_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			));
		}

		public function verify_nonce_and_permissions( $request ) {
			$nonce = $request->get_header('X-WP-Nonce');
			$current_user = wp_get_current_user();
		
			if ( ! is_user_logged_in() ) {
				return new WP_Error( 'rest_forbidden', __('You are not logged in.', 'bookify'), array( 'status' => 401 ) );
			}

			if ( ! in_array( 'administrator', $current_user->roles ) && ! in_array( 'bookify-staff', $current_user->roles ) ) {
				return new WP_Error( 'rest_forbidden', __('You do not have permission to access this resource.', 'bookify'), array( 'status' => 403 ) );
			}
		
			return true; 
		}

		public function add_bookify_customer_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$customer_name = isset( $_POST['customer_fullname'] ) && ! empty( $_POST['customer_fullname'] ) ? sanitize_text_field( $_POST['customer_fullname'] ) : '';
			$customer_phone = isset( $_POST['customer_phone'] ) && ! empty( $_POST['customer_phone'] ) ? sanitize_text_field( $_POST['customer_phone'] ) : '';
			$customer_email = isset( $_POST['customer_email'] ) && ! empty( $_POST['customer_email'] ) ? sanitize_text_field( $_POST['customer_email'] ) : '';
			$customer_password = isset( $_POST['customer_password'] ) && ! empty( $_POST['customer_password'] ) ? sanitize_text_field( $_POST['customer_password'] ) : wp_generate_password( 8, true );
			$customer_note = isset( $_POST['customer_note'] ) && ! empty( $_POST['customer_note'] ) ? sanitize_text_field( $_POST['customer_note'] ) : '';
			$customer_img = isset( $_POST['customer_img'] ) && ! empty( $_POST['customer_img'] ) ? sanitize_text_field( $_POST['customer_img'] ) : '';

			$customer_username = str_replace( ' ', '-', strtolower( $customer_name) );

			if ( username_exists( $customer_username ) || email_exists( $customer_email ) ) {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Username or Email already Exist, try another one!',
				), 200);    
			}

			$customer_id = wp_insert_user( 
				array(
					'user_login' => $customer_username, 
					'user_pass' => $customer_password,
					'user_email' => $customer_email,
					'display_name' => $customer_name,
					'role' => 'bookify-customer',
				)
			);

			if ( ! is_wp_error( $customer_id ) ) {
				update_user_meta( $customer_id, 'bookify_customer_note', $customer_note );
				update_user_meta( $customer_id, 'bookify_customer_phone', $customer_phone );
				update_user_meta( $customer_id, 'bookify_customer_img', $customer_img );

				return new WP_REST_Response(array(
					'success' => $customer_id,
					'message' => 'Customer has been added successfully!'
				), 200);
			} else {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Error while adding customer!'
				), 200);
			}
		}

		public function update_bookify_customer_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$customer_id = isset( $_POST['customer_id'] ) && ! empty( $_POST['customer_id'] ) ? sanitize_text_field( $_POST['customer_id'] ) : '';
			$customer_name = isset( $_POST['customer_fullname'] ) && ! empty( $_POST['customer_fullname'] ) ? sanitize_text_field( $_POST['customer_fullname'] ) : '';
			$customer_phone = isset( $_POST['customer_phone'] ) && ! empty( $_POST['customer_phone'] ) ? sanitize_text_field( $_POST['customer_phone'] ) : '';
			$customer_email = isset( $_POST['customer_email'] ) && ! empty( $_POST['customer_email'] ) ? sanitize_text_field( $_POST['customer_email'] ) : '';
			$customer_password = isset( $_POST['customer_password'] ) && ! empty( $_POST['customer_password'] ) ? sanitize_text_field( $_POST['customer_password'] ) : '';
			$customer_note = isset( $_POST['customer_note'] ) && ! empty( $_POST['customer_note'] ) ? sanitize_text_field( $_POST['customer_note'] ) : '';
			$customer_img = isset( $_POST['customer_img'] ) && ! empty( $_POST['customer_img'] ) ? sanitize_text_field( $_POST['customer_img'] ) : '';

			$args = array();

			if ( $customer_password ) {
				$args = array(
					'ID' => $customer_id, 
					'user_pass' => $customer_password,
					'user_email' => $customer_email,
					'display_name' => $customer_name,
				);
			} else {
				$args = array(
					'ID' => $customer_id, 
					'user_email' => $customer_email,
					'display_name' => $customer_name,
				);
			}

			$updated_customer = wp_update_user( 
				$args
			);

			if ( ! is_wp_error( $updated_customer ) ) {
				update_user_meta( $customer_id, 'bookify_customer_note', $customer_note );
				update_user_meta( $customer_id, 'bookify_customer_phone', $customer_phone );
				update_user_meta( $customer_id, 'bookify_customer_img', $customer_img );

				return new WP_REST_Response(array(
					'success' => $updated_customer,
					'message' => 'Customer has been updated successfully!'
				), 200);
			} else {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Error while updating customer!'
				), 200);
			}
		}

		public function delete_bookify_customer_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			global $wpdb;

			$customer_id = isset( $_POST['customer_id'] ) && ! empty( $_POST['customer_id'] ) ? sanitize_text_field( $_POST['customer_id'] ) : '';

			if ( ! $customer_id ) {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'No Customer id is selected for delete!',
				), 200);
			}

			$result = $wpdb->delete($wpdb->users, array( 'ID' => $customer_id ), array( '%d' ));

			if ( $result ) {
				$wpdb->delete($wpdb->usermeta, array( 'user_id' => $customer_id ), array( '%d' ));

				return new WP_REST_Response(array(
					'success' => $result,
					'message' => 'Customer has been deleted successfully!'
				), 200);
			} else {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Error while deleting customer!'
				), 200);
			}
		}

		public function rest_customers_data_callback( $request ) {

			$page = $request->get_param('page');
			$pageSize = $request->get_param('pageSize');
			$search = $request->get_param('search');

			$general_settings = get_option( 'bookify_general_settings' );
			$date_format = is_array( $general_settings ) && isset( $general_settings['DefaultDateFormat'] ) ? $general_settings['DefaultDateFormat'] : 'DD/MM/YY';

			$bookify_customers = get_users(
				array(
					'role__in' => array( 'bookify-customer' )
				)
			);

			$customer_data = array();

			foreach ($bookify_customers as $customer) {

				$total_appointments = Bookify_Appointment_Models::bookify_get_all_appointments_by_customer( $customer->ID );
				$last_appointment = end( $total_appointments );
				$customer_data[] = array(
					'id' => $customer->ID,
					'customer_name' => $customer->display_name,
					'customer_email' => $customer->user_email,
					'customer_note' => get_user_meta($customer->ID, 'bookify_customer_note', true),
					'customer_phone' => get_user_meta($customer->ID, 'bookify_customer_phone', true),
					'customer_img' => get_user_meta($customer->ID, 'bookify_customer_img', true),
					'total_appointments' => count( $total_appointments ),
					'last_appointment' => ! empty( $total_appointments ) ? $last_appointment['appointment_date'] : '-',
				);
			}

			if ( ! empty( $search ) ) {
				$customer_data = array_filter( $customer_data, function ( $customer ) use ( $search ) {
					$search_lower = strtolower( $search );
					return (
						strpos( strtolower( $customer['customer_name'] ), $search_lower ) !== false ||
						strpos( strtolower( $customer['customer_email'] ), $search_lower ) !== false ||
						strpos( strtolower( $customer['customer_phone'] ), $search_lower ) !== false ||
						strpos( strtolower( $customer['total_appointments'] ), $search_lower ) !== false ||
						strpos( strtolower( $customer['last_appointment'] ), $search_lower ) !== false
					);
				});
			}

			$startIndex = ( $page - 1 ) * $pageSize;

			$paginatedData = array_slice($customer_data, $startIndex, $pageSize);

			return new WP_REST_Response(array(
				'data' => $paginatedData,
				'total' => count($customer_data),
				'dateFormat' => $date_format,
			), 200);
		}
	}

	new Bookify_Customers_Rest_API();

}
