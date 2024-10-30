<?php 

use Bookify\Models\Bookify_Notification_Models;

// don't call the file directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
// Notification
function bookify_get_notification_meta( $notification_id, $meta_key = false ) {
}

function bookify_add_notification_meta( $notification_id, $meta_key, $meta_value ) {
	$notification_id = absint( $notification_id );
}

function bookify_update_notification_meta( $notification_id, $meta_key, $meta_value ) {
}

function bookify_delete_notification_meta( $notification_id, $meta_key = false ) {
}


// Appointment
function bookify_get_appointments_meta( $appointment_id, $meta_key = false ) {
}

function bookify_add_appointments_meta( $appointment_id, $meta_key, $meta_value ) {
	$appointment_id = absint( $appointment_id );
}

function bookify_update_appointments_meta( $appointment_id, $meta_key, $meta_value ) {
}

function bookify_delete_appointments_meta( $appointment_id, $meta_key = false ) {
}


// Location 
function bookify_get_location_meta( $location_id, $meta_key = false ) {
}

function bookify_add_location_meta( $location_id, $meta_key, $meta_value ) {
	$location_id = absint( $location_id );
}

function bookify_update_location_meta( $location_id, $meta_key, $meta_value ) {
}

function bookify_delete_location_meta( $location_id, $meta_key = false ) {
}

// Payment 

function bookify_get_payment_meta( $payment_id, $meta_key = false ) {
}

function bookify_add_payment_meta( $payment_id, $meta_key, $meta_value ) {
	$payment_id = absint( $payment_id );
}

function bookify_update_payment_meta( $payment_id, $meta_key, $meta_value ) {
}

function bookify_delete_payment_meta( $payment_id, $meta_key = false ) {
}




// Service 

function bookify_get_service_meta( $service_id, $meta_key = false ) {
}

function bookify_add_service_meta( $service_id, $meta_key, $meta_value ) {
	$service_id = absint( $service_id );
}

function bookify_update_service_meta( $service_id, $meta_key, $meta_value ) {
}

function bookify_delete_service_meta( $service_id, $meta_key = false ) {
}

// Service Category

function bookify_get_service_categories_meta( $service_categories_id, $meta_key = false ) {
}

function bookify_add_service_categories_meta( $service_categories_id, $meta_key, $meta_value ) {
	$service_categories_id = absint( $service_categories_id );
}

function bookify_update_service_categories_meta( $service_categories_id, $meta_key, $meta_value ) {
}

function bookify_delete_service_categories_meta( $service_categories_id, $meta_key = false ) {
}
