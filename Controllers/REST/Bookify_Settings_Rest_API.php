<?php

namespace Bookify\Controllers\REST;

use WP_Error;
use WP_REST_Response;

// don't call the file directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Bookify_Settings_Rest_API' ) ) {

	class Bookify_Settings_Rest_API {

		public function __construct() {

			add_action( 'rest_api_init' , array( $this, 'rest_api_general_settings' ) );
		}

		public function rest_api_general_settings() {

			register_rest_route('bookify/v1', '/settings', array(
				'methods'               => 'GET',
				'callback'              => array( $this, 'rest_settings_data_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			)); 

			register_rest_route('bookify/frontend/v1', '/settings', array(
				'methods'               => 'GET',
				'callback'              => array( $this, 'rest_frontend_settings_data_callback' ),
				'permission_callback'   => array( $this, 'frontend_nonce_verification' )
			)); 

			register_rest_route('bookify/v1', '/save-general-settings', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'save_general_settings_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			));

			register_rest_route('bookify/v1', '/save-company-details', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'save_company_details_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			));

			register_rest_route('bookify/v1', '/save-payment-settings', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'save_payment_settings_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			));

			register_rest_route('bookify/v1', '/save-integration-settings', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'save_integration_settings_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			));

			register_rest_route('bookify/v1', '/save-notification-settings', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'save_notification_settings_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			));
		}

		public function frontend_nonce_verification( $request ) {
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

		public function rest_frontend_settings_data_callback() {
			$settings = array();

			$general_settings = get_option( 'bookify_general_settings' );
			$payment_settings = get_option( 'bookify_payment_settings' );

			$settings['general']['DefaultWeekStartOn'] = is_array( $general_settings ) && isset( $general_settings['DefaultWeekStartOn'] ) ? sanitize_text_field( $general_settings['DefaultWeekStartOn'] ) : 'Saturday';
			$settings['general']['DefaultPriorToBooking'] = is_array( $general_settings ) && isset( $general_settings['DefaultPriorToBooking'] ) ? sanitize_text_field( $general_settings['DefaultPriorToBooking'] ) : 'Disable';
			$settings['general']['PriorTimeToBooking'] = is_array( $general_settings ) && isset( $general_settings['PriorTimeToBooking'] ) ? sanitize_text_field( $general_settings['PriorTimeToBooking'] ) : '0';
			$settings['general']['DefaultGeneralCurrencies'] = is_array( $general_settings ) && isset( $general_settings['DefaultGeneralCurrencies'] ) ? sanitize_text_field( $general_settings['DefaultGeneralCurrencies'] ) : 'USD';
			$settings['payment'] = isset( $payment_settings ) && ! empty( $payment_settings ) ? sanitize_text_field( $payment_settings ) : '';

			return $settings;
		}

		public function rest_settings_data_callback() {
			$settings = array();
			$settings['general'] = get_option( 'bookify_general_settings' );
			$settings['company'] = get_option( 'bookify_company_details' );
			$settings['payment'] = get_option( 'bookify_payment_settings' );
			$settings['integration'] = get_option( 'bookify_integration_settings' );
			$settings['notification'] = get_option( 'bookify_notification_settings' );

			return $settings;
		}

		public function save_general_settings_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$bookify_general_settings = array();

			$bookify_general_settings['DefaultGlobalSlotTimeDuration'] = isset( $_POST['DefaultGlobalSlotTimeDuration'] ) && ! empty( $_POST['DefaultGlobalSlotTimeDuration'] ) ? sanitize_text_field( $_POST['DefaultGlobalSlotTimeDuration'] ) : '30';
			$bookify_general_settings['DefaultGlobalSlotTimeInterval'] = isset( $_POST['DefaultGlobalSlotTimeInterval'] ) && ! empty( $_POST['DefaultGlobalSlotTimeInterval'] ) ? sanitize_text_field( $_POST['DefaultGlobalSlotTimeInterval'] ) : '15';
			$bookify_general_settings['DefaultWeekStartOn'] = isset( $_POST['DefaultWeekStartOn'] ) && ! empty( $_POST['DefaultWeekStartOn'] ) ? sanitize_text_field( $_POST['DefaultWeekStartOn'] ) : 'Saturday';
			$bookify_general_settings['DefaultAppointmentStatus'] = isset( $_POST['DefaultAppointmentStatus'] ) && ! empty( $_POST['DefaultAppointmentStatus'] ) ? sanitize_text_field( $_POST['DefaultAppointmentStatus'] ) : 'Pending';
			$bookify_general_settings['DefaultTimeFormat'] = isset( $_POST['DefaultTimeFormat'] ) && ! empty( $_POST['DefaultTimeFormat'] ) ? sanitize_text_field( $_POST['DefaultTimeFormat'] ) : '12-hour';
			$bookify_general_settings['DefaultDateFormat'] = isset( $_POST['DefaultDateFormat'] ) && ! empty( $_POST['DefaultDateFormat'] ) ? sanitize_text_field( $_POST['DefaultDateFormat'] ) : 'DD/MM/YY';
			$bookify_general_settings['DefaultGeneralCurrencies'] = isset( $_POST['DefaultGeneralCurrencies'] ) && ! empty( $_POST['DefaultGeneralCurrencies'] ) ? sanitize_text_field( $_POST['DefaultGeneralCurrencies'] ) : 'USD';
			$bookify_general_settings['DefaultPriorToBooking'] = isset( $_POST['DefaultPriorToBooking'] ) && ! empty( $_POST['DefaultPriorToBooking'] ) ? sanitize_text_field( $_POST['DefaultPriorToBooking'] ) : 'Disable';
			$bookify_general_settings['PriorTimeToBooking'] = isset( $_POST['PriorTimeToBooking'] ) && ! empty( $_POST['PriorTimeToBooking'] ) ? sanitize_text_field( $_POST['PriorTimeToBooking'] ) : '3';
			$bookify_general_settings['usersCanBook'] = isset( $_POST['usersCanBook'] ) && ! empty( $_POST['usersCanBook'] ) ? sanitize_text_field( $_POST['usersCanBook'] ) : 'registerAfterBook';
		
			$result = update_option( 'bookify_general_settings', $bookify_general_settings );

			if ( $result ) {
				return new WP_REST_Response(array(
					'success' => $result,
					'message' => 'General settings has been saved successfully!'
				), 200);
			} else {
				return new WP_REST_Response(array(
					'success' => $result,
					'message' => 'No changes have been made to the form.'
				), 200);
			}
		}

		public function save_company_details_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$bookify_company_details = array();

			$bookify_company_details['companyName'] = isset( $_POST['companyName'] ) && ! empty( $_POST['companyName'] ) ? sanitize_text_field( $_POST['companyName'] ) : '';
			$bookify_company_details['address'] = isset( $_POST['address'] ) && ! empty( $_POST['address'] ) ? sanitize_text_field( $_POST['address'] ) : '';
			$bookify_company_details['phoneNumber'] = isset( $_POST['phoneNumber'] ) && ! empty( $_POST['phoneNumber'] ) ? sanitize_text_field( $_POST['phoneNumber'] ) : '';
			$bookify_company_details['website'] = isset( $_POST['website'] ) && ! empty( $_POST['website'] ) ? sanitize_text_field( $_POST['website'] ) : '';
			$bookify_company_details['image'] = isset( $_POST['image'] ) && ! empty( $_POST['image'] ) ? sanitize_text_field( $_POST['image'] ) : '';

			$result = update_option( 'bookify_company_details', $bookify_company_details );

			if ( $result ) {
				return new WP_REST_Response(array(
					'success' => $result,
					'message' => 'Company details has been saved successfully!'
				), 200);
			} else {
				return new WP_REST_Response(array(
					'success' => $result,
					'message' => 'No changes have been made to the form.'
				), 200);
			}
		}

		public function save_payment_settings_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$bookify_payment_settings = array();

			$bookify_payment_settings = isset( $_POST['payment_gateways'] ) && ! empty( $_POST['payment_gateways'] ) ? sanitize_text_field( stripslashes( $_POST['payment_gateways'] ) ) : '';
			
			
			$result = update_option( 'bookify_payment_settings', $bookify_payment_settings );

			if ( $result ) {
				return new WP_REST_Response(array(
					'success' => $result,
					'message' => 'Payment settings has been saved successfully!'
				), 200);
			} else {
				return new WP_REST_Response(array(
					'success' => $result,
					'message' => 'No changes have been made to the form.'
				), 200);
			}
		}

		public function save_integration_settings_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$bookify_integration_settings = array();

			$bookify_integration_settings['GoogleClientID'] = isset( $_POST['GoogleClientID'] ) && ! empty( $_POST['GoogleClientID'] ) ? sanitize_text_field( $_POST['GoogleClientID'] ) : '';
			$bookify_integration_settings['GoogleClientSecret'] = isset( $_POST['GoogleClientSecret'] ) && ! empty( $_POST['GoogleClientSecret'] ) ? sanitize_text_field( $_POST['GoogleClientSecret'] ) : '';
			
			$result = update_option( 'bookify_integration_settings', $bookify_integration_settings );

			if ( $result ) {
				return new WP_REST_Response(array(
					'success' => $result,
					'message' => 'Integration settings has been saved successfully!'
				), 200);
			} else {
				return new WP_REST_Response(array(
					'success' => $result,
					'message' => 'No changes have been made to the form.'
				), 200);
			}
		}

		public function save_notification_settings_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$bookify_notification_settings = array();

			$bookify_notification_settings['senderName'] = isset( $_POST['senderName'] ) && ! empty( $_POST['senderName'] ) ? sanitize_text_field( $_POST['senderName'] ) : '';
			$bookify_notification_settings['senderEmail'] = isset( $_POST['senderEmail'] ) && ! empty( $_POST['senderEmail'] ) ? sanitize_text_field( $_POST['senderEmail'] ) : '';
			
			$result = update_option( 'bookify_notification_settings', $bookify_notification_settings );

			if ( $result ) {
				return new WP_REST_Response(array(
					'success' => $result,
					'message' => 'Notification settings has been saved successfully!'
				), 200);
			} else {
				return new WP_REST_Response(array(
					'success' => $result,
					'message' => 'No changes have been made to the form.'
				), 200);
			}
		}
	}

	new Bookify_Settings_Rest_API();

}
