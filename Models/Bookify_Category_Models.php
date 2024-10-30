<?php 

namespace Bookify\Models;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once ABSPATH . 'wp-admin/includes/upgrade.php' ;

if ( ! class_exists( 'Bookify_Category_Models' ) ) { 

	final class Bookify_Category_Models { 

		public static function bookify_create_service_categories_table() {
			global $wpdb;
		
			$table_name = $wpdb->prefix . 'bookify_service_categories';
		
			$charset_collate = $wpdb->get_charset_collate();
		
			$sql = "CREATE TABLE IF NOT EXISTS $table_name (
						id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
						category_name varchar(255) NULL,
						category_slug varchar(255) NULL,
						PRIMARY KEY (id)
					) $charset_collate;";

			dbDelta( $sql );
		}

		public static function bookify_create_service_categories_meta_table() {
			global $wpdb;
		
			$table_name = $wpdb->prefix . 'bookify_service_categories_meta';
		
			$charset_collate = $wpdb->get_charset_collate();
		
			$sql = "CREATE TABLE IF NOT EXISTS $table_name (
						meta_id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
						service_categories_id bigint(20) unsigned NOT NULL,
						meta_key varchar(255) NULL,
						meta_value longtext NULL,
						PRIMARY KEY (meta_id)
					) $charset_collate;";
		
			dbDelta( $sql );
		}

		public static function bookify_get_all_service_categories() {
			global $wpdb;

			$table_name = $wpdb->prefix . 'bookify_service_categories';
		
			$results = $wpdb->get_results( $wpdb->prepare( 'SELECT * FROM %i', $table_name ), ARRAY_A );
		
			if ( $results === null ) {
				return array();
			}
		
			return $results;
		}

		public static function bookify_get_service_category_by_service( $service_id ) {
			global $wpdb;

			$category_table = $wpdb->prefix . 'bookify_service_categories';
			$service_table = $wpdb->prefix . 'bookify_service';
		
			$results = $wpdb->get_row( 
				$wpdb->prepare( 
					'SELECT * FROM %i as category
					JOIN %i as service
					ON category.id = service.service_category
					WHERE service.id = %d',
					$category_table,
					$service_table,
					$service_id
				)
			);
		
			if ( $results === null ) {
				return array();
			}
		
			return $results;
		}

		public static function bookify_add_service_category( $data ) {
			global $wpdb;
		
			$format = array(
				'%s',
				'%s',
			);
			$inserted = $wpdb->insert( "{$wpdb->prefix}bookify_service_categories", $data, $format );
		
			if ( $inserted ) {
				return $wpdb->insert_id;
			} else {
				return false;
			}
		}

		public static function bookify_delete_service_category( $category_id ) {
			global $wpdb;

			$table_name = $wpdb->prefix . 'bookify_service_categories';

			$result = $wpdb->query( $wpdb->prepare( 'DELETE FROM %i WHERE id = %d', $table_name, $category_id ) );
		
			return $result;
		}

		public static function bookify_update_service_category( $category_id, $data ) {
			global $wpdb;

			$where = array( 'id' => $category_id );

			$result = $wpdb->update( "{$wpdb->prefix }bookify_service_categories", $data, $where );
		
			return $result;
		}
	}

}
