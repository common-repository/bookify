<?php 

namespace Bookify\Models;

use Bookify\Models\Bookify_Appointment_Models;
use Bookify\Models\Bookify_Payment_Models;
use Bookify\Models\Bookify_Service_Models;
use Bookify\Models\Bookify_Category_Models;
use Bookify\Models\Bookify_Location_Models;
use Bookify\Models\Bookify_Notification_Models;

// don't call the file directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Bookify_Models' ) ) {

	final class Bookify_Models {

		public static function bookify_create_tables() {

			Bookify_Appointment_Models::bookify_create_appointment_table();
			Bookify_Appointment_Models::bookify_create_appointment_meta_table();
			Bookify_Payment_Models::bookify_create_payment_table();
			Bookify_Payment_Models::bookify_create_payment_meta_table();
			Bookify_Service_Models::bookify_create_services_table();
			Bookify_Service_Models::bookify_create_services_meta_table();
			Bookify_Category_Models::bookify_create_service_categories_table();
			Bookify_Category_Models::bookify_create_service_categories_meta_table();
			Bookify_Location_Models::bookify_create_location_table();
			Bookify_Location_Models::bookify_create_location_meta_table();
			Bookify_Notification_Models::bookify_create_notification_table();
			Bookify_Notification_Models::bookify_create_notification_meta_table();
		}
	}

	new Bookify_Models();

}
