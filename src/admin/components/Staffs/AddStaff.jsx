import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Divider, IconButton, Tab, Button,
} from '@mui/material';
import { TabContext, TabPanel, TabList } from '@mui/lab';
import CloseIcon from '@mui/icons-material/Close';
import StaffDetailsForm from './StaffDetails';
import ServiceDetailsForm from './ServiceDetails';
import ScheduleDetailsForm from './ScheduleDetails';
import SpecialDayDetailsForm from './SpecialDayDetails';
import HolidayDetailsForm from './HolidayDetails';
import { SnackbarNotice } from '../../functions';
import dayjs from 'dayjs';
import LoadingButton from '@mui/lab/LoadingButton';

class AddStaff extends Component { 

    state = {
        addFormData: {
            fullName: '',
            profession: '',
            email: '',
            password: '',
            phoneNumber: '',
            note: '',
            image: '',
            serviceData: '',
            slotDuration: '',
            slotInterval: '',
            scheduleData: '',
            specialDayData: '',
            holidayData: '',
        },
        editFormData: {
            fullName: '',
            profession: '',
            email: '',
            password: '',
            phoneNumber: '',
            note: '',
            image: '',
            serviceData: '',
            slotDuration: '',
            slotInterval: '',
            scheduleData: '',
            specialDayData: '',
            holidayData: '',
        },
        errors: { 
            fullName: false,
            email: false,
            emailValidation: false,
            password: false,
            phoneNumber: false,
        },
        TabValue: "staffDetails",
        staffRegistered: false,
        staffRegisteredId: '',
        snackbarOpen: false,
        snackbarMessage: '',
        snackbarType: 'success',
        loading: false
    };

    componentDidUpdate(prevProps) {
        if (this.props.staffId && prevProps.staffId !== this.props.staffId) {
            this.loadStaffData(this.props.staffId);
        }
    }

    handleClose = () => this.props.onClose && this.props.onClose();

    handleClose = () => {
        this.setState({
            addFormData: {
                fullName: '',
                profession: '',
                email: '',
                password: '',
                phoneNumber: '',
                note: '',
                image: '',
                serviceData: '',
                slotDuration: '',
                slotInterval: '',
                scheduleData: '',
                specialDayData: '',
                holidayData: '',
            },
            staffRegistered: false,
        }, () => {
            this.props.onClose && this.props.onClose();
        });
    };


    handleTabChange = (event, newValue) => {
        this.setState({
            TabValue: newValue,
        });
    };

    handleServiceDataChange = (updatedServiceData) => {
        this.setState((prevState) => ({
            [this.props.staffId ? 'editFormData' : 'addFormData']: {
                ...prevState[this.props.staffId ? 'editFormData' : 'addFormData'],
                serviceData: updatedServiceData,
            },
        }));
    }

    handleScheduleDataChange = (updatedScheduleData) => {
        this.setState((prevState) => ({
            [this.props.staffId ? 'editFormData' : 'addFormData']: {
                ...prevState[this.props.staffId ? 'editFormData' : 'addFormData'],
                scheduleData: updatedScheduleData,
            },
        }));
    }

    handleSlotDurationChange = (value) => {
        this.setState((prevState) => ({
            [this.props.staffId ? 'editFormData' : 'addFormData']: {
                ...prevState[this.props.staffId ? 'editFormData' : 'addFormData'],
                slotDuration: value,
            },
        }));
    }

    handleSlotIntervalChange = (value) => {
        this.setState((prevState) => ({
            [this.props.staffId ? 'editFormData' : 'addFormData']: {
                ...prevState[this.props.staffId ? 'editFormData' : 'addFormData'],
                slotInterval: value,
            },
        }));
    }

    handleSpecialDayDataChange = (updatedSpecialDayData) => {
        this.setState((prevState) => ({
            [this.props.staffId ? 'editFormData' : 'addFormData']: {
                ...prevState[this.props.staffId ? 'editFormData' : 'addFormData'],
                specialDayData: updatedSpecialDayData,
            },
        }));
    }

    handleHolidayDataChange = (updatedHolidayData) => {
        this.setState((prevState) => ({
            [this.props.staffId ? 'editFormData' : 'addFormData']: {
                ...prevState[this.props.staffId ? 'editFormData' : 'addFormData'],
                holidayData: updatedHolidayData,
            },
        }));
    }

