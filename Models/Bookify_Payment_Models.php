<?php 

namespace Bookify\Models;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once ABSPATH . 'wp-admin/includes/upgrade.php' ;

if ( ! class_exists( 'Bookify_Payment_Models' ) ) { 

	final class Bookify_Payment_Models { 

		public static function bookify_create_payment_table() {
			global $wpdb;
		
			$table_name = $wpdb->prefix . 'bookify_payment';
		
			$charset_collate = $wpdb->get_charset_collate();
		
			$sql = "CREATE TABLE IF NOT EXISTS $table_name (
						id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
						appointment_id bigint(20) unsigned NOT NULL,
						payment_method varchar(255) NOT NULL,
						payment_total float(20) unsigned NOT NULL,
						payment_paid float(20) unsigned NOT NULL,
						payment_due float(20) unsigned NOT NULL,
						payment_status varchar(255) NOT NULL,
						PRIMARY KEY (id)
					) $charset_collate;";
		
			dbDelta( $sql );
		}

		public static function bookify_create_payment_meta_table() {
			global $wpdb;
		
			$table_name = $wpdb->prefix . 'bookify_payment_meta';
		
			$charset_collate = $wpdb->get_charset_collate();
		
			$sql = "CREATE TABLE IF NOT EXISTS $table_name (
						meta_id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
						payment_id bigint(20) unsigned NOT NULL,
						meta_key varchar(255) NULL,
						meta_value longtext NULL,
						PRIMARY KEY (meta_id)
					) $charset_collate;";

			dbDelta( $sql );
		}

		public static function bookify_get_all_payments( $date = '', $staff = '', $service = '', $customer = '', $status = '' ) {
			global $wpdb;

			$payment_table = $wpdb->prefix . 'bookify_payment';
			$appointment_table = $wpdb->prefix . 'bookify_appointments';
			$service_table = $wpdb->prefix . 'bookify_service';

			$query = '';

			if ( ! empty( $date ) ) {
				$query .= $wpdb->prepare(' AND DATE(appointment.appointment_date) = %s', $date );
			}
		
			if ( ! empty( $staff ) ) {
				$query .= $wpdb->prepare(' AND appointment.appointment_staff = %d', $staff );
			}
		
			if ( ! empty( $service ) ) {
				$query .= $wpdb->prepare(' AND appointment.appointment_service = %d', $service );
			}
		
			if ( ! empty( $customer ) ) {
				$query .= $wpdb->prepare(' AND appointment.appointment_customer = %d', $customer );
			}
		
			if ( ! empty( $status ) ) {
				$query .= $wpdb->prepare(' AND payment.payment_status = %s', $status );
			}

			$results = $wpdb->get_results( $wpdb->prepare(
				"
				SELECT 
					payment.id AS payment_id,
					payment.payment_method AS method,
					payment.payment_total AS total,
					payment.payment_paid AS paid,
					payment.payment_due AS due,
					payment.payment_status AS status,
					appointment.id AS appointment_id,
					appointment.appointment_date AS appointment_date,
					appointment.appointment_service AS appointment_service,
					appointment.appointment_staff AS staff_id,
					appointment.appointment_customer AS customer_id,
					service.id AS service_id,
					service.service_name AS service_name,
					service.service_img AS service_img
				FROM %i AS payment
				JOIN %i AS appointment
				ON payment.appointment_id = appointment.id
				JOIN %i AS service
				ON appointment.appointment_service = service.id
				WHERE 1=1 $query
				",
				$payment_table,
				$appointment_table,
				$service_table
			), ARRAY_A);

			if ( $results !== null ) {
				foreach ( $results as &$payment ) {
					$bookify_staff = get_user_by( 'ID', $payment['staff_id'] );
					$bookify_customer = get_user_by( 'ID', $payment['customer_id'] );
					$bookify_staff_name = $bookify_staff->display_name;
					$bookify_staff_img = get_user_meta( $bookify_staff->ID, 'bookify_staff_img', true );
					$bookify_staff_email = $bookify_staff->user_email;
					$bookify_customer_img = get_user_meta( $bookify_customer->ID, 'bookify_customer_img', true );
					$bookify_customer_name = $bookify_customer->display_name;
					$bookify_customer_email = $bookify_customer->user_email;
					$payment['appointment_staff_name'] = $bookify_staff_name;
					$payment['appointment_staff_img'] = $bookify_staff_img;
					$payment['appointment_staff_email'] = $bookify_staff_email;
					$payment['appointment_customer_name'] = $bookify_customer_name;
					$payment['appointment_customer_img'] = $bookify_customer_img;
					$payment['appointment_customer_email'] = $bookify_customer_email;
				}

				return $results;
			} else {
				return array();
			}
		}

		public static function bookify_add_payment( $data ) {
			global $wpdb;
		
			$format = array(
				'%d',
				'%s',
				'%f',
				'%f',
				'%f',
				'%s',
			);
			$inserted = $wpdb->insert("{$wpdb->prefix}bookify_payment", $data, $format);
		
			if ( $inserted ) {
				return $wpdb->insert_id;
			} else {
				return false;
			}
		}

		public static function bookify_get_payment_by_appointment( $appointment_id, $order_by = 'asc' ) {
			global $wpdb;

			$table_name = $wpdb->prefix . 'bookify_payment';

			$results = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM %i WHERE appointment_id = %d ORDER BY id {$order_by}", $table_name, $appointment_id ) , ARRAY_A);

		
			if ( $results === null ) {
				return array();
			}
		
			return $results;
		}

		public static function bookify_update_payment( $payment_id, $data ) {
			global $wpdb;

			$where = array( 'id' => $payment_id );

			$result = $wpdb->update( "{$wpdb->prefix}bookify_payment", $data, $where );
			
			return $result;
		}

		public static function bookify_delete_payment( $payment_id ) {
			global $wpdb;

			$table_name = $wpdb->prefix . 'bookify_payment';

			$result = $wpdb->query( $wpdb->prepare( 'DELETE FROM %i WHERE id = %d', $table_name, $payment_id ) );
		
			return $result;
		}
	}

}
