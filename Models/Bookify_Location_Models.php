<?php 

namespace Bookify\Models;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once ABSPATH . 'wp-admin/includes/upgrade.php' ;

if ( ! class_exists( 'Bookify_Location_Models' ) ) { 

	final class Bookify_Location_Models { 

		public static function bookify_create_location_table() {
			global $wpdb;
		
			$table_name = $wpdb->prefix . 'bookify_location';
		
			$charset_collate = $wpdb->get_charset_collate();
		
			$sql = "CREATE TABLE IF NOT EXISTS $table_name (
						id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
						location_name varchar(255) NULL,
						location_phone varchar(255) NULL,
						location_address varchar(255) NULL,
						location_img varchar(255) NULL,
						location_note varchar(255) NULL,
						PRIMARY KEY (id)
					) $charset_collate;";
		
			dbDelta( $sql );
		}

		public static function bookify_create_location_meta_table() {
			global $wpdb;
		
			$table_name = $wpdb->prefix . 'bookify_location_meta';
		
			$charset_collate = $wpdb->get_charset_collate();
		
			$sql = "CREATE TABLE IF NOT EXISTS $table_name (
						meta_id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
						location_id bigint(20) unsigned NOT NULL,
						meta_key varchar(255) NULL,
						meta_value longtext NULL,
						PRIMARY KEY (meta_id)
					) $charset_collate;";

			dbDelta( $sql );
		}
	}
}
