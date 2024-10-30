<?php

namespace Bookify\Controllers\REST;

use WP_Error;
use WP_REST_Response;
use Bookify\Models\Bookify_Category_Models;
use Bookify\Models\Bookify_Service_Models;

// don't call the file directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Bookify_Services_Rest_API' ) ) {

	class Bookify_Services_Rest_API {

		public function __construct() {

			add_action( 'rest_api_init' , array( $this, 'rest_api_service_category' ) );
		}

		public function rest_api_service_category() {

			register_rest_route('bookify/v1', '/services', array(
				'methods'               => 'GET',
				'callback'              => array( $this, 'rest_services_data_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			)); 

			register_rest_route('bookify/v1', '/categories', array(
				'methods'               => 'GET',
				'callback'              => array( $this, 'rest_categories_data_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			)); 

			register_rest_route('bookify/v1', '/update-service', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'rest_update_service_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			));

			register_rest_route('bookify/v1', '/add-service', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'rest_add_service_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			));

			register_rest_route('bookify/v1', '/delete-service', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'rest_delete_service_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			));

			register_rest_route('bookify/v1', '/delete-category', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'rest_delete_category_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			));

			register_rest_route('bookify/v1', '/add-category', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'rest_add_category_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			)); 

			register_rest_route('bookify/v1', '/update-category', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'rest_update_category_callback' ),
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

		public function rest_delete_service_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$service_id = isset( $_POST['service_id'] ) && ! empty( $_POST['service_id'] ) ? sanitize_text_field( $_POST['service_id'] ) : '';

			if ( ! $service_id ) {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'No service id is selected for deleting!',
				), 200);
			}

			$result = Bookify_Service_Models::bookify_delete_service( $service_id );

			if ( $result ) {
				return new WP_REST_Response(array(
					'success' => $result,
					'message' => 'Service has been deleted successfully!'
				), 200);
			} else {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Error while deleting Service!'
				), 200);
			}
		}

		public function rest_update_service_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$service_id = isset( $_POST['service_id'] ) && ! empty( $_POST['service_id'] ) ? sanitize_text_field( $_POST['service_id'] ) : '';
			$service_name = isset( $_POST['service_name'] ) && ! empty( $_POST['service_name'] ) ? sanitize_text_field( $_POST['service_name'] ) : '';
			$service_price = isset( $_POST['service_price'] ) && ! empty( $_POST['service_price'] ) ? sanitize_text_field( abs( $_POST['service_price'] ) ) : '0';
			$service_category = isset( $_POST['service_category'] ) && ! empty( $_POST['service_category'] ) ? sanitize_text_field( $_POST['service_category'] ) : 'none';
			$service_location = isset( $_POST['service_location'] ) && ! empty( $_POST['service_location'] ) ? sanitize_text_field( stripslashes( $_POST['service_location'] ) ) : '';
			$service_img = isset( $_POST['service_img'] ) && ! empty( $_POST['service_img'] ) ? sanitize_text_field( $_POST['service_img'] ) : '';
			$note = isset( $_POST['note'] ) && ! empty( $_POST['note'] ) ? sanitize_text_field( $_POST['note'] ) : '';

			if ( ! $service_id || ! $service_name || ! $service_price || ! $service_category ) {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'respected fields must not be empty!',
				), 200);
			}

			$data = array(
				'service_name' => $service_name,
				'service_price' => $service_price,
				'service_category' => $service_category,
				'service_location' => $service_location,
				'service_img' => $service_img,
				'service_note' => $note,
			);

			$result = Bookify_Service_Models::bookify_update_service( $service_id, $data );

			if ( $result ) {
				return new WP_REST_Response(array(
					'success' => $result,
					'message' => 'Service has been updated successfully!'
				), 200);
			} else {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Error while updating Service!'
				), 200);
			}
		}

		public function rest_add_service_callback( $request ) {    

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$service_name = isset( $_POST['service_name'] ) && ! empty( $_POST['service_name'] ) ? sanitize_text_field( $_POST['service_name'] ) : '';
			$service_price = isset( $_POST['service_price'] ) && ! empty( $_POST['service_price'] ) ? sanitize_text_field( abs( $_POST['service_price'] ) ) : '0';
			$service_category = isset( $_POST['service_category'] ) && ! empty( $_POST['service_category'] ) ? sanitize_text_field( $_POST['service_category'] ) : 'none';
			$service_location = isset( $_POST['service_location'] ) && ! empty( $_POST['service_location'] ) ? sanitize_text_field( stripslashes( $_POST['service_location'] ) ) : '';
			$service_img = isset( $_POST['service_img'] ) && ! empty( $_POST['service_img'] ) ? sanitize_text_field( $_POST['service_img'] ) : '';
			$note = isset( $_POST['note'] ) && ! empty( $_POST['note'] ) ? sanitize_text_field( $_POST['note'] ) : '';

			if ( ! $service_name ||  ! $service_price ||  ! $service_category ) {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Please Fill the required fields!',
				), 200);
			}

			$service_data = array(
				'service_name' => $service_name,
				'service_price' => $service_price,
				'service_category' => $service_category,
				'service_location' => $service_location,
				'service_img' => $service_img,
				'service_note' => $note,
			);

			$service_id = Bookify_Service_Models::bookify_add_service( $service_data );

			if ( $service_id ) {
				return new WP_REST_Response(array(
					'success' => $service_id,
					'message' => 'Service has been added successfully!'
				), 200);
			} else {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Error while adding Service!'
				), 200);
			}
		}

		public function rest_update_category_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$category_id = isset( $_POST['category_id'] ) && ! empty( $_POST['category_id'] ) ? sanitize_text_field( $_POST['category_id'] ) : '';
			$category_name = isset( $_POST['category_name'] ) && ! empty( $_POST['category_name'] ) ? sanitize_text_field( $_POST['category_name'] ) : '';
			$category_slug = isset( $_POST['category_slug'] ) && ! empty( $_POST['category_slug'] ) ? sanitize_text_field( $_POST['category_slug'] ) : '';

			if ( ! $category_id || ! $category_name || ! $category_slug ) {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'respected fields must not be empty!',
				), 200);
			}

			$data = array(
				'category_name' => $category_name,
				'category_slug' => $category_slug,
			);

			$result = Bookify_Category_Models::bookify_update_service_category( $category_id, $data );

			if ( $result ) {
				return new WP_REST_Response(array(
					'success' => $result,
					'message' => 'Service category has been updated successfully!'
				), 200);
			} else {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Error while updating Service category!'
				), 200);
			}
		}

		public function rest_delete_category_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}
			
			$category_id = isset( $_POST['category_id'] ) && ! empty( $_POST['category_id'] ) ? sanitize_text_field( $_POST['category_id'] ) : '';

			if ( ! $category_id ) {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'No Category id is selected for deleting!',
				), 200);
			}

			$result = Bookify_Category_Models::bookify_delete_service_category( $category_id );

			if ( $result ) {
				return new WP_REST_Response(array(
					'success' => $result,
					'message' => 'Service category has been deleted successfully!'
				), 200);
			} else {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Error while deleting Service category!'
				), 200);
			}
		}

		public function rest_categories_data_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$categories = Bookify_Category_Models::bookify_get_all_service_categories();

			return new WP_REST_Response(array(
				'categoryData' => $categories,
			), 200);
		}

		public function rest_add_category_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$category_name = isset( $_POST['category_name'] ) && ! empty( $_POST['category_name'] ) ? sanitize_text_field( $_POST['category_name'] ) : '';
			$category_slug = isset( $_POST['category_slug'] ) && ! empty( $_POST['category_slug'] ) ? sanitize_text_field( $_POST['category_slug'] ) : '';

			if ( ! $category_name ||  ! $category_slug ) {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Please Fill the Category Name & Slug',
				), 200);
			}

			$category_data = array(
				'category_name' => $category_name,
				'category_slug' => $category_slug,
			);

			$category_id = Bookify_Category_Models::bookify_add_service_category( $category_data );

			if ( $category_id ) {
				return new WP_REST_Response(array(
					'success' => $category_id,
					'message' => 'Service category has been added successfully!'
				), 200);
			} else {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => 'Error while adding Service category!'
				), 200);
			}
		}

		public function rest_services_data_callback( $request ) {
			$page = $request->get_param('page');
			$pageSize = $request->get_param('pageSize');
			$categories = $request->get_param('categories');
			$search = $request->get_param('search');

			$service_data = Bookify_Service_Models::bookify_get_all_category_services( $categories );

			$general_settings = get_option( 'bookify_general_settings');
			$currency = is_array( $general_settings ) && isset( $general_settings['DefaultGeneralCurrencies'] ) ? $general_settings['DefaultGeneralCurrencies'] : 'USD';

			if ( ! empty( $search ) ) {
				$service_data = array_filter( $service_data, function ( $service ) use ( $search ) {
					$search_lower = strtolower( $search );
					return (
						strpos( strtolower( $service['service_name'] ), $search_lower ) !== false ||
						strpos( strtolower( $service['category_name'] ), $search_lower ) !== false ||
						strpos( strtolower( $service['service_price'] ), $search_lower ) !== false
					);
				});
			}

			$startIndex = ( $page - 1 ) * $pageSize;

			$paginatedData = array_slice($service_data, $startIndex, $pageSize);

			return new WP_REST_Response(array(
				'serviceData' => $paginatedData,
				'total' => count($service_data),
				'currency' => $currency
			), 200);
		}
	}

}
