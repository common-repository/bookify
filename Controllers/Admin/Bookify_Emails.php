<?php

namespace Bookify\Controllers\Admin;

use Bookify\Models\Bookify_Notification_Models;
use Bookify\Models\Bookify_Appointment_Models;
use Bookify\Models\Bookify_Category_Models;
use Bookify\Controllers\Bookify_Helper;

// don't call the file directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Bookify_Emails' ) ) {

	class Bookify_Emails {

		private $sender_name = '';
		private $sender_email = '';
		private $headers = '';

		public function __construct() { 

			$bookify_notification_settings = get_option('bookify_notification_settings');
			$this->sender_name = is_array( $bookify_notification_settings ) && isset( $bookify_notification_settings['senderName'] ) ? $bookify_notification_settings['senderName'] : '';
			$this->sender_email = is_array( $bookify_notification_settings ) && isset( $bookify_notification_settings['senderEmail'] ) ? $bookify_notification_settings['senderEmail'] : '';

			if ( ! $this->sender_name || ! $this->sender_email ) {
				return;
			}

			$this->headers = array( 'Content-Type: text/html; charset=UTF-8' );
			$this->headers[] = 'From: ' . $this->sender_name . '<' . $this->sender_email . '>';

			add_action( 'bookify_appointment_requested_email', array( $this, 'bookify_appointment_requested_email_callback' ), 10, 1 );
			add_action( 'bookify_appointment_status_changed_email', array( $this, 'bookify_appointment_status_changed_email_callback' ), 10, 3 );
			add_action( 'bookify_staff_created_email', array( $this, 'bookify_staff_created_callback' ), 10, 1 );
		}

		public function bookify_appointment_requested_email_callback( $appointment_id ) {

			$appointment_data = Bookify_Appointment_Models::bookify_get_all_appointments_by_id( $appointment_id );
			$notification_data = Bookify_Notification_Models::bookify_get_all_notifications();

			foreach ( $notification_data as $notification ) {

				if ( $notification['notification_toggle'] && $notification['notification_toggle'] == 1 ) {

					$email_sends_to = json_decode( $notification['email_sends_to'], true );
					$email_content = $this->replace_placeholders_for_appointment_emails( $notification, $appointment_data );

					switch ( $notification['notification_event'] ) {
						case 'Appointment Requested': 
							if ( isset( $email_sends_to['admin'] ) && $email_sends_to['admin'] == 'true' ) {
								$admin_email = get_option( 'admin_email' );
								wp_mail( $admin_email, $email_content['subject'], $email_content['body'], $this->headers );
							}
	
							if ( isset( $email_sends_to['staff'] ) && $email_sends_to['staff'] == 'true' ) {
								$staff = get_userdata( (int) $appointment_data['appointment_staff'] );
								wp_mail( $staff->user_email, $email_content['subject'], $email_content['body'], $this->headers );
							}

							if ( isset( $email_sends_to['customer'] ) && $email_sends_to['customer'] == 'true' ) {
								$customer = get_userdata( (int) $appointment_data['appointment_customer'] );
								wp_mail( $customer->user_email, $email_content['subject'], $email_content['body'], $this->headers );
							}
							
							break;
					}
				}
			}
		}

		public function bookify_appointment_status_changed_email_callback( $appointment_id, $prev_status, $new_status ) {

			$appointment_data = Bookify_Appointment_Models::bookify_get_all_appointments_by_id( $appointment_id );
			$notification_data = Bookify_Notification_Models::bookify_get_all_notifications();

			foreach ( $notification_data as $notification ) {

				if ( $notification['notification_toggle'] && $notification['notification_toggle'] == 1 ) {

					$email_sends_to = json_decode( $notification['email_sends_to'], true );
					$email_content = $this->replace_placeholders_for_appointment_emails( $notification, $appointment_data );

					switch ( $notification['notification_event'] ) {
						case 'Appointment Confirmed':
							if ( $new_status === 'Confirmed' &&  $prev_status != $new_status ) {
								if ( isset( $email_sends_to['admin'] ) && $email_sends_to['admin'] == 'true' ) {
									$admin_email = get_option( 'admin_email' );
									wp_mail( $admin_email, $email_content['subject'], $email_content['body'], $this->headers );
								}
		
								if ( isset( $email_sends_to['staff'] ) && $email_sends_to['staff'] == 'true' ) {
									$staff = get_userdata( (int) $appointment_data['appointment_staff'] );
									wp_mail( $staff->user_email, $email_content['subject'], $email_content['body'], $this->headers );
								}
	
								if ( isset( $email_sends_to['customer'] ) && $email_sends_to['customer'] == 'true' ) {
									$customer = get_userdata( (int) $appointment_data['appointment_customer'] );
									wp_mail( $customer->user_email, $email_content['subject'], $email_content['body'], $this->headers );
								}
							}
							
							break;

						case 'Appointment Cancelled':
							if ( $new_status === 'Cancelled' && $prev_status != $new_status ) {
								if ( isset( $email_sends_to['admin'] ) && $email_sends_to['admin'] == 'true' ) {
									$admin_email = get_option( 'admin_email' );
									wp_mail( $admin_email, $email_content['subject'], $email_content['body'], $this->headers );
								}
		
								if ( isset( $email_sends_to['staff'] ) && $email_sends_to['staff'] == 'true' ) {
									$staff = get_userdata( (int) $appointment_data['appointment_staff'] );
									wp_mail( $staff->user_email, $email_content['subject'], $email_content['body'], $this->headers );
								}
	
								if ( isset( $email_sends_to['customer'] ) && $email_sends_to['customer'] == 'true' ) {
									$customer = get_userdata( (int) $appointment_data['appointment_customer'] );
									wp_mail( $customer->user_email, $email_content['subject'], $email_content['body'], $this->headers );
								}
							}

							break;
					}
				}
			}
		}

		public function bookify_staff_created_callback( $staff_id ) {
			$notification_data = Bookify_Notification_Models::bookify_get_all_notifications();

			foreach ( $notification_data as $notification ) {

				if ( $notification['notification_toggle'] && $notification['notification_toggle'] == 1 ) {

					$email_sends_to = json_decode( $notification['email_sends_to'], true );
					$email_content = $this->replace_placeholders_for_staff_emails( $notification, $staff_id );

					switch ( $notification['notification_event'] ) {
						case 'Staff Created':
							if ( isset( $email_sends_to['admin'] ) && $email_sends_to['admin'] == 'true' ) {
								$admin_email = get_option( 'admin_email' );
								wp_mail( $admin_email, $email_content['subject'], $email_content['body'], $this->headers );
							}
	
							if ( isset( $email_sends_to['staff'] ) && $email_sends_to['staff'] == 'true' ) {
								$staff = get_userdata( (int) $staff_id );
								wp_mail( $staff->user_email, $email_content['subject'], $email_content['body'], $this->headers );
							}
							
							break;
					}
				}
			}
		}

		public function replace_placeholders_for_appointment_emails( $notification, $appointment_data ) {
			$data = array();
			$staff_data = get_userdata( (int) $appointment_data['appointment_staff'] );
			$customer_data = get_userdata( (int) $appointment_data['appointment_customer'] );
			$company_details = get_option( 'bookify_company_details' );
			$general_settings = get_option( 'bookify_general_settings' );
			$date_format = Bookify_Helper::date_format_for_php( is_array( $general_settings ) && isset( $general_settings['DefaultDateFormat'] ) ? $general_settings['DefaultDateFormat'] : '' );
			$category_details = Bookify_Category_Models::bookify_get_service_category_by_service( $appointment_data['service_id'] );
			$currnecy_symbol = Bookify_Helper::get_currency_symbol( is_array( $general_settings ) && isset( $general_settings['DefaultGeneralCurrencies'] ) ? $general_settings['DefaultGeneralCurrencies'] : '' );

			$data['subject'] = $notification['notification_email_subject'];
			$data['body'] = $notification['notification_email_body'];
		
			foreach ( $data as $key => $value ) {
				$value = str_replace( '{appointment_id}', '#' . $appointment_data['appointment_id'], $value );
				$value = str_replace( '{appointment_date}', gmdate( $date_format, strtotime( $appointment_data['appointment_date'] ) ), $value );
				$value = str_replace( '{appointment_slot}', $appointment_data['appointment_duration'] , $value );
				$value = str_replace( '{appointment_duration}', get_user_meta( $staff_data->ID, 'bookify_staff_slot_duration', true ) . 'min', $value );
				$value = str_replace( '{appointment_service_category}', $category_details->category_name, $value );
				$value = str_replace( '{appointment_service}', $appointment_data['service_name'], $value );
				$value = str_replace( '{appointment_price}', $currnecy_symbol . ' ' . $appointment_data['appointment_price'], $value );
				$value = str_replace( '{appointment_status}', $appointment_data['appointment_status'], $value );
				$value = str_replace( '{customer_name}', $customer_data->display_name, $value );
				$value = str_replace( '{customer_phone}', get_user_meta( $customer_data->ID, 'bookify_customer_phone', true ), $value );
				$value = str_replace( '{customer_email}', $customer_data->user_email, $value );
				$value = str_replace( '{staff_name}', $staff_data->display_name, $value );
				$value = str_replace( '{staff_phone}', get_user_meta( $staff_data->ID, 'bookify_staff_phone', true ), $value );
				$value = str_replace( '{staff_email}', $staff_data->user_email, $value );
				$value = str_replace( '{staff_profession}', get_user_meta( $staff_data->ID, 'bookify_staff_profession', true ), $value );
				$value = str_replace( '{company_name}', isset( $company_details['companyName'] ) ? $company_details['companyName'] : '', $value );
				$value = str_replace( '{company_address}', isset( $company_details['address'] ) ? $company_details['address'] : '', $value );
				$value = str_replace( '{company_phone}', isset( $company_details['phoneNumber'] ) ? $company_details['phoneNumber'] : '', $value );
				$value = str_replace( '{company_website}', isset( $company_details['website'] ) ? $company_details['website'] : '', $value );
				$value = str_replace( '{company_logo}', isset( $company_details['image'] ) ? $company_details['image'] : '', $value );

				$data[ $key ] = $value;
			}
		
			return $data;
		}

		public function replace_placeholders_for_staff_emails( $notification, $staff_id ) {
			$data = array();
			$staff_data = get_userdata( (int) $staff_id );
			$company_details = get_option( 'bookify_company_details' );

			$data['subject'] = $notification['notification_email_subject'];
			$data['body'] = $notification['notification_email_body'];
		
			foreach ( $data as $key => $value ) {
				$value = str_replace( '{appointment_id}', '', $value );
				$value = str_replace( '{appointment_date}', '', $value );
				$value = str_replace( '{appointment_slot}', '', $value );
				$value = str_replace( '{appointment_duration}', '', $value );
				$value = str_replace( '{appointment_service_category}', '', $value );
				$value = str_replace( '{appointment_service}', '', $value );
				$value = str_replace( '{appointment_price}', '', $value );
				$value = str_replace( '{appointment_status}', '', $value );
				$value = str_replace( '{customer_name}', '', $value );
				$value = str_replace( '{customer_phone}', '', $value );
				$value = str_replace( '{customer_email}', '', $value );
				$value = str_replace( '{staff_name}', $staff_data->display_name, $value );
				$value = str_replace( '{staff_phone}', get_user_meta( $staff_data->ID, 'bookify_staff_phone', true ), $value );
				$value = str_replace( '{staff_email}', $staff_data->user_email, $value );
				$value = str_replace( '{staff_profession}', get_user_meta( $staff_data->ID, 'bookify_staff_profession', true ), $value );
				$value = str_replace( '{company_name}', isset( $company_details['companyName'] ) ? $company_details['companyName'] : '', $value );
				$value = str_replace( '{company_address}', isset( $company_details['address'] ) ? $company_details['address'] : '', $value );
				$value = str_replace( '{company_phone}', isset( $company_details['phoneNumber'] ) ? $company_details['phoneNumber'] : '', $value );
				$value = str_replace( '{company_website}', isset( $company_details['website'] ) ? $company_details['website'] : '', $value );
				$value = str_replace( '{company_logo}', isset( $company_details['image'] ) ? $company_details['image'] : '', $value );

				$data[ $key ] = $value;
			}
		
			return $data;
		}
	}
}
