<?php

namespace Bookify\Controllers\REST;

use WP_Error;
use WP_REST_Response;
use Bookify\Models\Bookify_Notification_Models;

// don't call the file directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Bookify_Notification_Rest_API' ) ) {

	class Bookify_Notification_Rest_API {

		public function __construct() {

			add_action( 'rest_api_init' , array( $this, 'rest_api_notification' ) );
		}

		public function rest_api_notification() {

			register_rest_route('bookify/v1', '/notification', array(
				'methods'               => 'GET',
				'callback'              => array( $this, 'rest_notification_data_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			)); 

			register_rest_route('bookify/v1', '/add-notification', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'rest_add_notification_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			)); 

			register_rest_route('bookify/v1', '/update-notification', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'rest_update_notification_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			));

			register_rest_route('bookify/v1', '/update-notification-state', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'rest_update_notification_state_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			));

			register_rest_route('bookify/v1', '/delete-notification', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'rest_delete_notification_callback' ),
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

		public function rest_notification_data_callback( $request ) {
			$page = $request->get_param('page');
			$pageSize = $request->get_param('pageSize');
			$search = $request->get_param('search');

			$notification_data = Bookify_Notification_Models::bookify_get_all_notifications();

			foreach ( $notification_data as $key => $value ) {
				$notification_data[ $key ]['email_sends_to'] = json_decode( $value['email_sends_to'] );
				$notification_data[ $key ]['notification_toggle'] = (bool) $value['notification_toggle'];
			}

			if ( ! empty( $search ) ) {
				$notification_data = array_filter( $notification_data, function ( $notification ) use ( $search ) {
					$search_lower = strtolower( $search );
					return (
						strpos( strtolower( $notification['notification_name'] ), $search_lower ) !== false ||
						strpos( strtolower( $notification['notification_event'] ), $search_lower ) !== false
					);
				});
			}

			$startIndex = ( $page - 1 ) * $pageSize;

			$paginatedData = array_slice($notification_data, $startIndex, $pageSize);

			return new WP_REST_Response(array(
				'notificationData' => $paginatedData,
				'total' => count($notification_data),
			), 200);
		}

		public function rest_add_notification_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$notificationName = isset( $_POST['notificationName'] ) && ! empty( $_POST['notificationName'] ) ? sanitize_text_field( $_POST['notificationName'] ) : '';
			$notificationToggle = isset( $_POST['notificationToggle'] ) && ! empty( $_POST['notificationToggle'] ) ? sanitize_text_field( $_POST['notificationToggle'] ) : true;
			$notificationEvent = isset( $_POST['notificationEvent'] ) && ! empty( $_POST['notificationEvent'] ) ? sanitize_text_field( $_POST['notificationEvent'] ) : 'Appointment Requested';
			$emailSubject = isset( $_POST['emailSubject'] ) && ! empty( $_POST['emailSubject'] ) ? sanitize_text_field( $_POST['emailSubject'] ) : '';
			$emailBody = isset( $_POST['emailBody'] ) && ! empty( $_POST['emailBody'] ) ? wp_kses_post( $_POST['emailBody'] ) : '';
			$emailToAdmin = isset( $_POST['emailToAdmin'] ) && ! empty( $_POST['emailToAdmin'] ) ? sanitize_text_field( $_POST['emailToAdmin'] ) : true;
			$emailToStaff = isset( $_POST['emailToStaff'] ) && ! empty( $_POST['emailToStaff'] ) ? sanitize_text_field( $_POST['emailToStaff'] ) : false;
			$emailToCustomer = isset( $_POST['emailToCustomer'] ) && ! empty( $_POST['emailToCustomer'] ) ? sanitize_text_field( $_POST['emailToCustomer'] ) : false;

			$email_sends_to = json_encode( array(
				'admin' => $emailToAdmin,
				'staff' => $emailToStaff,
				'customer' => $emailToCustomer
			), true );

			if ( ! $notificationName ||  ! $emailSubject ||  ! $emailBody ) {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Please Fill the required fields!'
				), 200);
			}

			$notification_data = array(
				'notification_name' => $notificationName,
				'notification_event' => $notificationEvent,
				'notification_toggle' => $notificationToggle == 'true' ? 1 : 0,
				'notification_email_subject' => $emailSubject,
				'notification_email_body' => $emailBody,
				'email_sends_to' =>  $email_sends_to
			);

			$notification_id = Bookify_Notification_Models::bookify_add_notification( $notification_data );
			
			if ( $notification_id ) {
				return new WP_REST_Response(array(
					'success' => true,
					'message' => 'Notification has been saved successfully!'
				), 200);
			} else {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Error while adding notification!'
				), 200);
			}
		}

		public function rest_update_notification_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$notification_id = isset( $_POST['notification_id'] ) && ! empty( $_POST['notification_id'] ) ? sanitize_text_field( $_POST['notification_id'] ) : '';
			$notificationName = isset( $_POST['notificationName'] ) && ! empty( $_POST['notificationName'] ) ? sanitize_text_field( $_POST['notificationName'] ) : '';
			$notificationToggle = isset( $_POST['notificationToggle'] ) && ! empty( $_POST['notificationToggle'] ) ? sanitize_text_field( $_POST['notificationToggle'] ) : true;
			$notificationEvent = isset( $_POST['notificationEvent'] ) && ! empty( $_POST['notificationEvent'] ) ? sanitize_text_field( $_POST['notificationEvent'] ) : 'Appointment Requested';
			$emailSubject = isset( $_POST['emailSubject'] ) && ! empty( $_POST['emailSubject'] ) ? sanitize_text_field( $_POST['emailSubject'] ) : '';
			$emailBody = isset( $_POST['emailBody'] ) && ! empty( $_POST['emailBody'] ) ? wp_kses_post( $_POST['emailBody'] ) : '';
			$emailToAdmin = isset( $_POST['emailToAdmin'] ) && ! empty( $_POST['emailToAdmin'] ) ? sanitize_text_field( $_POST['emailToAdmin'] ) : true;
			$emailToStaff = isset( $_POST['emailToStaff'] ) && ! empty( $_POST['emailToStaff'] ) ? sanitize_text_field( $_POST['emailToStaff'] ) : false;
			$emailToCustomer = isset( $_POST['emailToCustomer'] ) && ! empty( $_POST['emailToCustomer'] ) ? sanitize_text_field( $_POST['emailToCustomer'] ) : false;

			$email_sends_to = json_encode( array(
				'admin' => $emailToAdmin,
				'staff' => $emailToStaff,
				'customer' => $emailToCustomer
			), true );

			if ( ! $notification_id || ! $notificationName ||  ! $emailSubject ||  ! $emailBody ) {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Please Fill the required fields!'
				), 200);
			}

			$notification_data = array( 
				'notification_name' => $notificationName,
				'notification_event' => $notificationEvent,
				'notification_toggle' => $notificationToggle == 'true' ? 1 : 0,
				'notification_email_subject' => $emailSubject,
				'notification_email_body' => $emailBody,
				'email_sends_to'    =>  $email_sends_to
			);

			$result = Bookify_Notification_Models::bookify_update_notification( $notification_id, $notification_data );
			
			if ( $result ) {
				return new WP_REST_Response(array(
					'success' => $result,
					'message' => 'Notification has been updated successfully!'
				), 200);
			} else {
				return new WP_REST_Response(array(
					'success' => $result,
					'message' => 'Error while updating notification!'
				), 200);
			}
		}

		public function rest_update_notification_state_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$notification_id = isset( $_POST['notification_id'] ) && ! empty( $_POST['notification_id'] ) ? sanitize_text_field( $_POST['notification_id'] ) : '';
			$notificationState = isset( $_POST['notificationState'] ) && ! empty( $_POST['notificationState'] ) ? sanitize_text_field( $_POST['notificationState'] ) : true;
			
			$notification_data = array( 
				'notification_toggle' => $notificationState == 'true' ? 1 : 0,
			);

			$result = Bookify_Notification_Models::bookify_update_notification_state( $notification_id, $notification_data );
			
			if ( $result ) {
				return new WP_REST_Response(array(
					'success' => $result,
					'message' => 'Notification has been updated successfully!'
				), 200);
			} else {
				return new WP_REST_Response(array(
					'success' => $result,
					'message' => 'Error while updating notification!'
				), 200);
			}
		}

		public function rest_delete_notification_callback( $request ) { 

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$notification_id = isset( $_POST['notification_id'] ) && ! empty( $_POST['notification_id'] ) ? sanitize_text_field( $_POST['notification_id'] ) : '';

			if ( ! $notification_id ) {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'No notification id is selected for deleting!',
				), 200);
			}

			$result = Bookify_Notification_Models::bookify_delete_notification( $notification_id );

			if ( $result ) {
				return new WP_REST_Response(array(
					'success' => $result,
					'message' => 'Notification has been deleted successfully!'
				), 200);
			} else {
				return new WP_REST_Response(array(
					'success' => $result,
					'message' => 'Error while deleitng notification!'
				), 200);
			}
		}
	}

	new Bookify_Notification_Rest_API();

}
