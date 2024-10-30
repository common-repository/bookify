<?php

namespace Bookify\Controllers\REST;

use WP_REST_Response;
use WP_Error;
use Bookify\Models\Bookify_Payment_Models;
use Bookify\Models\Bookify_Service_Models;

// don't call the file directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Bookify_Payment_Rest_API' ) ) {

	class Bookify_Payment_Rest_API {

		public function __construct() {

			add_action( 'rest_api_init' , array( $this, 'rest_api_payment' ) );
		}

		public function rest_api_payment() {

			register_rest_route('bookify/v1', '/payment', array(
				'methods'               => 'GET',
				'callback'              => array( $this, 'rest_payment_data_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			)); 

			register_rest_route('bookify/v1', '/appointment-payment', array(
				'methods'               => 'GET',
				'callback'              => array( $this, 'rest_payment_modal_data_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			)); 

			register_rest_route('bookify/v1', '/add-payment', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'rest_add_payment_data_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			));

			register_rest_route('bookify/v1', '/update-payment', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'rest_update_payment_data_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			));

			register_rest_route('bookify/v1', '/delete-payment', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'rest_delete_payment_data_callback' ),
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

		public function rest_delete_payment_data_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$payment_id = isset( $_POST['payment_id'] ) && ! empty( $_POST['payment_id'] ) ? sanitize_text_field( $_POST['payment_id'] ) : '';
			$total_amount = isset( $_POST['total_amount'] ) && ! empty( $_POST['total_amount'] ) ? sanitize_text_field( $_POST['total_amount'] ) : '';
			$appointment_id = isset( $_POST['appointment_id'] ) && ! empty( $_POST['appointment_id'] ) ? sanitize_text_field( $_POST['appointment_id'] ) : '';

			if ( ! $payment_id || ! $appointment_id ) {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'No payment id or appointment id provided!',
				), 200);
			}

			$result = Bookify_Payment_Models::bookify_delete_payment( $payment_id );

			if ( $result ) {

				$payments = Bookify_Payment_Models::bookify_get_payment_by_appointment( $appointment_id, 'desc' );

				if ( count( $payments ) > 0 ) {

					$paid_total = 0;
					foreach ( $payments as $payment ) {
						$paid_total += $payment['payment_paid'];
					}

					$new_due_amount = max(0, $total_amount - $paid_total);
			
					foreach ( $payments as $payment ) {
						$data = array(
							'payment_due' => max(0, $new_due_amount),
						);
						
						Bookify_Payment_Models::bookify_update_payment( $payment['id'], $data );
						$new_due_amount += $payment['payment_paid'];
					}
				}

				return new WP_REST_Response(array(
					'success' => $result,
					'message' => 'Payment has been deleted successfully!'
				), 200);
			} else {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Error while deleitng payment!'
				), 200);
			}
		}

		public function rest_update_payment_data_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$payment_id = isset( $_POST['payment_id'] ) && ! empty( $_POST['payment_id'] ) ? sanitize_text_field( $_POST['payment_id'] ) : '';
			$payment_status = isset( $_POST['payment_status'] ) && ! empty( $_POST['payment_status'] ) ? sanitize_text_field( $_POST['payment_status'] ) : '';

			if ( ! $payment_id || ! $payment_status ) {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Please Fill the required fields!',
				), 200);
			}

			$data = array(
				'payment_status' => $payment_status,
			);

			$result = Bookify_Payment_Models::bookify_update_payment( $payment_id, $data );

			if ( $result ) {
				return new WP_REST_Response(array(
					'success' => $result,
					'message' => 'Payment Status has been updated successfully!'
				), 200);
			} else {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Error while updating Payment Status!'
				), 200);
			}
		}

		public function rest_payment_modal_data_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$appointment_id = $request->get_param('id');

			$payment_data = Bookify_Payment_Models::bookify_get_payment_by_appointment( $appointment_id );

			return new WP_REST_Response(array(
				'data' => $payment_data,
			), 200);
		}

		public function rest_add_payment_data_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$appointment_id = isset( $_POST['appointment_id'] ) && ! empty( $_POST['appointment_id'] ) ? sanitize_text_field( $_POST['appointment_id'] ) : '';
			$appointment_total = isset( $_POST['appointment_total'] ) && ! empty( $_POST['appointment_total'] ) ? sanitize_text_field( $_POST['appointment_total'] ) : '';
			$payment_price = isset( $_POST['payment_price'] ) && ! empty( $_POST['payment_price'] ) ? sanitize_text_field( $_POST['payment_price'] ) : '';
			$payment_due = isset( $_POST['payment_due'] ) && ! empty( $_POST['payment_due'] ) ? sanitize_text_field( $_POST['payment_due'] ) : '';
			$payment_method = isset( $_POST['payment_method'] ) && ! empty( $_POST['payment_method'] ) ? sanitize_text_field( ucwords( $_POST['payment_method'] ) ) : '';
			$payment_status = isset( $_POST['payment_status'] ) && ! empty( $_POST['payment_status'] ) ? sanitize_text_field( $_POST['payment_status'] ) : '';

			if ( ! $appointment_id ||  ! $appointment_total || ! $payment_price ||  ! $payment_method || ! $payment_status ) {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Please Fill the required fields!',
				), 200);
			}

			$payment_data = array(
				'appointment_id' => $appointment_id,
				'payment_method' => $payment_method,
				'payment_total' => $appointment_total,
				'payment_paid' => $payment_price,
				'payment_due' => $payment_due,
				'payment_status' => $payment_status,
			);

			$payment_id = Bookify_Payment_Models::bookify_add_payment( $payment_data );
			
			if ( ! is_wp_error( $payment_id ) ) {
				return new WP_REST_Response(array(
					'success' => $payment_id,
					'message' => 'Payment has been created successfully!'
				), 200);
			} else {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Error while creating payment!'
				), 200);
			}
		}

		public function rest_payment_data_callback( $request ) {

			$page = $request->get_param('page');
			$pageSize = $request->get_param('pageSize');
			$search = $request->get_param('search');
			$date = $request->get_param('date');
			$staff = $request->get_param('staff');
			$service = $request->get_param('service');
			$customer = $request->get_param('customer');
			$status = $request->get_param('status');

			$payment_data = Bookify_Payment_Models::bookify_get_all_payments( $date, $staff, $service, $customer, $status );
			$all_services = Bookify_Service_Models::bookify_get_all_services();

			
			$general_settings = get_option( 'bookify_general_settings');
			$currency = is_array( $general_settings ) && isset( $general_settings['DefaultGeneralCurrencies'] ) ? $general_settings['DefaultGeneralCurrencies'] : 'USD';
			$date_format = is_array( $general_settings ) && isset( $general_settings['DefaultDateFormat'] ) ? $general_settings['DefaultDateFormat'] : 'DD/MM/YY';

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

			$all_staffs = array();
			$bookify_staffs = get_users(
				array(
					'role__in' => array( 'bookify-staff' )
				)
			);

			if ( $bookify_staffs ) {
				foreach ( $bookify_staffs as $staff ) {
					$all_staffs[] = array(
						'id' => $staff->ID,
						'staff_name' => $staff->display_name,
					);
				}
			}

			if ( ! empty( $search ) ) {
				$payment_data = array_filter( $payment_data, function ( $payment ) use ( $search ) {
					$search_lower = strtolower( $search );
					return (
						strpos( strtolower( $payment['appointment_date'] ), $search_lower ) !== false ||
						strpos( strtolower( $payment['appointment_customer_name'] ), $search_lower ) !== false ||
						strpos( strtolower( $payment['appointment_customer_email'] ), $search_lower ) !== false ||
						strpos( strtolower( $payment['appointment_staff_name'] ), $search_lower ) !== false ||
						strpos( strtolower( $payment['appointment_staff_email'] ), $search_lower ) !== false ||
						strpos( strtolower( $payment['service_name'] ), $search_lower ) !== false ||
						strpos( strtolower( $payment['method'] ), $search_lower ) !== false ||
						strpos( strtolower( $payment['total'] ), $search_lower ) !== false ||
						strpos( strtolower( $payment['paid'] ), $search_lower ) !== false ||
						strpos( strtolower( $payment['due'] ), $search_lower ) !== false ||
						strpos( strtolower( $payment['status'] ), $search_lower ) !== false
					);
				});
			}

			$startIndex = ( $page - 1 ) * $pageSize;

			$paginatedData = array_slice($payment_data, $startIndex, $pageSize);

			return new WP_REST_Response(array(
				'data' => $paginatedData,
				'total' => count($payment_data),
				'staffs' => $all_staffs,
				'services' => $all_services,
				'customers' => $all_customers,
				'currency' => $currency,
				'dateFormat' => $date_format,
			), 200);
		}
	}

	new Bookify_Payment_Rest_API();

}
