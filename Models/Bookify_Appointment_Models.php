<?php 

namespace Bookify\Models;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once ABSPATH . 'wp-admin/includes/upgrade.php' ;

if ( ! class_exists( 'Bookify_Appointment_Models' ) ) { 

	final class Bookify_Appointment_Models { 

		public static function bookify_create_appointment_table() {
			global $wpdb;
		
			$table_name = $wpdb->prefix . 'bookify_appointments';
		
			$charset_collate = $wpdb->get_charset_collate();
		
			$sql = "CREATE TABLE IF NOT EXISTS $table_name (
						id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
						appointment_location bigint(20) NOT NULL,
						appointment_service bigint(20) NOT NULL,
						appointment_staff bigint(20) NOT NULL,
						appointment_date varchar(255) NOT NULL,
						appointment_duration varchar(255) NOT NULL,
						appointment_price float(20) NOT NULL,
						appointment_customer bigint(30) NOT NULL,
						appointment_created varchar(255) NOT NULL,
						appointment_status varchar(255) NOT NULL,
						appointment_note varchar(255) DEFAULT NULL,
						PRIMARY KEY (id)
					) $charset_collate;";

			dbDelta( $sql );
		}

		public static function bookify_create_appointment_meta_table() {
			global $wpdb;
		
			$table_name = $wpdb->prefix . 'bookify_appointments_meta';
		
			$charset_collate = $wpdb->get_charset_collate();
		
			$sql = "CREATE TABLE IF NOT EXISTS $table_name (
						meta_id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
						appointment_id bigint(20) unsigned NOT NULL,
						meta_key varchar(255) NULL,
						meta_value longtext NULL,
						PRIMARY KEY (meta_id)
					) $charset_collate;";

			dbDelta( $sql );
		}

		public static function bookify_get_all_appointments_frontend_by_customer( $customer_id ) {
			global $wpdb;

			$appointment_table = $wpdb->prefix . 'bookify_appointments';
			$service_table = $wpdb->prefix . 'bookify_service';

			$results = $wpdb->get_results( $wpdb->prepare(
				"SELECT 
					appointment.id AS appointment_id,
					appointment.appointment_staff AS appointment_staff,
					appointment.appointment_date AS appointment_date,
					appointment.appointment_duration AS appointment_duration,
					appointment.appointment_price AS appointment_price,
					appointment.appointment_customer AS appointment_customer,
					appointment.appointment_created AS appointment_created,
					appointment.appointment_status AS appointment_status,
					appointment.appointment_note AS appointment_note,
					service.id AS service_id,
					service.service_name AS service_name,
					service.service_img AS service_img
				FROM %i AS appointment
				LEFT JOIN %i AS service
				ON service.id = appointment.appointment_service
				WHERE appointment_customer = %d 
				ORDER BY 'DESC'",
				$appointment_table,
				$service_table,
				$customer_id,
			), ARRAY_A );

			if ( $results === null ) {
				return array();
			}
		
			return $results;
		}

		public static function bookify_get_all_appointments_for_table( $staff_id = false ) {
			global $wpdb;

			$appointment_table = $wpdb->prefix . 'bookify_appointments';
			$service_table = $wpdb->prefix . 'bookify_service';
			
			$where = '';
			if ( $staff_id ) {
				$where = $wpdb->prepare( 'WHERE appointment.appointment_staff = %d', $staff_id );
			}

			$results = $wpdb->get_results( $wpdb->prepare(
				"SELECT 
					appointment.id AS appointment_id,
					appointment.appointment_location AS appointment_location,
					appointment.appointment_staff AS appointment_staff,
					appointment.appointment_date AS appointment_date,
					appointment.appointment_duration AS appointment_duration,
					appointment.appointment_price AS appointment_price,
					appointment.appointment_customer AS appointment_customer,
					appointment.appointment_created AS appointment_created,
					appointment.appointment_status AS appointment_status,
					appointment.appointment_note AS appointment_note,
					service.id AS service_id,
					service.service_name AS service_name,
					service.service_img AS service_img
				FROM %i AS appointment
				LEFT JOIN %i AS service
				ON service.id = appointment.appointment_service $where",
				$appointment_table,
				$service_table,
			), ARRAY_A );

			if ( $results !== null ) {
				foreach ( $results as &$appointment ) {
					$bookify_staff = get_user_by( 'ID', $appointment['appointment_staff'] );
					$bookify_customer = get_user_by( 'ID', $appointment['appointment_customer'] );
					$bookify_staff_name = $bookify_staff->display_name;
					$bookify_staff_img = get_user_meta( $bookify_staff->ID, 'bookify_staff_img', true );
					$bookify_staff_email = $bookify_staff->user_email;
					$bookify_customer_img = get_user_meta( $bookify_customer->ID, 'bookify_customer_img', true );
					$bookify_customer_name = $bookify_customer->display_name;
					$bookify_customer_email = $bookify_customer->user_email;
					$appointment['appointment_staff_name'] = $bookify_staff_name;
					$appointment['appointment_staff_img'] = $bookify_staff_img;
					$appointment['appointment_staff_email'] = $bookify_staff_email;
					$appointment['appointment_customer_name'] = $bookify_customer_name;
					$appointment['appointment_customer_img'] = $bookify_customer_img;
					$appointment['appointment_customer_email'] = $bookify_customer_email;

				}

				return $results;
			} else {
				return array();
			}
		}

		public static function bookify_get_all_appointments_by_id( $appoitment_id ) {
			global $wpdb;

			$appointment_table = $wpdb->prefix . 'bookify_appointments';
			$service_table = $wpdb->prefix . 'bookify_service';

			$results = $wpdb->get_row( $wpdb->prepare(
				'SELECT 
					appointment.id AS appointment_id,
					appointment.appointment_staff AS appointment_staff,
					appointment.appointment_date AS appointment_date,
					appointment.appointment_duration AS appointment_duration,
					appointment.appointment_price AS appointment_price,
					appointment.appointment_customer AS appointment_customer,
					appointment.appointment_created AS appointment_created,
					appointment.appointment_status AS appointment_status,
					appointment.appointment_note AS appointment_note,
					service.id AS service_id,
					service.service_name AS service_name,
					service.service_img AS service_img
				FROM %i AS appointment
				JOIN %i AS service
				ON service.id = appointment.appointment_service 
				WHERE appointment.id = %d',
				$appointment_table,
				$service_table,
				$appoitment_id
			), ARRAY_A );

			if ( $results !== null ) {
				return $results;
			} else {
				return array();
			}
		}

		public static function bookify_get_all_appointments_for_calender( $staff_id = false ) {
			global $wpdb;

			$table_name = $wpdb->prefix . 'bookify_appointments';

			$where = '';
			if ( $staff_id ) {
				$where = $wpdb->prepare( 'WHERE appointment.appointment_staff = %d', $staff_id);
			}

			$results = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM %i as appointment $where", $table_name ), ARRAY_A );
		
			if ( $results === null ) {
				return array();
			}
		
			return $results;
		}

		public static function bookify_get_all_appointments_by_customer( $customer_id ) {
			global $wpdb;

			$table_name = $wpdb->prefix . 'bookify_appointments';
		
			$results = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM %i WHERE appointment_customer = %d ORDER BY 'DESC'", $table_name, $customer_id ) , ARRAY_A);
		
			if ( $results === null ) {
				return array();
			}
		
			return $results;
		}

		public static function bookify_get_appointments_by_date_staff( $date, $staff_id ) {
			global $wpdb;

			$table_name = $wpdb->prefix . 'bookify_appointments';
		
			$booked_slots = $wpdb->get_col(
				$wpdb->prepare(
					'SELECT appointment_duration FROM %i WHERE appointment_date = %s AND appointment_staff = %d AND appointment_status != "Cancelled"',
					$table_name, $date, $staff_id
				)
			);
		
			if ( $booked_slots === null ) {
				return array();
			}
		
			return $booked_slots;
		}
		
		public static function bookify_add_appointment( $data ) {
			global $wpdb;
		
			$format = array(
				'%d',
				'%d',
				'%d',
				'%s',
				'%s',
				'%f',
				'%d',
				'%s',
				'%s',
				'%s',
			);
			$inserted = $wpdb->insert( "{$wpdb->prefix}bookify_appointments", $data, $format );
		
			if ( $inserted ) {
				return $wpdb->insert_id;
			} else {
				return false;
			}
		}

		public static function bookify_delete_appointment( $appointment_id ) {
			global $wpdb;

			$table_name = $wpdb->prefix . 'bookify_appointments';

			$result = $wpdb->query( $wpdb->prepare( 'DELETE FROM %i WHERE id = %d', $table_name, $appointment_id ) );
		
			return $result;
		}

		public static function bookify_update_appointment( $appointment_id, $data ) {
			global $wpdb;

			$where = array( 'id' => $appointment_id );

			$result = $wpdb->update( "{$wpdb->prefix}bookify_appointments", $data, $where );
		
			return $result;
		}
	}
}
