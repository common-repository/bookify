import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions,
    Divider, IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {SnackbarNotice} from '../../functions';
import AppointmentFields from './AppointmentFields';
import LoadingButton from '@mui/lab/LoadingButton';

class AddAppointment extends Component { 

    state = { 
        servicePrice: '',
        formData: {
            appointmentLocation: 'none',
            appointmentService: 'none',
            appointmentStaff: 'none',
            appointmentDate: null,
            appointmentDuration: 'none',
            appointmentCustomer: 'none',
            appointmentStatus: '',
            appointmentNote: '',
        },
        errors: {
            appointmentLocation: false,
            appointmentStaff: false,
            appointmentService: false,
            appointmentDate: false,
            appointmentDuration: false,
            appointmentStatus: false,
            appointmentCustomer: false,
        },
        snackbarOpen: false,
        snackbarMessage: '',
        snackbarType: '',
        loading: false
    };

    handleClose = () => {
        this.setState({
          formData: {
            appointmentLocation: 'none',
            appointmentService: 'none',
            appointmentStaff: 'none',
            appointmentDate: null,
            appointmentDuration: 'none',
            appointmentCustomer: 'none',
            appointmentNote: '',
          }
        }, () => {
          this.props.onClose && this.props.onClose();
        });
    };


    AddAppointmentDetails = () => {
        const { formData, servicePrice } = this.state;
        const { fetchAppointmentData } = this.props;
        const ProLocation = window.ProLocation;

        const errors = {
            appointmentLocation: formData.appointmentLocation === 'none' || !formData.appointmentLocation,
            appointmentService: formData.appointmentService === 'none' || !formData.appointmentService,
            appointmentStaff: formData.appointmentStaff === 'none' || !formData.appointmentStaff,
            appointmentDate: !formData.appointmentDate,
            appointmentDuration: formData.appointmentDuration === 'none' || !formData.appointmentDuration,
            appointmentStatus: !formData.appointmentStatus,
            appointmentCustomer: formData.appointmentCustomer === 'none' || !formData.appointmentCustomer,
        };
    
        this.setState({ errors });
    
        if ( errors.appointmentService || errors.appointmentStaff || errors.appointmentDate || errors.appointmentDuration || errors.appointmentCustomer || errors.appointmentStatus ) {
            return;
        }

        if ( ProLocation && errors.appointmentLocation ) {
            return;
        }

        this.setState({ loading: true });
    
        const dataToSend = new FormData();
        dataToSend.append('appointment_service', formData.appointmentService);
        dataToSend.append('appointment_staff', formData.appointmentStaff);
        dataToSend.append('appointment_date', formData.appointmentDate ? formData.appointmentDate.format( 'YYYY-MM-DD' ) : '');
        dataToSend.append('appointment_duration', formData.appointmentDuration);
        dataToSend.append('appointment_price', servicePrice);
        dataToSend.append('customer_id', formData.appointmentCustomer);
        dataToSend.append('appointment_status', formData.appointmentStatus);
        dataToSend.append('note', formData.appointmentNote);

        fetch('/wp-json/bookify/v1/add-appointment', {
            method: 'POST',
            headers: {
                'X-WP-Nonce': wpApiSettings.nonce
            },
            body: dataToSend,
        })
        .then(response => response.json())
        .then(response => {
            if ( response.success ) {
                this.setState({ 
                    snackbarOpen: true,
                    snackbarMessage: response.message,
                    snackbarType: 'success',
                    loading: false
                });
                this.handleClose();
            } else {
                this.setState({ 
                    snackbarOpen: true, 
                    snackbarMessage: response.message, 
                    snackbarType:  'error',
                    loading: false
                });
            }
            fetchAppointmentData();
        })
        .catch(error => {
            console.error('Error:', error);
            this.setState({ loading: false });
        })
    };

    render() { 
        const { open, locations, services, customers, dateFormat, priorToggle, priorTime, DefaultAppointmentStatus } = this.props;
        const { formData, errors, snackbarOpen, snackbarMessage, snackbarType, loading } = this.state;
        formData.appointmentStatus = formData.appointmentStatus ? formData.appointmentStatus : DefaultAppointmentStatus;

        return (
            <>
                <Dialog onClose={this.handleClose} open={open} fullWidth={true} maxWidth={'sm'}>
                    <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
                        {__('Add Appointment', 'bookify')}
                        <IconButton
                            onClick={this.handleClose}
                            sx={{
                                position: "absolute",
                                right: 8,
                                top: 8,
                                color: (theme) => theme.palette.grey[500],
                            }}
                        >
                            <CloseIcon sx={{ fontSize: "1rem" }} />
                        </IconButton>
                    </DialogTitle>

                    <Divider variant="middle" />

                    <DialogContent>
                        <AppointmentFields
                            state={this.state}
                            setState={this.setState.bind(this)}
                            formData={formData}
                            errors={errors}
                            locations={locations}
                            services={services}
                            customers={customers}
                            dateFormat={dateFormat}
                            priorToggle={priorToggle}
                            priorTime={priorTime}
                        />
                    </DialogContent>
                    
                    <Divider variant="middle" />

                    <DialogActions sx={{ margin: 2 }}>
                        <LoadingButton variant="outlined" onClick={this.AddAppointmentDetails} loading={loading}>
                            {__('Save', 'bookify')}
                        </LoadingButton>
                    </DialogActions>
                </Dialog>
                <SnackbarNotice
                    state={this.state}
                    setState={this.setState.bind(this)}
                    open={snackbarOpen}
                    message={snackbarMessage}
                    type={snackbarType}
                />
            </>
        );
    }
}

export default AddAppointment;
