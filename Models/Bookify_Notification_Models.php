<?php 

namespace Bookify\Models;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once ABSPATH . 'wp-admin/includes/upgrade.php' ;

if ( ! class_exists( 'Bookify_Notification_Models' ) ) { 

	final class Bookify_Notification_Models {

		public static function bookify_create_notification_table() {
			global $wpdb;
		
			$table_name = $wpdb->prefix . 'bookify_notification';
		
			$charset_collate = $wpdb->get_charset_collate();
		
			$sql = "CREATE TABLE IF NOT EXISTS $table_name (
						id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
						notification_name varchar(255) NOT NULL,
						notification_event varchar(255) NOT NULL,
						notification_toggle tinyint(1) NOT NULL,
						notification_email_subject varchar(255) NOT NULL,
						notification_email_body longtext NOT NULL,
						email_sends_to varchar(255) NOT NULL,
						PRIMARY KEY (id)
					) $charset_collate;";
		
			dbDelta( $sql );
		}

		public static function bookify_create_notification_meta_table() {
			global $wpdb;
		
			$table_name = $wpdb->prefix . 'bookify_notification_meta';
		
			$charset_collate = $wpdb->get_charset_collate();
		
			$sql = "CREATE TABLE IF NOT EXISTS $table_name (
						meta_id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
						notification_id bigint(20) unsigned NOT NULL,
						meta_key varchar(255) NULL,
						meta_value longtext NULL,
						PRIMARY KEY (meta_id)
					) $charset_collate;";

			dbDelta( $sql );
		}

		public static function bookify_get_all_notifications() {
			global $wpdb;

			$table_name = $wpdb->prefix . 'bookify_notification';
		
			$results = $wpdb->get_results( $wpdb->prepare( 'SELECT * FROM %i', $table_name ), ARRAY_A );
		
			if ( $results === null ) {
				return array();
			}
		
			return $results;
		}

		public static function bookify_get_notification_meta( $notification_id, $meta_key ) {
			global $wpdb;
			
			$table_name = $wpdb->prefix . 'bookify_notification_meta';

			$results = $wpdb->get_results( $wpdb->prepare( 'SELECT * FROM %i WHERE notification_id = %d AND meta_key = %s', $table_name, $notification_id, $meta_key ), ARRAY_A );

			if ( $results === null ) {
				return array();
			}

			return $results;
		}

		public static function bookify_delete_notification_meta( $notification_id, $meta_key ) {
			global $wpdb;

			$table_name = $wpdb->prefix . 'bookify_notification_meta';

			$result = $wpdb->query( $wpdb->prepare( 'DELETE FROM %i WHERE notification_id = %d AND meta_key = %s', $table_name, $notification_id, $meta_key ) );

			return $result;
		}

		public static function bookify_add_notification_meta( $notification_id, $meta_key, $meta_value ) {
			global $wpdb;

			$table_name = $wpdb->prefix . 'bookify_notification_meta';

			$existing_meta = $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM %i WHERE notification_id = %d AND meta_key = %s', $table_name, $notification_id, $meta_key ), ARRAY_A );
			$meta_value = json_encode( $meta_value, true );

			if ( ! $existing_meta ) {
				$data = array(
					'notification_id' => $notification_id,
					'meta_key'        => $meta_key, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
					'meta_value'      => $meta_value, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
				);

				$inserted = $wpdb->insert( "{$wpdb->prefix}bookify_notification_meta", $data , array( '%d', '%s', '%s' ) );

				if ( $inserted ) {
					return $wpdb->insert_id;
				} else {
					return false;
				}
			}
		}


		public static function bookify_update_notification_meta( $notification_id, $meta_key, $meta_value ) {
			global $wpdb;

			$table_name = $wpdb->prefix . 'bookify_notification_meta';
		   
			$existing_meta = $wpdb->get_row( $wpdb->prepare(
				'SELECT * FROM %i 
                WHERE notification_id = %d AND meta_key = %s', 
				$table_name, 
				$notification_id, 
				$meta_key 
			), ARRAY_A );

			$meta_value = json_encode( $meta_value, true );

			if ($existing_meta) {
				$data = array(
					'notification_id' => $notification_id,
					'meta_key'        => $meta_key, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
					'meta_value'      => $meta_value // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
				);

				$where = array(
					'notification_id' => $notification_id
				);

				$result = $wpdb->update(
					"{$wpdb->prefix}bookify_notification_meta",
					$data,
					$where,
					array( '%d', '%s', '%s' )
				 );

				 return $result;
			}

			return false;
		}

		public static function bookify_add_notification( $data ) {

			global $wpdb;
		
			$format = array(
				'%s',
				'%s',
				'%d',
				'%s',
				'%s',
				'%s',
			);

			$inserted = $wpdb->insert( "{$wpdb->prefix}bookify_notification", $data, $format );
			
			if ( $inserted ) {
				return $wpdb->insert_id;
			} else {
				return false;
			}
		}

		public static function bookify_delete_notification( $notification_id ) {
			global $wpdb;

			$table_name = $wpdb->prefix . 'bookify_notification';

			$result = $wpdb->query( $wpdb->prepare('DELETE FROM %i WHERE id = %d', $table_name, $notification_id) );
		
			return $result;
		}

		public static function bookify_update_notification( $notification_id, $data ) {
			global $wpdb;

			$data_format = array(
				'%s',
				'%s',
				'%d',
				'%s',
				'%s',
				'%s',
			);

			$where = array( 'id' => $notification_id );

			$where_format = array( 
				'%d'
			);

			$result = $wpdb->update( "{$wpdb->prefix}bookify_notification", $data, $where, $data_format, $where_format );

			return $result;
		}

		public static function bookify_update_notification_state( $notification_id, $data ) {
			global $wpdb;

			$data_format = array(
				'%d',
			);

			$where = array( 'id' => $notification_id );

			$where_format = array( 
				'%d'
			);

			$result = $wpdb->update( "{$wpdb->prefix}bookify_notification", $data, $where, $data_format, $where_format );
			
			return $result;
		}
	}
}
