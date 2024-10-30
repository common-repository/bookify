<?php 

namespace Bookify\Models;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Bookify_Dashboard_Models' ) ) { 

	final class Bookify_Dashboard_Models {

		public static function get_service_wise_earnings( $service_id ) {
			global $wpdb;

			$payment_table = $wpdb->prefix . 'bookify_payment';
			$apointment_table = $wpdb->prefix . 'bookify_appointments';

			$results = $wpdb->get_results( $wpdb->prepare(
				'SELECT *
				FROM %i AS payment
				JOIN %i AS appointment
				ON payment.appointment_id = appointment.id 
                WHERE appointment.appointment_service = %d
                ',
				$payment_table, 
				$apointment_table,
				$service_id
			), ARRAY_A );

			if ( $results === null ) {
				return array();
			}
		
			return $results;
		}

		public static function get_appointment_payment_data() {
			global $wpdb;

			$payment_table = $wpdb->prefix . 'bookify_payment';
			$apointment_table = $wpdb->prefix . 'bookify_appointments';

			$results = $wpdb->get_results( $wpdb->prepare(
				"SELECT *
				FROM %i AS payment
				JOIN %i AS appointment
				ON payment.appointment_id = appointment.id
                WHERE appointment.appointment_status = 'Completed'
                AND payment.payment_status IN ('Paid','Partially Paid')",
				$payment_table, 
				$apointment_table,
			), ARRAY_A );

			if ( $results === null ) {
				return array();
			}
		
			return $results;
		}

		public static function get_appointment_payment_by_date( $date ) {
			global $wpdb;

			$payment_table = $wpdb->prefix . 'bookify_payment';
			$apointment_table = $wpdb->prefix . 'bookify_appointments';
			$like   = '%' . $wpdb->esc_like( $date ) . '%'; 

			$results = $wpdb->get_results( $wpdb->prepare(
				"SELECT *
				FROM %i AS appointment
				INNER JOIN %i AS payment
				ON appointment.id = payment.appointment_id 
                WHERE appointment.appointment_created LIKE %s
                AND appointment.appointment_status = 'Completed'
                AND payment.payment_status IN ('Paid','Partially Paid')",
				$apointment_table,
				$payment_table,
				$like,
			), ARRAY_A );

			if ( $results === null ) {
				return array();
			}
		
			return $results;
		}

		public static function get_appointment_payments_by_todate( $todate ) {
			global $wpdb;

			$payment_table = $wpdb->prefix . 'bookify_payment';
			$apointment_table = $wpdb->prefix . 'bookify_appointments';
			$like   = '%' . $wpdb->esc_like( $todate ) . '%'; 

			$results = $wpdb->get_results( $wpdb->prepare(
				"SELECT *
				FROM %i AS appointment
				INNER JOIN %i AS payment
				ON appointment.id = payment.appointment_id 
                WHERE appointment.appointment_created LIKE %s
                AND appointment.appointment_status = 'Completed'
                AND payment.payment_status IN ('Paid','Partially Paid')",
				$apointment_table,
				$payment_table,
				$like,
			), ARRAY_A );

			if ( $results === null ) {
				return array();
			}
		
			return $results;
		}

		public static function get_appointment_payments_by_date_range( $range ) {
			global $wpdb;

			$payment_table = $wpdb->prefix . 'bookify_payment';
			$apointment_table = $wpdb->prefix . 'bookify_appointments';

			$results = $wpdb->get_results( $wpdb->prepare(
				"SELECT *
				FROM %i AS appointment
				INNER JOIN %i AS payment
				ON appointment.id = payment.appointment_id 
                WHERE DATE(appointment.appointment_created) BETWEEN %s AND %s
                AND appointment.appointment_status = 'Completed'
                AND payment.payment_status IN ('Paid','Partially Paid')",
				$apointment_table,
				$payment_table,
				$range['start'],
				$range['end'],
			), ARRAY_A );

			if ( $results === null ) {
				return array();
			}
		
			return $results;
		}

		public static function get_approved_appointment_by_date( $date ) {
			global $wpdb;

			$apointment_table = $wpdb->prefix . 'bookify_appointments';
			$like   = '%' . $wpdb->esc_like( $date ) . '%';  

			$results = $wpdb->get_results( $wpdb->prepare(
				"SELECT *
				FROM %i AS appointment
                WHERE appointment.appointment_created LIKE %s
                AND appointment.appointment_status IN ('Confirmed','Completed')",
				$apointment_table,
				$like,
			), ARRAY_A );

			if ( $results === null ) {
				return array();
			}
		
			return $results;
		}

		public static function get_approved_appointment_by_range( $range ) {
			global $wpdb;

			$apointment_table = $wpdb->prefix . 'bookify_appointments';

			$results = $wpdb->get_results( $wpdb->prepare(
				"SELECT *
				FROM %i AS appointment
                WHERE DATE(appointment.appointment_created) BETWEEN %s AND %s
                AND appointment.appointment_status IN ('Confirmed','Completed')",
				$apointment_table,
				$range['start'],
				$range['end'],
			), ARRAY_A );

			if ( $results === null ) {
				return array();
			}
		
			return $results;
		}
	}

}
