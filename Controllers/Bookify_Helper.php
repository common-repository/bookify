<?php

namespace Bookify\Controllers;

// don't call the file directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Bookify_Helper' ) ) { 

	class Bookify_Helper { 

		public static function bookify_services_sort( $services ) {

			if ( ! $services ) {
				return array();
			}

			foreach ( $services as $service ) {
				$categoryId = $service['id'];
				
				if ( ! isset( $result[ $categoryId ] ) ) {
					$result[ $categoryId ] = array(
						'id' => $service['id'],
						'category_name' => $service['category_name'],
						'category_slug' => $service['category_slug'],
						'services' => array(),
					);
				}
			
				$result[ $categoryId ]['services'][] = array(
					'id' => $service['service_id'],
					'service_name' => $service['service_name'],
					'service_price' => $service['service_price'],
					'service_img' => $service['service_img'],
					'service_note' => $service['service_note'],
				);
			}

			return array_values( $result );
		}

		public static function bookify_split_time( $slots_data, $duration = 30, $interval = 15, $special_days = false ) {
			$ReturnArray = array();

			if ( ! $slots_data ) {
				return array();
			}

			$general_settings = get_option( 'bookify_general_settings' );
			$get_time_format = is_array( $general_settings ) && isset( $general_settings['DefaultTimeFormat'] ) ? sanitize_text_field( $general_settings['DefaultTimeFormat'] ) : '12-hour';
			
			if ( '12-hour' == $get_time_format ) {
				$time_format = 'h:i A';
			} else {
				$time_format = 'H:i';
			}

			foreach ( $slots_data as $day => $details ) {
				if ( ( isset( $details['checked'] ) && $details['checked'] ) || $special_days ) {
					$dayIndex = gmdate( 'w', strtotime( $day ) );
					$ReturnArray[ $dayIndex ] = array();
					$ReturnArray[ $dayIndex ]['from'] = $details['fromFormatted'];
					$ReturnArray[ $dayIndex ]['to'] = $details['toFormatted'];
					if ( ! $special_days ) {
						$ReturnArray[ $dayIndex ]['breaks'] = $details['breaks'];
					} else {
						$ReturnArray[ $dayIndex ]['date'] = $details['dateFormated'];
					}
					$ReturnArray[ $dayIndex ]['slots'] = array();
		
					$StartTime = strtotime( $details['fromFormatted'] );
					$EndTime = strtotime( $details['toFormatted'] );
					$AddMins = $duration * 60;
					$gap = $interval * 60;
		
					while ( ( $StartTime + $gap ) < $EndTime ) {
						$slotStart = gmdate( $time_format, $StartTime );
						$slotEnd = gmdate( $time_format, ( $StartTime + $AddMins ) );
						
						$isBreak = false;
						if ( ! empty( $details['breaks'] ) ) {
							foreach ( $details['breaks'] as $break ) {
								list( $breakStart, $breakEnd ) = explode(' - ', $break );
								if (( $slotStart >= $breakStart && $slotStart < $breakEnd ) || ( $slotEnd > $breakStart && $slotEnd <= $breakEnd ) ) {
									$isBreak = true;
									break;
								}
							}
						}
		
						if ( ! $isBreak ) {
							$ReturnArray[ $dayIndex ]['slots'][] = $slotStart . ' - ' . $slotEnd;
						}
		
						$StartTime += ( $AddMins + $gap );
					}
				}
			}
		
			return $ReturnArray;
		}

		public static function new_customer_notification( $user_id, $body, $pass ) {

			/* EMAIL NOTIFICATION STARTS */
			$userdata = get_userdata( $user_id );
			
			if ( $userdata ) {

				$to_email = $userdata->user_email;
				/**              
				 * GFB filter.
				 * 
				 * @since 1.0.0
				 */
				$subject = apply_filters( 'bookify_new_customer_email_subject', __( 'New Customer Notification', 'bookify' ) );
				
				// Translators: %1$s %2$s, %3$s %4$s %5$s %6$s: %7$s %8$s %9$s %10$s to their strings respectively.
				$message = sprintf( '%1$s %2$s, %3$s %4$s %5$s %6$s: %7$s %8$s %9$s: %10$s %11$s %12$s: <a href="' . esc_url( wp_login_url() ) . '">%13$s</a>', __('Dear', 'bookify'), esc_attr( $userdata->display_name ), '<br />', esc_attr($body), '<br />', __('Email', 'bookify'), esc_attr( $userdata->user_email ), '<br />', __('Password', 'bookify'), esc_attr( $pass ), '<br/>', __('Login URL', 'bookify'), __('Click here to login', 'bookify') );

				$message = apply_filters( 'bookify_new_customer_email_message', $message);

				$header = array( 'Content-Type: text/html; charset=UTF-8', 'From: ' . esc_attr( get_bloginfo( 'name' ) ) . ' <' . esc_attr( get_option( 'admin_email' ) ) . '>' );

				$settings = get_option( 'bookify_notification_settings');

				if ( ! empty( $settings['senderName'] ) && ! empty( $settings['senderEmail'] ) ) {
					$header = array( 'Content-Type: text/html; charset=UTF-8', 'From: ' . trim( $settings['senderName'] ) . ' <' . trim( $settings['senderEmail'] ) . '>' );
				}
				
				return wp_mail( $to_email, $subject, $message, $header );

			}

			return false;
		}

		public static function generate_strong_password( $length = 16 ) {
		
			$characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()-_=+[]{}|;:,.<>?';
			$characters_length = strlen($characters);
			$random_password = '';
		
			for ($i = 0; $i < $length; $i++) {
				$random_password .= $characters[ rand(0, $characters_length - 1) ];
			}
		
			return $random_password;
		}

		public static function get_yesterday_date( $datestr ) {
			$dt = strtotime( $datestr );
			$yesterday_dt = strtotime( '-1 day', $dt );
			
			return gmdate( 'Y-m-d', $yesterday_dt );
		}

		public static function get_current_week_range( $datestr ) {
			$general_settings = get_option( 'bookify_general_settings' );
			$week_start = is_array( $general_settings ) && isset( $general_settings['DefaultWeekStartOn'] ) ? sanitize_text_field( $general_settings['DefaultWeekStartOn'] ) : 'Saturday';
		
			$dt = strtotime( $datestr );
		
			$week_start_days = array(
				'Sunday' => 0,
				'Monday' => 1,
				'Tuesday' => 2,
				'Wednesday' => 3,
				'Thursday' => 4,
				'Friday' => 5,
				'Saturday' => 6
			);

			$current_day_num = gmdate('w', $dt);
			$start_dt = $current_day_num == $week_start_days[ $week_start ] ? $dt : strtotime( "last $week_start", $dt );

			$end_dt = strtotime('+6 days', $start_dt);
		
			return array(
				'start' => gmdate('Y-m-d', $start_dt),
				'end' => gmdate('Y-m-d', $end_dt)
			);
		}

		public static function get_previous_week_range( $datestr ) {
			$general_settings = get_option('bookify_general_settings');
			$week_start = is_array($general_settings) && isset($general_settings['DefaultWeekStartOn']) ? sanitize_text_field($general_settings['DefaultWeekStartOn']) : 'Saturday';
		
			$dt = strtotime($datestr);
			
			$week_start_days = array(
				'Sunday' => 0,
				'Monday' => 1,
				'Tuesday' => 2,
				'Wednesday' => 3,
				'Thursday' => 4,
				'Friday' => 5,
				'Saturday' => 6
			);

			$previous_week_start_dt = strtotime("last $week_start -7 days", $dt);
			$previous_week_end_dt = strtotime('+6 days', $previous_week_start_dt);
		
			return array(
				'start' => gmdate('Y-m-d', $previous_week_start_dt),
				'end' => gmdate('Y-m-d', $previous_week_end_dt)
			);
		}

		public static function get_current_month_range( $datestr ) {
			$dt = strtotime( $datestr );
			return array(
				'start' => gmdate( 'Y-m-d', strtotime( 'first day of this month', $dt ) ),
				'end' => gmdate( 'Y-m-d', strtotime( 'last day of this month', $dt ) )
			);
		}

		public static function get_previous_month_range( $datestr ) {
			$dt = strtotime( $datestr );
		
			return array(
				'start' => gmdate( 'Y-m-d', strtotime( 'first day of last month', $dt ) ),
				'end' => gmdate( 'Y-m-d', strtotime( 'last day of last month', $dt ) )
			);
		}

		public static function get_current_year_range( $datestr ) {
			$dt = strtotime( $datestr );
			return array(
				'start' => gmdate( 'Y-01-01', $dt ),
				'end' => gmdate( 'Y-12-31', $dt )
			);
		}

		public static function get_previous_year_range( $datestr ) {
			$dt = strtotime( $datestr );
		
			return array(
				'start' => gmdate( 'Y-01-01', strtotime( 'first day of January last year', $dt ) ),
				'end' => gmdate( 'Y-12-31', strtotime( 'last day of December last year', $dt ) )
			);
		}

		public static function date_format_for_php( $format ) {
			switch ( $format ) {
				case 'DD/MM/YY':
					return 'd/m/y';
					break;

				case 'MM/DD/YY':
					return 'm/d/y';
					break;

				case 'YY/MM/DD':
					return 'y/m/d';
					break;

				case 'MMMM DD, YY':
					return 'F j, y';
					break;
				
				default:
					return 'd/m/y';
					break;
			}
		}

		public static function get_currency_symbol( $currency = '' ) {
			if ( ! $currency ) {
				$currency = '&#36;';
			}
			
			$symbols = array(
				'AED' => '&#1583;.&#1573;',
				'AFN' => '&#65;&#102;',
				'ALL' => '&#76;&#101;&#107;',
				'AMD' => '&#1423;',
				'ANG' => '&#402;',
				'AOA' => '&#75;&#122;',
				'ARS' => '&#36;',
				'AUD' => '&#36;',
				'AWG' => '&#402;',
				'AZN' => '&#1084;&#1072;&#1085;',
				'BAM' => '&#75;&#77;',
				'BBD' => '&#36;',
				'BDT' => '&#2547;',
				'BGN' => '&#1083;&#1074;',
				'BHD' => '.&#1583;.&#1576;',
				'BIF' => '&#70;&#66;&#117;',
				'BMD' => '&#36;',
				'BND' => '&#36;',
				'BOB' => '&#36;&#98;',
				'BRL' => '&#82;&#36;',
				'BSD' => '&#36;',
				'BTC' => '&#3647;',
				'BTN' => '&#78;&#117;&#46;',
				'BWP' => '&#80;',
				'BYR' => '&#112;&#46;',
				'BYN' => '&#66;&#114;',
				'BZD' => '&#66;&#90;&#36;',
				'CAD' => '&#36;',
				'CDF' => '&#70;&#67;',
				'CHF' => '&#67;&#72;&#70;',
				'CLP' => '&#36;',
				'CNY' => '&#165;',
				'COP' => '&#36;',
				'CRC' => '&#8353;',
				'CUC' => '&#8396;',
				'CUP' => '&#8396;',
				'CVE' => '&#36;',
				'CZK' => '&#75;&#269;',
				'DJF' => '&#70;&#100;&#106;',
				'DKK' => '&#107;&#114;',
				'DOP' => '&#82;&#68;&#36;',
				'DZD' => '&#1583;&#1580;',
				'EGP' => '&#163;',
				'ERN' => '&#78;&#102;&#107;',
				'ETB' => '&#66;&#114;',
				'EUR' => '&#8364;',
				'FJD' => '&#36;',
				'FKP' => '&#163;',
				'GBP' => '&#163;',
				'GEL' => '&#4314;',
				'GGP' => '&#163;',
				'GHS' => '&#162;',
				'GIP' => '&#163;',
				'GMD' => '&#68;',
				'GNF' => '&#70;&#71;',
				'GTQ' => '&#81;',
				'GYD' => '&#36;',
				'HKD' => '&#36;',
				'HNL' => '&#76;',
				'HRK' => '&#107;&#110;',
				'HTG' => '&#71;',
				'PKE' => '&#36;',
				'HUF' => '&#70;&#116;',
				'IDR' => '&#82;&#112;',
				'ILS' => '&#8362;',
				'IMP' => '&#163;',
				'INR' => '&#8377;',
				'IQD' => '&#1593;.&#1583;',
				'IRR' => '&#65020;',
				'IRT' => '&#65020;',
				'ISK' => '&#107;&#114;',
				'JEP' => '&#163;',
				'JMD' => '&#74;&#36;',
				'JOD' => '&#74;&#68;',
				'JPY' => '&#165;',
				'KES' => '&#75;&#83;&#104;',
				'KGS' => '&#1083;&#1074;',
				'KHR' => '&#6107;',
				'KMF' => '&#67;&#70;',
				'KPW' => '&#8361;',
				'KRW' => '&#8361;',
				'KWD' => '&#1583;.&#1603;',
				'KYD' => '&#36;',
				'KZT' => '&#1083;&#1074;',
				'LAK' => '&#8365;',
				'LBP' => '&#163;',
				'LKR' => '&#8360;',
				'LRD' => '&#36;',
				'LSL' => '&#76;',
				'LTL' => '&#76;&#116;',
				'LVL' => '&#76;&#115;',
				'LYD' => '&#1604;.&#1583;',
				'MAD' => '&#1583;.&#1605;.',
				'MDL' => '&#76;',
				'MGA' => '&#65;&#114;',
				'MKD' => '&#1076;&#1077;&#1085;',
				'MMK' => '&#75;',
				'MNT' => '&#8366;',
				'MOP' => '&#77;&#79;&#80;&#36;',
				'MRO' => '&#85;&#77;',
				'MUR' => '&#8360;',
				'MVR' => '.&#1923;',
				'MWK' => '&#77;&#75;',
				'MXN' => '&#36;',
				'MYR' => '&#82;&#77;',
				'MZN' => '&#77;&#84;',
				'NAD' => '&#36;',
				'NGN' => '&#8358;',
				'NIO' => '&#67;&#36;',
				'NOK' => '&#107;&#114;',
				'NPR' => '&#8360;',
				'NZD' => '&#36;',
				'OMR' => '&#65020;',
				'PAB' => '&#66;&#47;&#46;',
				'PEN' => '&#83;&#47;&#46;',
				'PGK' => '&#75;',
				'PHP' => '&#8369;',
				'PKR' => '&#8360;',
				'PLN' => '&#122;&#322;',
				'PYG' => '&#71;&#115;',
				'QAR' => '&#65020;',
				'RON' => '&#108;&#101;&#105;',
				'RSD' => '&#1044;&#1080;&#1085;&#46;',
				'RUB' => '&#1088;&#1091;&#1073;',
				'RWF' => '&#1585;.&#1587;',
				'SAR' => '&#65020;',
				'SBD' => '&#36;',
				'SCR' => '&#8360;',
				'SDG' => '&#163;',
				'SEK' => '&#107;&#114;',
				'SGD' => '&#36;',
				'SHP' => '&#163;',
				'SLL' => '&#76;&#101;',
				'SOS' => '&#83;',
				'SPL' => '&#163;',
				'SRD' => '&#36;',
				'STD' => '&#68;&#98;',
				'SVC' => '&#36;',
				'SYP' => '&#163;',
				'SZL' => '&#76;',
				'THB' => '&#3647;',
				'TJS' => '&#84;&#74;&#83;',
				'TMT' => '&#109;',
				'TND' => '&#1583;.&#1578;',
				'TOP' => '&#84;&#36;',
				'TRY' => '&#8356;',
				'TTD' => '&#36;',
				'TVD' => '&#36;',
				'TWD' => '&#78;&#84;&#36;',
				'UAH' => '&#8372;',
				'UGX' => '&#85;&#83;&#104;',
				'USD' => '&#36;',
				'UYU' => '&#36;&#85;',
				'UZS' => '&#1083;&#1074;',
				'VEF' => '&#66;&#115;',
				'VND' => '&#8363;',
				'VUV' => '&#86;&#84;',
				'WST' => '&#87;&#83;&#36;',
				'XAF' => '&#70;&#67;&#70;&#65;',
				'XCD' => '&#36;',
				'XPF' => '&#70;',
				'ZAR' => '&#82;',
				'ZMW' => '&#90;&#75;',
			);

			if ( isset( $symbols[ $currency ] ) ) {
				return $symbols[ $currency ];
			}

			return $currency;
		}
	}

}
