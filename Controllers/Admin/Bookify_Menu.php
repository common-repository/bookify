<?php 

namespace Bookify\Controllers\Admin;

// don't call the file directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Bookify_Menu' ) ) {

	class Bookify_Menu {

		public function __construct() { 

			add_action( 'admin_menu', array( $this, 'add_admin_menu' ) );
			add_filter( 'login_redirect', array( $this, 'bookify_staff_login_redirect' ), 10, 3 );
			add_action( 'admin_enqueue_scripts', array( $this, 'bookify_scripts' ) );
		}

		public function bookify_staff_login_redirect( $redirect_to, $request, $user ) {
			if ( isset( $user->roles ) && is_array( $user->roles ) ) {
				if ( in_array( 'bookify-staff', $user->roles ) && ! in_array( 'administrator', $user->roles ) ) {
					return admin_url('admin.php?page=bookify-staff#/staffs');
				} else {
					return admin_url();
				}
			}
		}

		public function bookify_scripts() {

			wp_register_style( 'bookify-style', BOOKIFY_FILE_URL . 'build/admin.css', array(), '1.0.0' );
			wp_register_script( 'bookify-script', BOOKIFY_FILE_URL . 'build/admin.bundle.js', array( 'wp-element' ), '1.0.0', true );
			wp_enqueue_media();
		}

		public function add_admin_menu() {
			global $submenu;

			if ( is_user_logged_in() ) { 
				if ( ! current_user_can( 'bookify_staff_pages' ) && current_user_can( 'manage_options' ) ) {

					$slug          = 'bookify';

					$dashboard = add_menu_page( 
						__( 'Bookify', 'bookify' ), 
						__( 'Bookify', 'bookify' ), 
						'manage_options', 
						$slug, 
						array( $this, 'bookify_dashboard_callback' ), 
						'dashicons-calendar-alt', 
						59
					);

					add_submenu_page( $slug, __( 'Dashboard', 'bookify' ), __( 'Dashboard', 'bookify' ), 'manage_options', 'admin.php?page=' . $slug . '#/' );
					add_submenu_page( $slug, __( 'Calendar', 'bookify' ), __( 'Calendar', 'bookify' ), 'manage_options', 'admin.php?page=' . $slug . '#/calendar' );
					add_submenu_page( $slug, __( 'Appointments', 'bookify' ), __( 'Appointments', 'bookify' ), 'manage_options', 'admin.php?page=' . $slug . '#/appointments' );
					if ( ! class_exists('\BookifyPro\Bookify_Pro_Main') ) {
						add_submenu_page( $slug, __( 'Location', 'bookify' ), __( 'Location<span class="dashicons dashicons-star-filled" style="color:#ff8c00;margin-left:5px;font-size:17px;"></span>', 'bookify' ), 'manage_options', 'admin.php?page=' . $slug . '#/location' );
					}
					add_submenu_page( $slug, __( 'Services', 'bookify' ), __( 'Services', 'bookify' ), 'manage_options', 'admin.php?page=' . $slug . '#/services' );
					add_submenu_page( $slug, __( 'Staffs', 'bookify' ), __( 'Staffs', 'bookify' ), 'manage_options', 'admin.php?page=' . $slug . '#/staffs' );
					add_submenu_page( $slug, __( 'Customers', 'bookify' ), __( 'Customers', 'bookify' ), 'manage_options', 'admin.php?page=' . $slug . '#/customers' );
					add_submenu_page( $slug, __( 'Notification', 'bookify' ), __( 'Notification', 'bookify' ), 'manage_options', 'admin.php?page=' . $slug . '#/notification' );
					add_submenu_page( $slug, __( 'Payment', 'bookify' ), __( 'Payment', 'bookify' ), 'manage_options', 'admin.php?page=' . $slug . '#/payment' );

					do_action( 'bookify_admin_menu', $slug );

					add_submenu_page( $slug, __( 'Settings', 'bookify' ), __( 'Settings', 'bookify' ), 'manage_options', 'admin.php?page=' . $slug . '#/settings' );

					remove_submenu_page( $slug, $slug );
				}

				if ( current_user_can( 'bookify_staff_pages' ) && ! current_user_can( 'manage_options' ) ) {
					remove_menu_page('profile.php');
					unset( $submenu['profile.php'] );

					$slug          = 'bookify-staff';

					$satff_dashboard = add_menu_page( 
						__( 'Bookify', 'bookify' ), 
						__( 'Bookify', 'bookify' ), 
						'bookify_staff_pages', 
						$slug, 
						array( $this, 'bookify_dashboard_callback' ), 
						'dashicons-calendar-alt', 
						59
					);

					add_submenu_page( $slug, __( 'Calendar', 'bookify' ), __( 'Calendar', 'bookify' ), 'bookify_staff_pages', 'admin.php?page=' . $slug . '#/calendar' );
					add_submenu_page( $slug, __( 'Appointments', 'bookify' ), __( 'Appointments', 'bookify' ), 'bookify_staff_pages', 'admin.php?page=' . $slug . '#/appointments' );
					add_submenu_page( $slug, __( 'Staffs', 'bookify' ), __( 'Staffs', 'bookify' ), 'bookify_staff_pages', 'admin.php?page=' . $slug . '#/staffs' );

					remove_submenu_page( $slug, $slug );
				}

			}
		}

		public function bookify_dashboard_callback() {
			wp_enqueue_style( 'bookify-style' );
			wp_enqueue_script( 'bookify-script' );

			echo '<div id="bookify-admin"></div>';
		}
	}

}
