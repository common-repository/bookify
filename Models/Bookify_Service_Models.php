<?php 

namespace Bookify\Models;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once ABSPATH . 'wp-admin/includes/upgrade.php' ;

if ( ! class_exists( 'Bookify_Service_Models' ) ) { 

	final class Bookify_Service_Models { 

		public static function bookify_create_services_table() {
			global $wpdb;
		
			$table_name = $wpdb->prefix . 'bookify_service';
		
			$charset_collate = $wpdb->get_charset_collate();
		
			$sql = "CREATE TABLE IF NOT EXISTS $table_name (
                        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
                        service_name varchar(255) NULL,
                        service_category bigint(20) unsigned NULL,
                        service_price float(20) unsigned NULL,
						service_location varchar(255) NULL,
                        service_img varchar(255) NULL,
                        service_note varchar(255) NULL,
                        PRIMARY KEY  (id)
                    ) $charset_collate;";
		
			dbDelta( $sql );
		}
		

		public static function bookify_create_services_meta_table() {
			global $wpdb;
		
			$table_name = $wpdb->prefix . 'bookify_service_meta';
		
			$charset_collate = $wpdb->get_charset_collate();
		
			$sql = "CREATE TABLE IF NOT EXISTS $table_name (
                        meta_id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
                        service_id bigint(20) unsigned NOT NULL,
                        meta_key varchar(255) NULL,
                        meta_value longtext NULL,
                        PRIMARY KEY  (meta_id)
                    ) $charset_collate;";
		
			dbDelta( $sql );
		}

		public static function bookify_get_all_category_services( $categories = '' ) {
			global $wpdb;

			$service_table = $wpdb->prefix . 'bookify_service';
			$service_category_table = $wpdb->prefix . 'bookify_service_categories';

			$where = '';
			if ( $categories ) {
				$categories_array = array_map( 'intval', explode( ',', $categories ) );
				$in_placeholder = implode( ',', array_fill( 0, count( $categories_array ), '%d' ) );
				$where = $wpdb->prepare( "WHERE service.service_category IN ($in_placeholder)", ...$categories_array );
			}
		
			$results = $wpdb->get_results( $wpdb->prepare(
				"SELECT 
					service.id AS service_id, 
					service.*, 
					category.*
				FROM %i AS service
				JOIN %i AS category
				ON service.service_category = category.id $where",
				$service_table, 
				$service_category_table,
			), ARRAY_A );
		
			if ( $results === null ) {
				return array();
			}
		
			return $results;
		}

		public static function bookify_get_all_services_by_location( $location_id ) {
			global $wpdb;
		
			$service_table = $wpdb->prefix . 'bookify_service';

			$results = $wpdb->get_results( $wpdb->prepare(
				"SELECT 
					*
				FROM %i AS service
				WHERE (JSON_CONTAINS(service.service_location, %s) OR service.service_location = '[]')",
				$service_table,
				json_encode(array( $location_id ))
			), ARRAY_A );
		
			if ( $results === null ) {
				return array();
			}
		
			return $results;
		}

		public static function bookify_get_all_categorizedservices_by_location( $location_id ) {
			global $wpdb;
		
			$service_table = $wpdb->prefix . 'bookify_service';
			$service_category_table = $wpdb->prefix . 'bookify_service_categories';
		
			$results = $wpdb->get_results( $wpdb->prepare(
				"SELECT 
					service.id AS service_id, 
					service.*, 
					category.*
				FROM %i AS service
				JOIN %i AS category
				ON service.service_category = category.id 
				WHERE (JSON_CONTAINS(service.service_location, %s) OR service.service_location = '[]')",
				$service_table,
				$service_category_table,
				json_encode(array( $location_id ))
			), ARRAY_A );
		
			if ( $results === null ) {
				return array();
			}
		
			return $results;
		}

		public static function bookify_get_all_services() {
			global $wpdb;
		
			$table_name = $wpdb->prefix . 'bookify_service';
		
			$results = $wpdb->get_results( $wpdb->prepare( 'SELECT * FROM %i' , $table_name ), ARRAY_A);
		
			if ( $results === null ) {
				return array();
			}
		
			return $results;
		}

		public static function bookify_add_service( $data ) {
			global $wpdb;
		
			$format = array(
				'%s',
				'%f',
				'%d',
				'%s',
				'%s',
				'%s',
			);

			$inserted = $wpdb->insert( "{$wpdb->prefix}bookify_service", $data, $format );
		
			if ( $inserted ) {
				return $wpdb->insert_id;
			} else {
				return false;
			}
		}

		public static function bookify_delete_service( $service_id ) {
			global $wpdb;

			$table_name = $wpdb->prefix . 'bookify_service';

			$result = $wpdb->query( $wpdb->prepare( 'DELETE FROM %i WHERE id = %d', $table_name, $service_id ) );
		
			return $result;
		}

		public static function bookify_update_service( $service_id, $data ) {
			global $wpdb;

			$where = array( 'id' => $service_id );

			$result = $wpdb->update( "{$wpdb->prefix}bookify_service", $data, $where );
		
			return $result;
		}
	}

}
