<?php

namespace Bookify\Controllers\REST;

use WP_Error;
use WP_REST_Response;
use Bookify\Controllers\Bookify_Helper;
use Bookify\Models\Bookify_Service_Models;
use Bookify\Models\Bookify_Dashboard_Models;
use Bookify\Models\Bookify_Appointment_Models;


// don't call the file directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Bookify_Dashboard_Rest_API' ) ) {

	class Bookify_Dashboard_Rest_API {

		public function __construct() {

			add_action( 'rest_api_init' , array( $this, 'rest_api_dashboard' ) );
		}

		public function rest_api_dashboard() {

			register_rest_route('bookify/v1', '/dashboard', array(
				'methods'               => 'GET',
				'callback'              => array( $this, 'rest_dashboard_data_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			)); 

			register_rest_route('bookify/v1', '/get-total-revenue', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'rest_total_revenue_data_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			));

			register_rest_route('bookify/v1', '/get-total-customer', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'rest_customer_count_data_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			));

			register_rest_route('bookify/v1', '/get-approved-appointment', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'rest_approved_appointment_data_callback' ),
				'permission_callback'   => array( $this, 'verify_nonce_and_permissions' )
			));

			register_rest_route('bookify/v1', '/service-earning', array(
				'methods'               => 'POST',
				'callback'              => array( $this, 'rest_service_earning_data_callback' ),
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

		public function rest_dashboard_data_callback() {

			$current_year = gmdate('Y');

			$general_settings = get_option( 'bookify_general_settings' );
			$currency = is_array( $general_settings ) && isset( $general_settings['DefaultGeneralCurrencies'] ) ? $general_settings['DefaultGeneralCurrencies'] : 'USD';

			$services = Bookify_Service_Models::bookify_get_all_services();

			$staff_earning = array(
				'Jan' => 0,
				'Feb' => 0,
				'Mar' => 0,
				'Apr' => 0,
				'May' => 0,
				'Jun' => 0,
				'Jul' => 0,
				'Aug' => 0,
				'Sep' => 0,
				'Oct' => 0,
				'Nov' => 0,
				'Dec' => 0,
			);

			$staff_total_appointment = array(
				'Jan' => 0,
				'Feb' => 0,
				'Mar' => 0,
				'Apr' => 0,
				'May' => 0,
				'Jun' => 0,
				'Jul' => 0,
				'Aug' => 0,
				'Sep' => 0,
				'Oct' => 0,
				'Nov' => 0,
				'Dec' => 0,
			);

			$customer_status = array(
				'Pending' => 0,
				'Confirmed' => 0,
				'Visited' => 0,
				'Cancelled' => 0,
			);

			$payments = Bookify_Dashboard_Models::get_appointment_payment_data();
			$appointments = Bookify_Appointment_Models::bookify_get_all_appointments_for_calender();

			if ( $appointments ) {
				foreach ( $appointments as $appointment ) {
					$appointment_date = strtotime( $appointment['appointment_created'] );
					$appointment_year = gmdate( 'Y', $appointment_date );
					$appointment_month = gmdate( 'M', $appointment_date );

					if ( $appointment['appointment_status'] === 'Completed' && $appointment_year == $current_year ) {
						$staff_total_appointment[ $appointment_month ]++;
					}

					switch ( $appointment['appointment_status'] ) {
						case 'Pending':
							$customer_status['Pending']++;
							break;
						case 'Confirmed':
							$customer_status['Confirmed']++;
							break;
						case 'Completed':
							$customer_status['Visited']++;
							break;
						case 'Cancelled':
							$customer_status['Cancelled']++;
							break;
					}
				}
			}

			if ( $payments ) {
				foreach ( $payments as $payment ) {
					$year = gmdate( 'Y', strtotime( $payment['appointment_created'] ) );
					if ( $year == $current_year ) {
						$month = gmdate( 'M', strtotime( $payment['appointment_created'] ) );
						$staff_earning[ $month ] += $payment['payment_paid'];
					}
				}
			}

			$revenue_section = $this->calculate_today_revenue();
			$customer_section = $this->calculate_today_customer();
			$approved_appointment = $this->calculate_today_appointment();

			return new WP_REST_Response(array(
				'services' => $services,
				'currency' => $currency,
				'staff_earning_chart' => $staff_earning,
				'staff_total_appointment' => $staff_total_appointment,
				'customer_status' => $customer_status,
				'revenue_section' => $revenue_section,
				'customer_section' => $customer_section,
				'approved_appointment' => $approved_appointment
			), 200);
		}

		private function calculate_today_appointment() {
			$todate = gmdate( 'Y-m-d' );
			$yesterdaydate = Bookify_Helper::get_yesterday_date( $todate );
			$today_data = array();
			$today_count = 0;
			$yesterday_data = array();
			$yesterday_count = 0;
			$temp = array();
			$chart_data = array( 0, 0 );
			$diff_per = 0;

			$today_data = Bookify_Dashboard_Models::get_approved_appointment_by_date( $todate );
			$yesterday_data = Bookify_Dashboard_Models::get_approved_appointment_by_date( $yesterdaydate );

			if ( $today_data ) {
				$chart_data = $this->get_hourly_count( $today_data );
				$today_count = array_sum( $chart_data );
			}
			
			if ( $yesterday_data ) {
				$temp = $this->get_hourly_count( $yesterday_data );
				$yesterday_count = array_sum( $temp );
			}

			if ( $today_count >= $yesterday_count ) {
				$text = 'Increase from yesterday';
				$increase = true;
			} else {
				$text = 'Decrease from yesterday';
				$increase = false;
			}

			if ( $yesterday_count > 0 ) {
				$diff_per = ( ( $today_count - $yesterday_count ) / $yesterday_count ) * 100;
			} 

			if ( $yesterday_count == 0 &&  $today_count > 0 ) {
				$diff_per = 100;
			}

			if ( $diff_per > 100 ) {
				$diff_per = 100;
			}

			return array(
				'total_count' => $today_count,
				'chart_data' => $chart_data,
				'percentage' => abs( $diff_per ),
				'text' => $text,
				'increase' => $increase,
			);
		}

		private function calculate_year_appointment() {
			$todate = gmdate( 'Y-m-d' );
			$current_year = Bookify_Helper::get_current_month_range( $todate );
			$previous_year = Bookify_Helper::get_previous_month_range( $todate );
			$current_year_data = array();
			$previous_year_data = array();
			$diff_per = 0;

			$current_year_data = Bookify_Dashboard_Models::get_approved_appointment_by_range( $current_year );
			$previous_year_data = Bookify_Dashboard_Models::get_approved_appointment_by_range( $previous_year );

			$current_yearly = $this->get_approved_appointmet_count_by_range( $current_year, $current_year_data );
			$previous_yearly = $this->get_approved_appointmet_count_by_range( $previous_year, $previous_year_data );

			if ( $current_yearly['total_count'] >= $previous_yearly['total_count'] ) {
				$text = 'Increase from last year';
				$increase = true;
			} else {
				$text = 'Decrease from last year';
				$increase = false;
			}

			if ( $previous_yearly['total_count'] > 0 ) {
				$diff_per = ( ( $current_yearly['total_count'] - $previous_yearly['total_count'] ) / $previous_yearly['total_count'] ) * 100;
			} 

			if ( $previous_yearly['total_count'] == 0 &&  $current_yearly['total_count'] > 0 ) {
				$diff_per = 100;
			}

			if ( $diff_per > 100 ) {
				$diff_per = 100;
			}

			return array(
				'total_count' => $current_yearly['total_count'],
				'chart_data' => $current_yearly['chart_data'],
				'percentage' => abs( $diff_per ),
				'text' => $text,
				'increase' => $increase,
			);
		}

		private function calculate_month_appointment() {
			$todate = gmdate( 'Y-m-d' );
			$current_month = Bookify_Helper::get_current_month_range( $todate );
			$previous_month = Bookify_Helper::get_previous_month_range( $todate );
			$current_month_data = array();
			$previous_month_data = array();
			$diff_per = 0;

			$current_month_data = Bookify_Dashboard_Models::get_approved_appointment_by_range( $current_month );
			$previous_month_data = Bookify_Dashboard_Models::get_approved_appointment_by_range( $previous_month );

			$current_monthly = $this->get_approved_appointmet_count_by_range( $current_month, $current_month_data );
			$previous_monthly = $this->get_approved_appointmet_count_by_range( $previous_month, $previous_month_data );

			if ( $current_monthly['total_count'] >= $previous_monthly['total_count'] ) {
				$text = 'Increase from last month';
				$increase = true;
			} else {
				$text = 'Decrease from last month';
				$increase = false;
			}

			if ( $previous_monthly['total_count'] > 0 ) {
				$diff_per = ( ( $current_monthly['total_count'] - $previous_monthly['total_count'] ) / $previous_monthly['total_count'] ) * 100;
			} 

			if ( $previous_monthly['total_count'] == 0 &&  $current_monthly['total_count'] > 0 ) {
				$diff_per = 100;
			}

			if ( $diff_per > 100 ) {
				$diff_per = 100;
			}

			return array(
				'total_count' => $current_monthly['total_count'],
				'chart_data' => $current_monthly['chart_data'],
				'percentage' => abs( $diff_per ),
				'text' => $text,
				'increase' => $increase,
			);
		}

		private function calculate_week_appointment() {
			$todate = gmdate( 'Y-m-d' );
			$current_week = Bookify_Helper::get_current_week_range( $todate );
			$previous_week = Bookify_Helper::get_previous_week_range( $todate );
			$current_week_data = array();
			$previous_week_data = array();
			$diff_per = 0;

			$current_week_data = Bookify_Dashboard_Models::get_approved_appointment_by_range( $current_week );
			$previous_week_data = Bookify_Dashboard_Models::get_approved_appointment_by_range( $previous_week );

			$current_weekly = $this->get_approved_appointmet_count_by_range( $current_week, $current_week_data );
			$previous_weekly = $this->get_approved_appointmet_count_by_range( $previous_week, $previous_week_data );

			if ( $current_weekly['total_count'] >= $previous_weekly['total_count'] ) {
				$text = 'Increase from last week';
				$increase = true;
			} else {
				$text = 'Decrease from last week';
				$increase = false;
			}

			if ( $previous_weekly['total_count'] > 0 ) {
				$diff_per = ( ( $current_weekly['total_count'] - $previous_weekly['total_count'] ) / $previous_weekly['total_count'] ) * 100;
			} 

			if ( $previous_weekly['total_count'] == 0 &&  $current_weekly['total_count'] > 0 ) {
				$diff_per = 100;
			}

			if ( $diff_per > 100 ) {
				$diff_per = 100;
			}

			return array(
				'total_count' => $current_weekly['total_count'],
				'chart_data' => $current_weekly['chart_data'],
				'percentage' => abs( $diff_per ),
				'text' => $text,
				'increase' => $increase,
			);
		}

		private function get_hourly_count( $data ) {
			$hourly_count = array_fill( 0, 24, 0 );
			foreach ( $data as $appointment ) {
				$created_time = $appointment['appointment_created'];
				$hour = explode( ' ', $created_time )[1];
				$hour = (int) explode( ':', $hour )[0];
				$hourly_count[ $hour ]++;
			}
			return $hourly_count;
		}

		private function get_approved_appointmet_count_by_range( $date_range, $data ) {
			$start_timestamp = strtotime( $date_range['start'] );
			$end_timestamp = strtotime( $date_range['end'] );

			$daily_counts = array();
			$chart_data = array( 0, 0 );

			for ( $date = $start_timestamp; $date <= $end_timestamp; $date = strtotime( '+1 day', $date ) ) {
				$daily_counts[ gmdate('Y-m-d', $date) ] = 0;
			}

			if ( $data ) {
				foreach ( $data as $appointment ) {
					$created_date = gmdate( 'Y-m-d', strtotime( $appointment['appointment_created'] ) );
					if ( isset( $daily_counts[ $created_date ] ) ) {
						$daily_counts[ $created_date ]++;
					}
				}
			}
			
			return array(
				'chart_data' => array_values( $daily_counts ),
				'total_count' => array_sum( $daily_counts ),
			);
		}

		private function calculate_today_customer() {
			$todate = gmdate( 'Y-m-d' );
			$yesterdaydate = Bookify_Helper::get_yesterday_date( $todate );
			$today_data = array();
			$yesterday_data = array();
			$diff_per = 0;

			$today_data = $this->get_user_count_by_date( $todate );
			$yesterday_data = $this->get_user_count_by_date( $yesterdaydate );

			if ( $today_data['total_count'] >= $yesterday_data['total_count'] ) {
				$text = 'Increase from yesterday';
				$increase = true;
			} else {
				$text = 'Decrease from yesterday';
				$increase = false;
			}

			if ( $yesterday_data['total_count'] > 0 ) {
				$diff_per = ( ( $today_data['total_count'] - $yesterday_data['total_count'] ) / $yesterday_data['total_count'] ) * 100;
			} 

			if ( $yesterday_data['total_count'] == 0 &&  $today_data['total_count'] > 0 ) {
				$diff_per = 100;
			}

			if ( $diff_per > 100 ) {
				$diff_per = 100;
			}

			return array(
				'total_count' => $today_data['total_count'],
				'chart_data' => $today_data['chart_data'],
				'percentage' => abs( $diff_per ),
				'text' => $text,
				'increase' => $increase,
			);
		}

		private function calculate_week_customer() {
			$todate = gmdate( 'Y-m-d' );
			$current_week = Bookify_Helper::get_current_week_range( $todate );
			$previous_week = Bookify_Helper::get_previous_week_range( $todate );
			$current_week_data = array();
			$previous_week_data = array();
			$diff_per = 0;

			$current_week_data = $this->get_user_count_by_date_range( $current_week );
			$previous_week_data = $this->get_user_count_by_date_range( $previous_week );

			if ( $current_week_data['total_count'] >= $previous_week_data['total_count'] ) {
				$text = 'Increase from last week';
				$increase = true;
			} else {
				$text = 'Decrease from last week';
				$increase = false;
			}

			if ( $previous_week_data['total_count'] > 0 ) {
				$diff_per = ( ( $current_week_data['total_count'] - $previous_week_data['total_count'] ) / $previous_week_data['total_count'] ) * 100;
			} 

			if ( $previous_week_data['total_count'] == 0 &&  $current_week_data['total_count'] > 0 ) {
				$diff_per = 100;
			}

			if ( $diff_per > 100 ) {
				$diff_per = 100;
			}

			return array(
				'total_count' => $current_week_data['total_count'],
				'chart_data' => $current_week_data['chart_data'],
				'percentage' => abs( $diff_per ),
				'text' => $text,
				'increase' => $increase,
			);
		}

		private function calculate_month_customer() {
			$todate = gmdate( 'Y-m-d' );
			$current_month = Bookify_Helper::get_current_month_range( $todate );
			$previous_month = Bookify_Helper::get_previous_month_range( $todate );
			$current_month_data = array();
			$previous_month_data = array();
			$diff_per = 0;

			$current_month_data = $this->get_user_count_by_date_range( $current_month );
			$previous_month_data = $this->get_user_count_by_date_range( $previous_month );

			if ( $current_month_data['total_count'] >= $previous_month_data['total_count'] ) {
				$text = 'Increase from last month';
				$increase = true;
			} else {
				$text = 'Decrease from last month';
				$increase = false;
			}

			if ( $previous_month_data['total_count'] > 0 ) {
				$diff_per = ( ( $current_month_data['total_count'] - $previous_month_data['total_count'] ) / $previous_month_data['total_count'] ) * 100;
			} 

			if ( $previous_month_data['total_count'] == 0 &&  $current_month_data['total_count'] > 0 ) {
				$diff_per = 100;
			}

			if ( $diff_per > 100 ) {
				$diff_per = 100;
			}

			return array(
				'total_count' => $current_month_data['total_count'],
				'chart_data' => $current_month_data['chart_data'],
				'percentage' => abs( $diff_per ),
				'text' => $text,
				'increase' => $increase,
			);
		}

		private function calculate_year_customer() {
			$todate = gmdate( 'Y-m-d' );
			$current_year = Bookify_Helper::get_current_year_range( $todate );
			$previous_year = Bookify_Helper::get_previous_year_range( $todate );
			$current_year_data = array();
			$previous_year_data = array();
			$diff_per = 0;

			$current_year_data = $this->get_user_count_by_date_range( $current_year, 'month' );
			$previous_year_data = $this->get_user_count_by_date_range( $previous_year, 'month' );

			if ( $current_year_data['total_count'] >= $previous_year_data['total_count'] ) {
				$text = 'Increase from last year';
				$increase = true;
			} else {
				$text = 'Decrease from last year';
				$increase = false;
			}

			if ( $previous_year_data['total_count'] > 0 ) {
				$diff_per = ( ( $current_year_data['total_count'] - $previous_year_data['total_count'] ) / $previous_year_data['total_count'] ) * 100;
			} 

			if ( $previous_year_data['total_count'] == 0 && $current_year_data['total_count'] > 0 ) {
				$diff_per = 100;
			}

			if ( $diff_per > 100 ) {
				$diff_per = 100;
			}

			return array(
				'total_count' => $current_year_data['total_count'],
				'chart_data' => $current_year_data['chart_data'],
				'percentage' => abs( $diff_per ),
				'text' => $text,
				'increase' => $increase,
			);
		}

		private function get_user_count_by_date_range( $date_range, $handler = 'day' ) {
			$start_timestamp = strtotime( $date_range['start'] );
			$end_timestamp = strtotime( $date_range['end'] );
			$iteration = '+1 ' . $handler;
		
			$daily_counts = array();
		
			for ( $date = $start_timestamp; $date <= $end_timestamp; $date = strtotime( $iteration, $date ) ) {
				$year = (int) gmdate('Y', $date);
				$month = (int) gmdate('m', $date);
				$day = '';
				if ( $handler != 'month' ) {
					$day = (int) gmdate('d', $date);
				}
		
				$args = array(
					'role'       => 'bookify-customer',
					'date_query' => array(
						array(
							'year'  => $year,
							'month' => $month,
							'day'   => $day
						),
					),
					'fields' => 'ID'
				);
		
				$users = get_users( $args );
				$daily_counts[] = count( $users );
			}
		
			return array(
				'chart_data' => $daily_counts,
				'total_count' => array_sum( $daily_counts )
			);
		}

		private function get_user_count_by_date( $todate ) {
			
			$timestamp = strtotime( $todate );
			$year = (int) gmdate( 'Y', $timestamp );
			$month = (int) gmdate( 'm', $timestamp );
			$day = (int) gmdate( 'd', $timestamp );

			$hourly_counts = array_fill( 0, 24, 0 );

			for ( $hour = 0; $hour < 24; $hour++ ) {
				$args = array(
					'role'       => 'bookify-customer',
					'date_query' => array(
						array(
							'year'  => $year,
							'month' => $month,
							'day'   => $day,
							'hour'  => $hour
						),
					),
					'fields' => 'ID'
				);
		
				$users = get_users( $args );
				$hourly_counts[ $hour ] = count( $users );
			}
			return array(
				'chart_data' => $hourly_counts,
				'total_count' => array_sum( $hourly_counts )
			);
		}

		private function calculate_today_revenue() {
			
			$todate = gmdate( 'Y-m-d' );
			$yesterdaydate = Bookify_Helper::get_yesterday_date( $todate );
			$today_total_revenue = 0;
			$yesterday_total_revenue = 0;
			$diff_per = 0;
			$chart_data = array( 0 );
			
			$todate_data = Bookify_Dashboard_Models::get_appointment_payments_by_todate( $todate );
			$yesterday_data = Bookify_Dashboard_Models::get_appointment_payments_by_todate( $yesterdaydate );
			
			if ( $todate_data ) {
				foreach ( $todate_data as $appointment ) {
					$today_total_revenue += $appointment['payment_paid'];
					array_push( $chart_data, $today_total_revenue );
				}
			} else {
				$chart_data = array( 0, 0 );
			}

			if ( $yesterday_data ) {
				foreach ( $yesterday_data as $appointment ) {
					$yesterday_total_revenue += $appointment['payment_paid'];
				}
			}

			if ( $today_total_revenue >= $yesterday_total_revenue ) {
				$text = 'Increase from yesterday';
				$increase = true;
			} else {
				$text = 'Decrease from yesterday';
				$increase = false;
			}

			if ( $yesterday_total_revenue > 0 ) {
				$diff_per = ( ( $today_total_revenue - $yesterday_total_revenue ) / $yesterday_total_revenue ) * 100;
			}

			if ( $yesterday_total_revenue == 0 &&  $today_total_revenue > 0 ) {
				$diff_per = 100;
			}

			if ( $diff_per > 100 ) {
				$diff_per = 100;
			}

			return array(
				'total_revenue' => $today_total_revenue,
				'chart_data' => $chart_data,
				'percentage' => abs( $diff_per ),
				'text' => $text,
				'increase' => $increase,
			);
		}

		private function calculate_week_revenue() {
			
			$todate = gmdate( 'Y-m-d' );
			$current_week = Bookify_Helper::get_current_week_range( $todate );
			$previous_week = Bookify_Helper::get_previous_week_range( $todate );
			$current_total_revenue = 0;
			$previous_total_revenue = 0;
			$diff_per = 0;
			$chart_data = array( 0 );

			$current_week_data = Bookify_Dashboard_Models::get_appointment_payments_by_date_range( $current_week );
			$previous_week_data = Bookify_Dashboard_Models::get_appointment_payments_by_date_range( $previous_week );
			
			if ( $current_week_data ) {
				foreach ( $current_week_data as $appointment ) {
					$current_total_revenue += $appointment['payment_paid'];
					array_push( $chart_data, $current_total_revenue );
				}
			} else {
				$chart_data = array( 0, 0 );
			}

			if ( $previous_week_data ) {
				foreach ( $previous_week_data as $appointment ) {
					$previous_total_revenue += $appointment['payment_paid'];
				}
			}

			if ( $current_total_revenue >= $previous_total_revenue ) {
				$text = 'Increase from last week';
				$increase = true;
			} else {
				$text = 'Decrease from last week';
				$increase = false;
			}

			if ( $previous_total_revenue > 0 ) {
				$diff_per = ( ( $current_total_revenue - $previous_total_revenue ) / $previous_total_revenue ) * 100;
			}

			if ( $previous_total_revenue == 0 &&  $current_total_revenue > 0 ) {
				$diff_per = 100;
			}

			if ( $diff_per > 100 ) {
				$diff_per = 100;
			}

			return array(
				'total_revenue' => $current_total_revenue,
				'chart_data' => $chart_data,
				'percentage' => abs( $diff_per ),
				'text' => $text,
				'increase' => $increase,
			);
		}

		private function calculate_month_revenue() {
			
			$todate = gmdate( 'Y-m-d' );
			$current_month = Bookify_Helper::get_current_month_range( $todate );
			$previous_month = Bookify_Helper::get_previous_month_range( $todate );
			$current_total_revenue = 0;
			$previous_total_revenue = 0;
			$diff_per = 0;
			$chart_data = array( 0 );

			$current_month_data = Bookify_Dashboard_Models::get_appointment_payments_by_date_range( $current_month );
			$previous_month_data = Bookify_Dashboard_Models::get_appointment_payments_by_date_range( $previous_month );
			
			if ( $current_month_data ) {
				foreach ( $current_month_data as $appointment ) {
					$current_total_revenue += $appointment['payment_paid'];
					array_push( $chart_data, $current_total_revenue );
				}
			} else {
				$chart_data = array( 0, 0 );
			}

			if ( $previous_month_data ) {
				foreach ( $previous_month_data as $appointment ) {
					$previous_total_revenue += $appointment['payment_paid'];
				}
			}

			if ( $current_total_revenue >= $previous_total_revenue ) {
				$text = 'Increase from last month';
				$increase = true;
			} else {
				$text = 'Decrease from last month';
				$increase = false;
			}

			if ( $previous_total_revenue > 0 ) {
				$diff_per = ( ( $current_total_revenue - $previous_total_revenue ) / $previous_total_revenue ) * 100;
			}

			if ( $previous_total_revenue == 0 &&  $current_total_revenue > 0 ) {
				$diff_per = 100;
			}

			if ( $diff_per > 100 ) {
				$diff_per = 100;
			} 

			return array(
				'total_revenue' => $current_total_revenue,
				'chart_data' => $chart_data,
				'percentage' => abs( $diff_per ),
				'text' => $text,
				'increase' => $increase,
			);
		}

		private function calculate_year_revenue() {
			
			$todate = gmdate( 'Y-m-d' );
			$current_year = Bookify_Helper::get_current_year_range( $todate );
			$previous_year = Bookify_Helper::get_previous_year_range( $todate );
			$current_total_revenue = 0;
			$previous_total_revenue = 0;
			$diff_per = 0;
			$chart_data = array( 0 );

			$current_year_data = Bookify_Dashboard_Models::get_appointment_payments_by_date_range( $current_year );
			$previous_year_data = Bookify_Dashboard_Models::get_appointment_payments_by_date_range( $previous_year );
			
			if ( $current_year_data ) {
				foreach ( $current_year_data as $appointment ) {
					$current_total_revenue += $appointment['payment_paid'];
					array_push( $chart_data, $current_total_revenue );
				}
			} else {
				$chart_data = array( 0, 0 );
			}

			if ( $previous_year_data ) {
				foreach ( $previous_year_data as $appointment ) {
					$previous_total_revenue += $appointment['payment_paid'];
				}
			}

			if ( $current_total_revenue >= $previous_total_revenue ) {
				$text = 'Increase from last year';
				$increase = true;

			} else {
				$text = 'Decrease from last year';
				$increase = false;
			}

			if ( $previous_total_revenue > 0 ) {
				$diff_per = ( ( $current_total_revenue - $previous_total_revenue ) / $previous_total_revenue ) * 100;
			}

			if ( $previous_total_revenue == 0 &&  $current_total_revenue > 0 ) {
				$diff_per = 100;
			}

			if ( $diff_per > 100 ) {
				$diff_per = 100;
			} 

			return array(
				'total_revenue' => $current_total_revenue,
				'chart_data' => $chart_data,
				'percentage' => abs( $diff_per ),
				'text' => $text,
				'increase' => $increase,
			);
		}

		public function rest_approved_appointment_data_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}


			$reference = isset( $_POST['reference'] ) && ! empty( $_POST['reference'] ) ? sanitize_text_field( $_POST['reference'] ) : 'today';
			$appointment_data = '';

			switch ( $reference ) {
				case 'today': 
					$appointment_data = $this->calculate_today_appointment();
					break;

				case 'currentweek':
					$appointment_data = $this->calculate_week_appointment();
					break;

				case 'currentmonth':
					$appointment_data = $this->calculate_month_appointment();
					break;

				case 'currentyear':
					$appointment_data = $this->calculate_year_appointment();
					break;
			}

			return new WP_REST_Response(array(
				'success' => true,
				'approved_appointment' => $appointment_data
			), 200);
		}

		public function rest_customer_count_data_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}
			
			$reference = isset( $_POST['reference'] ) && ! empty( $_POST['reference'] ) ? sanitize_text_field( $_POST['reference'] ) : 'today';
			$customer_data = '';

			switch ( $reference ) {
				case 'today': 
					$customer_data = $this->calculate_today_customer();
					break;

				case 'currentweek':
					$customer_data = $this->calculate_week_customer();
					break;

				case 'currentmonth':
					$customer_data = $this->calculate_month_customer();
					break;

				case 'currentyear':
					$customer_data = $this->calculate_year_customer();
					break;
			}

			return new WP_REST_Response(array(
				'success' => true,
				'customer_section' => $customer_data
			), 200);
		}

		public function rest_total_revenue_data_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$reference = isset( $_POST['reference'] ) && ! empty( $_POST['reference'] ) ? sanitize_text_field( $_POST['reference'] ) : 'today';
			$total_revenue_data = '';

			switch ( $reference ) {
				case 'today': 
					$total_revenue_data = $this->calculate_today_revenue();
					break;

				case 'currentweek':
					$total_revenue_data = $this->calculate_week_revenue();
					break;

				case 'currentmonth':
					$total_revenue_data = $this->calculate_month_revenue();
					break;

				case 'currentyear':
					$total_revenue_data = $this->calculate_year_revenue();
					break;
			}

			return new WP_REST_Response(array(
				'success' => true,
				'revenue_section' => $total_revenue_data
			), 200);
		}

		public function rest_service_earning_data_callback( $request ) {

			$nonce = $request->get_header('X-WP-Nonce');
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'rest_forbidden', __('Invalid nonce.', 'bookify'), array( 'status' => 403 ) );
			}

			$service_id = isset( $_POST['service_id'] ) && ! empty( $_POST['service_id'] ) ? sanitize_text_field( $_POST['service_id'] ) : '';

			$chart_data = array(
				'Jan' => 0,
				'Feb' => 0,
				'Mar' => 0,
				'Apr' => 0,
				'May' => 0,
				'Jun' => 0,
				'Jul' => 0,
				'Aug' => 0,
				'Sep' => 0,
				'Oct' => 0,
				'Nov' => 0,
				'Dec' => 0,
			);

			if ( ! $service_id || 'none' == $service_id ) {
				return new WP_REST_Response( array(
					'service_earning_chart' => $chart_data,
				), 200 );
			}

			$payments = Bookify_Dashboard_Models::get_service_wise_earnings( $service_id );
			$currentYear = gmdate('Y');

			if ( $payments ) {
				foreach ( $payments as $payment ) {
					$year = gmdate( 'Y', strtotime( $payment['appointment_created'] ) );
					if ( ( $year == $currentYear ) && ( $payment['appointment_status'] == 'Completed' ) && ( $payment['payment_status'] == 'Paid' || $payment['payment_status'] == 'Partially Paid' ) ) {
						$month = gmdate( 'M', strtotime( $payment['appointment_created'] ) );
						$chart_data[ $month ] += $payment['payment_paid'];
					}
				}

				return new WP_REST_Response( array(
					'service_earning_chart' => $chart_data,
				), 200 );
			} else {
				return new WP_REST_Response( array(
					'service_earning_chart' => $chart_data,
				), 200 );
			}
		}
	}

	new Bookify_Dashboard_Rest_API();

}