    handleInputChange = ( name, value ) => {
        const formState = this.props.staffId ? 'editFormData' : 'addFormData';
        this.setState(prevState => ({
            [formState]: { ...prevState[formState], [name]: value },
            errors: { ...prevState.errors, [name]: false }
        }));
    };

    loadStaffData = (staffId) => {
        const staff = this.props.fetchStaffById(staffId);
        if (staff) {
            this.setState({ 
                editFormData: {
                    fullName: staff.staff_name,
                    profession: staff.staff_profession,
                    email: staff.staff_email,
                    password: '',
                    phoneNumber: staff.staff_phone,
                    note: staff.staff_note,
                    image: staff.staff_img,
                    serviceData: staff.staff_services,
                    slotDuration: staff.staff_slot_duration,
                    slotInterval: staff.staff_slot_interval,
                    scheduleData: staff.staff_shedule,
                    specialDayData: staff.staff_special_days,
                    holidayData: staff.staff_holidays,
                }
            });
        }
    };  

    handleStaffSubmit = () => {
        const { addFormData, editFormData, staffRegistered, staffRegisteredId } = this.state;
        const { staffId, fetchStaffData } = this.props;
        const dataToSend = new FormData();
        const currentForm = staffId ? editFormData : addFormData;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const errors = {
            fullName: !currentForm.fullName,
            email: !currentForm.email,
            emailValidation: !emailRegex.test(currentForm.email),
            password: !currentForm.password,
            phoneNumber: !currentForm.phoneNumber,
        };

        this.setState({ errors });

        if ( errors.fullName || errors.email || errors.emailValidation || errors.phoneNumber || (!staffId && errors.password) ) {
            return;
        }


        if (currentForm.scheduleData) {
            if (Object.values(currentForm.scheduleData).some(day => day.fromError || day.toError)) return;
        
            Object.keys(currentForm.scheduleData).forEach(dayKey => {
                const day = currentForm.scheduleData[dayKey];
                if (day.from && day.to) {
                    day.fromFormatted = dayjs( day.from ).format("hh:mm A");
                    day.toFormatted = dayjs( day.to ).format("hh:mm A");
                }
            });
        }

        if ( currentForm.specialDayData ) {
            if (Object.values(currentForm.specialDayData).some(index => index.dateError || index.fromError || index.toError)) return;

            Object.keys(currentForm.specialDayData).forEach(index => {
                const each = currentForm.specialDayData[index];
                if (each.date && each.from && each.to) {
                    each.dateFormated = dayjs( each.date ).format("YYYY-MM-DD");
                    each.fromFormatted = dayjs( each.from ).format("hh:mm A");
                    each.toFormatted = dayjs( each.to ).format("hh:mm A");
                }
            });
        }

        if ( currentForm.holidayData ) {
            if (Object.values(currentForm.holidayData).some(index => index.nameError || index.dateError)) return;

            Object.keys(currentForm.holidayData).forEach(index => {
                const each = currentForm.holidayData[index];
                if (each.date) {
                    each.dateFormated = dayjs( each.date ).format("YYYY-MM-DD");
                }
            });
        }

        this.setState({ loading: true });

        if ( staffId || staffRegisteredId ) {
            dataToSend.append('staff_id', staffId || staffRegisteredId);
        }
        dataToSend.append('staff_name', currentForm.fullName);
        dataToSend.append('staff_email', currentForm.email);
        dataToSend.append('staff_password', currentForm.password);
        dataToSend.append('staff_profession', currentForm.profession);
        dataToSend.append('staff_phone', currentForm.phoneNumber);
        dataToSend.append('staff_note', currentForm.note);
        dataToSend.append('staff_img', currentForm.image);
        dataToSend.append('selected_services', currentForm.serviceData ? JSON.stringify(currentForm.serviceData) : '' );
        dataToSend.append('slot_duration', currentForm.slotDuration );
        dataToSend.append('slot_interval', currentForm.slotInterval );
        dataToSend.append('schedules', currentForm.scheduleData ? JSON.stringify(currentForm.scheduleData) : '' );
        dataToSend.append('special_days', currentForm.specialDayData ? JSON.stringify(currentForm.specialDayData) : '' );
        dataToSend.append('holidays', currentForm.holidayData ? JSON.stringify(currentForm.holidayData) : '' );

        const endpoint = staffId ? `/wp-json/bookify/v1/update-staff` : staffRegistered ? `/wp-json/bookify/v1/update-staff`: `/wp-json/bookify/v1/add-staff`;
        fetch(endpoint, { 
            method: 'POST',
            headers: {
                'X-WP-Nonce': wpApiSettings.nonce
            },
            body: dataToSend
        })
        .then(response => response.json())
        .then(( response ) => {
            if ( response.success ) {
                
                if ( response.redirect ) {
                    window.location.href = response.redirect;
                }

                this.setState({ 
                    snackbarOpen: true,
                    snackbarMessage: response.message,
                    snackbarType: 'success',
                    errors: { fullName: false, email: false, password: false, phoneNumber: false },
                    staffRegistered: true,
                    staffRegisteredId: response.success,
                    loading: false
                });
                fetchStaffData();
            } else {
                this.setState({ 
                    snackbarOpen: true, 
                    snackbarMessage: response.message, 
                    snackbarType:  'error',
                    loading: false
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            this.setState({ loading: false });
        })
    };

    render() { 
        const { open, staffId, services, slotDuration, slotInterval, dateFormat, timeFormat, currency } = this.props;
        const { addFormData, editFormData, errors, TabValue, staffRegistered, snackbarOpen, snackbarMessage, snackbarType, loading } = this.state;
        const currentForm = staffId ? editFormData : addFormData;
        const staffSlotDuration = currentForm.slotDuration ? currentForm.slotDuration : slotDuration;
        const staffSlotInterval = currentForm.slotInterval ? currentForm.slotInterval : slotInterval;
        return (
            <>
                <Dialog onClose={this.handleClose} open={open} fullWidth={true} sx={{ '& .MuiDialog-paper': { maxWidth: '42rem' } }}>
                    <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
                        {staffId ? __('Edit Staff', 'bookify') : __('Add Staff', 'bookify')}
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
                                <Tab value="staffDetails" label={__('Staff Details', 'bookify')} />
                                <Tab value="Services" label={__('Services', 'bookify')} disabled={staffId ? false : !staffRegistered}/>
                                <Tab value="Schedule" label={__('Schedule', 'bookify')} disabled={staffId ? false : !staffRegistered}/>
                                <Tab value="specialDays" label={__('Special Days', 'bookify')} disabled={staffId ? false : !staffRegistered}/>
                                <Tab value="Holidays" label={__('Holidays', 'bookify')} disabled={staffId ? false : !staffRegistered}/>
                            </TabList>
                            
                            <TabPanel value="staffDetails" index={0} >
                                <StaffDetailsForm 
                                    formData={currentForm}
                                    errors={errors}
                                    staffId={staffId}
                                    onChange={this.handleInputChange} 
                                />
                            </TabPanel>
                            <TabPanel value="Services" index={1}>
                                <ServiceDetailsForm 
                                    formData={currentForm.serviceData} 
                                    services={services}
                                    currency={currency}
                                    handleServiceData={this.handleServiceDataChange}
                                />
                            </TabPanel>
                            <TabPanel value="Schedule" index={2}>
                                <ScheduleDetailsForm
                                    formData={currentForm.scheduleData}
                                    timeFormat={timeFormat}
                                    slotDuration={staffSlotDuration}
                                    slotInterval={staffSlotInterval}
                                    handleScheduleData={this.handleScheduleDataChange}
                                    handleSlotDuration={this.handleSlotDurationChange}
                                    handleSlotInterval={this.handleSlotIntervalChange}
                                />
                            </TabPanel>
                            <TabPanel value="specialDays" index={3}>
                                <SpecialDayDetailsForm
                                    formData={currentForm.specialDayData}
                                    dateFormat={dateFormat}
                                    timeFormat={timeFormat}
                                    handleSpecialDayData={this.handleSpecialDayDataChange}
                                />
                            </TabPanel>
                            <TabPanel value="Holidays" index={4}>
                                <HolidayDetailsForm
                                    formData={currentForm.holidayData}
                                    dateFormat={dateFormat}
                                    timeFormat={timeFormat}
                                    handleHolidayData={this.handleHolidayDataChange}
                                />
                            </TabPanel>
                        </TabContext>
                    </DialogContent>
                    
                    <Divider variant="middle" />

                    <DialogActions sx={{ margin: 2 }}>
                        <LoadingButton variant="outlined" onClick={this.handleStaffSubmit} loading={loading}>
                            {staffId ? __('Update', 'bookify') : __('Save', 'bookify')}
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

export default AddStaff;