import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions,
    Divider, IconButton, Button, Tab, Box, Typography
} from '@mui/material';
import { TabContext, TabPanel, TabList } from '@mui/lab';
import CloseIcon from '@mui/icons-material/Close';
import {SnackbarNotice} from '../../functions';
import AppointmentFields from './AppointmentFields';
import PaymentDetails from './PaymentDetails';
import dayjs from 'dayjs';
import LoadingButton from '@mui/lab/LoadingButton';

class EditAppointment extends Component { 
    state = {
        TabValue: "AppointmentDetails",
        servicePrice: '',
        formData: {
            appointmentID: '',
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
            appointmentService: false,
            appointmentStaff: false,
            appointmentDate: false,
            appointmentDuration: false,
            appointmentStatus: false,
            appointmentCustomer: false,
        },
        snackbarOpen: false,
        snackbarMessage: '',
        snackbarType: 'success',
        loading: false,
    }

    componentDidUpdate(prevProps) {
        const { editFormData } = this.props;
        if (editFormData && editFormData !== prevProps.editFormData) {
            this.setState({
                formData: {
                    appointmentID: editFormData.appointment_id,
                    appointmentLocation: editFormData.appointment_location || 'none',
                    appointmentService: editFormData.service_id || 'none',
                    appointmentStaff: editFormData.appointment_staff || 'none',
                    appointmentDate: dayjs(editFormData.appointment_date) || null,
                    appointmentDuration: editFormData.appointment_duration || 'none',
                    appointmentCustomer: editFormData.appointment_customer || 'none',
                    appointmentStatus: editFormData.appointment_status || '',
                    appointmentNote: editFormData.appointment_note || '',
                }
            });
        } else if ( ! editFormData && prevProps.editFormData ) {
            this.setState({
                formData: {
                    appointmentLocation: 'none',
                    appointmentService: 'none',
                    appointmentStaff: 'none',
                    appointmentDate: null,
                    appointmentDuration: 'none',
                    appointmentCustomer: 'none',
                    appointmentStatus: '',
                    appointmentNote: '',
                }
            });
        }
    }

    handleClose = () => { 
        this.props.onClose && this.props.onClose();
    };

    handleTabChange = (event, newValue) => {
        this.setState({
            TabValue: newValue,
        });
    };

    EditAppointmentDetails = () => {
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
    
        if ( errors.appointmentStaff || errors.appointmentService || errors.appointmentDate || errors.appointmentDuration || errors.appointmentCustomer || errors.appointmentStatus ) {
            return;
        }

        if ( ProLocation && errors.appointmentLocation ) {
            return;
        }

        this.setState({ loading: true });
    
        const dataToSend = new FormData();
        dataToSend.append('appointment_id', formData.appointmentID);
        dataToSend.append('appointment_service', formData.appointmentService);
        dataToSend.append('appointment_staff', formData.appointmentStaff);
        dataToSend.append('appointment_date', formData.appointmentDate ? formData.appointmentDate.format( 'YYYY-MM-DD' ) : '');
        dataToSend.append('appointment_duration', formData.appointmentDuration);
        dataToSend.append('appointment_price', servicePrice);
        dataToSend.append('customer_id', formData.appointmentCustomer);
        dataToSend.append('appointment_status', formData.appointmentStatus);
        dataToSend.append('note', formData.appointmentNote);

        fetch('/wp-json/bookify/v1/update-appointment', {
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
                    loading: false,
                });
                this.handleClose();
                fetchAppointmentData();
            } else {
                this.setState({ 
                    snackbarOpen: true, 
                    snackbarMessage: response.message, 
                    snackbarType:  'error',
                    loading: false,
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            this.setState({ loading: false });
        })
    };

    render() {
        const { open, locations, services, customers, priorToggle, priorTime, dateFormat, timeFormat, currency, editFormData } = this.props;
        const { TabValue, errors, snackbarOpen, snackbarMessage, snackbarType, formData, loading } = this.state;
        
        return (
            <>
                <Dialog onClose={this.handleClose} open={open} fullWidth={true} maxWidth={'sm'}>
                    <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
                        {__('Edit Appointment', 'bookify')}
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
                        <TabContext value={TabValue}>
                            <TabList onChange={this.handleTabChange}>
                                <Tab value="AppointmentDetails" label={__('Appointment Details', 'bookify')} />
                                <Tab value="PaymentDetails" label={__('Payment Details', 'bookify')}/>
                            </TabList>
                            
                            <TabPanel value="AppointmentDetails" sx={{pt:"24px", pb:"24px", pl:"0px", pr:"0px"}}>
                                <AppointmentFields
                                    state={this.state}
                                    setState={this.setState.bind(this)}
                                    formData={formData}
                                    errors={errors}
                                    locations={locations}
                                    services={services}
                                    customers={customers}
                                    dateFormat={dateFormat}
                                    timeFormat={timeFormat}
                                    priorToggle={priorToggle}
                                    priorTime={priorTime}
                                />
                            </TabPanel>

                            <TabPanel value="PaymentDetails" sx={{pt:"24px", pb:"24px", pl:"0px", pr:"0px"}}>
                                <PaymentDetails
                                    state={this.state}
                                    setState={this.setState.bind(this)}
                                    editFormData={editFormData}
                                    currency={currency}
                                />
                            </TabPanel>
                        </TabContext>
                    </DialogContent>

                { TabValue && "AppointmentDetails" == TabValue && (
                    <>
                        <Divider variant="middle" />

                        <DialogActions sx={{ margin: 2 }}>
                        
                            <LoadingButton variant="outlined" onClick={this.EditAppointmentDetails} loading={loading}>
                                {__('Update', 'bookify')}
                            </LoadingButton>

                        </DialogActions>
                    </>
                )}
                 
                </Dialog>
                <SnackbarNotice
                    state={this.state}
                    setState={this.setState.bind(this)}
                    open={snackbarOpen}
                    message={snackbarMessage}
                    type={snackbarType}
                />
            </>
        )
    }
}

export default EditAppointment;
