<?php
/**
 * Plugin Name: Bookify
 * Plugin URI: https://www.wpbookify.com
 * Description: Bookify is a WordPress booking plugin for scheduling online appointments. It’s a perfect solution to customize and automate online bookings.
 * Version: 1.0.3
 * Tags: bookings, appointments
 * Author: WPExperts
 * Author URI: https://wpexperts.io/
 * Requires at least: WP 4.8
 * Tested up to: WP 6.6
 * Text Domain: bookify
 * Domain Path: /languages/
 * License: GPLv2 or later
 * License URI: http://www.gnu.org/licenses/gpl-2.0.html
 */

 namespace Bookify;

 use Bookify\Models\Bookify_Models;
 use Bookify\Controllers\Admin\Bookify_Menu;
 use Bookify\Controllers\Admin\Bookify_Emails;
 use Bookify\Controllers\REST\Bookify_Services_Rest_API;
 use Bookify\Controllers\REST\Bookify_Staffs_Rest_API;
 use Bookify\Controllers\REST\Bookify_Customers_Rest_API;
 use Bookify\Controllers\REST\Bookify_Settings_Rest_API;
 use Bookify\Controllers\REST\Bookify_Notification_Rest_API;
 use Bookify\Controllers\REST\Bookify_Appointments_Rest_API;
 use Bookify\Controllers\REST\Bookify_Payment_Rest_API;
 use Bookify\Controllers\REST\Bookify_Calendar_Rest_API;
 use Bookify\Controllers\REST\Bookify_Dashboard_Rest_API;
 use Bookify\Controllers\REST\Bookify_Frontend_Rest_API;
 use Bookify\Controllers\Frontend\Bookify_Shortcodes;

// don't call the file directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Bookify_Main' ) ) {

	final class Bookify_Main { 

		 /**
		 * Plugin version
		 *
		 * @var string
		 */
		public $version = '1.0.3';

		/**
		 * Constructor for the Bookify_Main class
		 *
		 * Sets up all the appropriate hooks and actions
		 * within our plugin.
		 */
		public function __construct() {
			
			$this->define_constants();

			require_once BOOKIFY_DIR . '/vendor/autoload.php';

			register_activation_hook( __FILE__, array( $this, 'bookify_activation' ) );

			add_action( 'init', array( $this, 'init_plugin' ) );
		}

		/**
		 * Define all constants
		 *
		 * @return void
		 */
		public function define_constants() {
			$this->define( 'BOOKIFY_VERSION', $this->version );
			$this->define( 'BOOKIFY_FILE_PATH', plugin_dir_path( __FILE__ ) );
			$this->define( 'BOOKIFY_FILE_URL', plugin_dir_url( __FILE__ ) );
			$this->define( 'BOOKIFY_DIR', __DIR__ );
			$this->define( 'BOOKIFY_CONTROLLER_DIR', __DIR__ . '/Controllers' );
			$this->define( 'BOOKIFY_MODEL_DIR', BOOKIFY_DIR . '/Models' );
		}

		/**
		 * Define constant if not already defined
		 *
		 * @since 1.0.0
		 *
		 * @param string      $name
		 * @param string|bool $value
		 *
		 * @return void
		 */
		private function define( $name, $value ) {
			if ( ! defined( $name ) ) {
				define( $name, $value );
			}
		}

		/**
		 * Placeholder for activation function
		 *
		 * Nothing being called here yet.
		 */
		public function bookify_activation() {
			Bookify_Models::bookify_create_tables();
			add_role(
				'bookify-staff',
				__( 'WPB Staff', 'bookify'  ),
			);

			$staff_role = get_role('bookify-staff');

			if ( $staff_role ) {
				$staff_role->add_cap('read');
				$staff_role->add_cap('view_admin_dashboard');
				$staff_role->add_cap('bookify_staff_pages');
			}

			add_role(
				'bookify-customer',
				__( 'WPB Customer', 'bookify'  ),
			);

			$customer_role = get_role('bookify-customer');

			if ( $customer_role ) {
				$customer_role->add_cap('read');
			}
		}

		/**
		 * Load the plugin after WP User Frontend is loaded
		 *
		 * @return void
		 */
		public function init_plugin() {

			require_once BOOKIFY_MODEL_DIR . '/Bookify_Meta_Handlers.php' ;

			$this->register_assets();

			new Bookify_Menu();
			new Bookify_Emails();
			new Bookify_Services_Rest_API();
			new Bookify_Staffs_Rest_API();
			new Bookify_Customers_Rest_API();
			new Bookify_Settings_Rest_API();
			new Bookify_Notification_Rest_API();
			new Bookify_Appointments_Rest_API();
			new Bookify_Payment_Rest_API();
			new Bookify_Calendar_Rest_API();
			new Bookify_Dashboard_Rest_API();
			new Bookify_Frontend_Rest_API();
			new Bookify_Shortcodes();
		}

		public function register_assets() {

			wp_register_style( 'bookify-frontend-style', plugins_url( 'build/frontend.css', __FILE__ ), array(), $this->version, 'all' );
			wp_register_script( 'bookify-frontend-script', plugins_url( 'build/frontend.bundle.js', __FILE__ ), array( 'wp-element', 'wp-i18n' ), time(), true );

			wp_register_script( 'bookify-appointments-script', plugins_url( 'build/appointments.bundle.js', __FILE__ ), array( 'wp-element', 'wp-i18n' ), time(), true );
		}
	}

	new Bookify_Main();
}
