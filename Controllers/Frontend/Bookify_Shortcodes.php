<?php 

namespace Bookify\Controllers\Frontend;

// don't call the file directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Bookify_Shortcodes' ) ) {

	class Bookify_Shortcodes {

		public function __construct() { 

			add_shortcode( 'bookify_bookings', array( $this, 'render_bookings' ) );
			add_shortcode( 'bookify_appointments', array( $this, 'render_appointments' ) );
		}

		public function render_appointments() {
			if ( is_user_logged_in() ) {

				wp_localize_script('bookify-appointments-script', 'wpbAptApp', array(
					'root' => esc_url_raw( rest_url() ),
					'nonce' => wp_create_nonce('wp_rest'),
				));

				wp_enqueue_script( 'bookify-appointments-script' );

				return '<div id="bookify-appointments" style="max-width:100%;"></div>';

			} else {
				return '<div id="bookify-non-login">
					<span>Please login to see your appointments!</span>
				</div>';
			}
		}

		public function render_bookings() {

			wp_enqueue_style( 'bookify-frontend-style' );

			$customer_data = array(
				'id' => 0,
				'fname' => '',
				'lname' => '',
				'email' => '',
				'phone' => ''
			);

			$general_settings = get_option( 'bookify_general_settings' );

			if ( is_array( $general_settings ) && isset( $general_settings['usersCanBook'] ) && 'onlyRegistered' == $general_settings['usersCanBook'] ) {

				if ( is_user_logged_in() ) {

					$user = wp_get_current_user();

					if ( in_array( 'bookify-customer', (array) $user->roles ) ) {

						$customer_data = array(
							'id' => $user->ID,
							'fname' => $user->user_firstname,
							'lname' => $user->user_lastname,
							'email' => $user->user_email,
							'phone' => get_user_meta( $user->ID, 'bookify_customer_phone', true )
						);

					} else {
						return '<div id="bookify-not-registered">
							<span>You\'re not logged in as a Customer. Please contact Admin for further details.</span>
						</div>';
					}
	
				} else {

					return '<div id="bookify-not-registered">
						<span>Please login as a Customer to book an appointment.</span>
					</div>';

				}
				
			} elseif ( is_user_logged_in() ) {


				$user = wp_get_current_user();

				if ( in_array( 'bookify-customer', (array) $user->roles ) ) {

					$customer_data = array(
						'id' => $user->ID,
						'fname' => $user->user_firstname,
						'lname' => $user->user_lastname,
						'email' => $user->user_email,
						'phone' => get_user_meta( $user->ID, 'bookify_customer_phone', true )
					);

				}
			}

			wp_localize_script('bookify-frontend-script', 'wpbApp', array(
				'root' => esc_url_raw( rest_url() ),
				'nonce' => wp_create_nonce('wp_rest'),
				'customerData' => $customer_data
			));

			wp_enqueue_script( 'bookify-frontend-script' );

			return '<div id="bookify-frontend" data-role="bookings"></div>';
		}
	}

}
