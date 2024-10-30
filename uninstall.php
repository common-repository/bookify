<?php

// don't call the file directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

global $wpdb;

$wbp_tables = array(
	'bookify_appointments',
	'bookify_appointments_meta',
	'bookify_service_categories',
	'bookify_service_categories_meta',
	'bookify_location',
	'bookify_location_meta',
	'bookify_notification',
	'bookify_notification_meta',
	'bookify_payment',
	'bookify_payment_meta',
	'bookify_service',
	'bookify_service_meta',
);

foreach ( $wbp_tables as $wbp_table ) {
	$wpdb->query( $wpdb->prepare( 'DROP TABLE IF EXISTS %i', $wpdb->prefix . $wbp_table ) );
}

$wbp_roles = array( 'bookify-staff', 'bookify-customer' );

foreach ( $wbp_roles as $wbp_role ) {
	$users = get_users( array( 'role' => $wbp_role ) );
	foreach ( $users as $user ) {
		wp_delete_user( $user->ID );
	}
	remove_role( $wbp_role );
}

$wbp_options = array(
	'bookify_company_details',
	'bookify_general_settings',
	'bookify_notification_settings',
	'bookify_payment_settings',
);

foreach ( $wbp_options as $wbp_option ) {
	delete_option( $wbp_option );
}
