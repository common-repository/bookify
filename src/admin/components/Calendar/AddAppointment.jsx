import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, Box,
    Divider, IconButton, Grid, FormControl,
    Button, Select, MenuItem, InputLabel, TextField
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import {SnackbarNotice} from '../../functions';
import LoadingButton from '@mui/lab/LoadingButton';

class AddAppointment extends Component { 

    state = { 
        staffs: [],
        daysOpen: [],
        specialDates: [],
        holidays: [],
        slots: [],
        servicePrice: '',
        statuses: [
            'Pending',
            'Confirmed',
            'Completed',
            'Delayed',
            'On Hold',
            'Cancelled'
        ],
        addFormData: {
            appointmentStaff: 'none',
            appointmentService: 'none',
            appointmentDate: null,
            appointmentDuration: 'none',
            appointmentCustomer: 'none',
            appointmentStatus: '',
            appointmentNote: '',
        },
        errors: {
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
          addFormData: {
            appointmentStaff: 'none',
            appointmentService: 'none',
            appointmentDate: null,
            appointmentDuration: 'none',
            appointmentCustomer: 'none',
            appointmentNote: '',
          }
        }, () => {
          this.props.onClose && this.props.onClose();
        });
      };

    handleServiceChange = (event) => {
        const { name, value } = event.target;
    
        const dataToSend = new FormData();
        dataToSend.append('service_id', value);
    
        fetch('/wp-json/bookify/v1/staffs-by-service', {
            method: 'POST',
            headers: {
                'X-WP-Nonce': wpApiSettings.nonce
            },
            body: dataToSend,
        })
        .then(response => response.json())
        .then(data => {
            this.setState(prevState => ({
                addFormData: {
                    ...prevState.addFormData,
                    appointmentService: value,
                    appointmentDuration: 'none',
                    appointmentStaff: 'none',
                    appointmentDate: null,
                },
                errors: { ...prevState.errors, appointmentService: false },
                staffs: data.staffs,
                slots: [],
                daysOpen: [],
                specialDate: [],
                holidays: []
            }));
        })
        .catch(error => {
            console.error('Error:', error);
        })
    }

    handleStaffChange = ( event ) => {
        const { name, value } = event.target;
        const { staffs } = this.state;
        const selectedStaff = staffs.find(staff => staff.staff_id === value);
        const priceByStaff = selectedStaff.service_price;

        const dataToSend = new FormData();
        dataToSend.append('staff_id', value);

        fetch('/wp-json/bookify/v1/dates-by-staff', {
            method: 'POST',
            headers: {
                'X-WP-Nonce': wpApiSettings.nonce
            },
            body: dataToSend,
        })

        .then(response => response.json())
        .then(data => {
            this.setState(prevState => ({
                addFormData: {
                    ...prevState.addFormData,
                    appointmentStaff: value,
                    appointmentDate: null,
                    appointmentDuration: 'none',
                },
                errors: { ...prevState.errors, appointmentStaff: false },
                daysOpen: data.dates,
                specialDate: data.special,
                holidays: data.holidays,
                servicePrice: priceByStaff
            }));
        })
        .catch(error => {
            console.error('Error:', error);
        })
    }

    handleDateChange = (date) => {
        const weekDay = date.day();
        const selectedDate = dayjs(date).format('YYYY-MM-DD');
        const { addFormData } = this.state;
    
        const { daysOpen, specialDate } = this.state;
    
        let timeSlots = [];

        let isSpecialDate = false;
        for (let key in specialDate) {
            if (specialDate[key].date === selectedDate) {
                timeSlots = specialDate[key].slots;
                isSpecialDate = true;
                break;
            }
        }

        if ( ! isSpecialDate ) {
            for (let key in daysOpen) {
                if (daysOpen[weekDay]) {
                    timeSlots = daysOpen[weekDay].slots;
                    break;
                }
            }
        }

        const dataToSend = new FormData();
        dataToSend.append('date', selectedDate);
        dataToSend.append('slots', JSON.stringify( timeSlots ) );
        dataToSend.append('staff_id', addFormData.appointmentStaff);
        
        fetch('/wp-json/bookify/v1/available-slots', {
            method: 'POST',
            headers: {
                'X-WP-Nonce': wpApiSettings.nonce
            },
            body: dataToSend,
        })
        .then(response => response.json())
        .then(data => {
            this.setState(prevState => ({
                addFormData: {
                    ...prevState.addFormData,
                    appointmentDate: date,
                    appointmentDuration: 'none'
                },
                errors: { ...prevState.errors, appointmentDate: false },
                slots: data.available_slots,
            }));
        })
        .catch(error => {
            console.error('Error:', error);
        })
    };

    shouldDisableDate = (date) => {
        const { daysOpen, holidays } = this.state;
        const day = date.day();
    
        if (daysOpen.length <= 0) {
            return true;
        } else {
            const eachDay = Object.keys(daysOpen).map(day => parseInt(day));
            const isDayOpen = eachDay.includes(day);
            
            if (holidays.length > 0) {
                const holidayObjects = JSON.parse(holidays);
                const holidayDates = Object.values(holidayObjects).map(holiday => holiday.dateFormated);
                const isHoliday = holidayDates.includes(date.format('YYYY-MM-DD'));
    
                return !isDayOpen || isHoliday;
            }
    
            return !isDayOpen;
        }
    }

    handleInputChange = (event) => {
        const { name, value } = event.target;
        this.setState(prevState => ({
            addFormData: {
                ...prevState.addFormData,
                [name]: value,
            },
            errors: { ...prevState.errors, [name]: false }
        }));
    };

    AddAppointmentDetails = () => {
        const { addFormData, servicePrice } = this.state;
        const { fetchCalendarData } = this.props;

        const errors = {
            appointmentService: addFormData.appointmentService === 'none' || !addFormData.appointmentService,
            appointmentStaff: addFormData.appointmentStaff === 'none' || !addFormData.appointmentStaff,
            appointmentDate: !addFormData.appointmentDate,
            appointmentDuration: addFormData.appointmentDuration === 'none' || !addFormData.appointmentDuration,
            appointmentStatus: !addFormData.appointmentStatus,
            appointmentCustomer: addFormData.appointmentCustomer === 'none' || !addFormData.appointmentCustomer,
        };
    
        this.setState({ errors });
    
        if ( errors.appointmentStaff || errors.appointmentService || errors.appointmentDate || errors.appointmentDuration || errors.appointmentCustomer || errors.appointmentStatus ) {
            return;
        }

        this.setState({ loading: true });
    
        const dataToSend = new FormData();
        dataToSend.append('appointment_service', addFormData.appointmentService);
        dataToSend.append('appointment_staff', addFormData.appointmentStaff);
        dataToSend.append('appointment_date', addFormData.appointmentDate ? addFormData.appointmentDate.format( 'YYYY-MM-DD' ) : '');
        dataToSend.append('appointment_duration', addFormData.appointmentDuration);
        dataToSend.append('appointment_price', servicePrice);
        dataToSend.append('customer_id', addFormData.appointmentCustomer);
        dataToSend.append('appointment_status', addFormData.appointmentStatus);
        dataToSend.append('note', addFormData.appointmentNote);

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
                    loading: false,
                });
                this.handleClose();
                fetchCalendarData();
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
        const { open, services, customers, dateFormat, priorToggle, priorTime, defaultStatus } = this.props;
        const { addFormData, errors, staffs, slots, snackbarOpen, snackbarMessage, snackbarType, statuses, loading } = this.state;
        addFormData.appointmentStatus = addFormData.appointmentStatus ? addFormData.appointmentStatus : defaultStatus;

        let maxDate = null;
        if ( priorToggle == "Enable" ) {
            maxDate = dayjs().add(parseInt(priorTime), 'month');
        }

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
                        <Box component="form">
                            <Grid container spacing={3} direction="column">
                                <Grid item>
                                    <FormControl sx={{ minWidth: '100%', backgroundColor: '#ffffff' }}>
                                        <InputLabel id="appointment-services" required error={errors.appointmentService}>{__('Services', 'bookify')}</InputLabel>
                                        <Select
                                            error={errors.appointmentService}
                                            required
                                            labelId="appointment-services"
                                            label={__('Services', 'bookify')}
                                            name="appointmentService"
                                            value={addFormData.appointmentService}
                                            onChange={this.handleServiceChange}
                                        >
                                            <MenuItem key="none" value="none">
                                                {__('Select Service', 'bookify')}
                                            </MenuItem>
                                            {services.map((value) => (
                                                <MenuItem key={value.id} value={value.id}>
                                                    {value.service_name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item>
                                    <FormControl fullWidth>
                                        <InputLabel id="appointment-staffs" required error={errors.appointmentStaff}>{__('Staffs', 'bookify')}</InputLabel>
                                        <Select
                                            error={errors.appointmentStaff}
                                            required
                                            labelId="appointment-staffs"
                                            label={__('Staffs', 'bookify')}
                                            name="appointmentStaff"
                                            value={addFormData.appointmentStaff}
                                            onChange={this.handleStaffChange}
                                        >
                                            <MenuItem key="none" value="none">
                                                {__('Select Staff', 'bookify')}
                                            </MenuItem>
                                            {staffs.map((value) => (
                                                <MenuItem key={value.staff_id} value={value.staff_id}>
                                                    {value.staff_name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item>
                                    <FormControl fullWidth>
                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                            <DatePicker 
                                                format={dateFormat}
                                                disablePast
                                                label="Date"
                                                name="appointmentDate"
                                                value={addFormData.appointmentDate}
                                                onChange={this.handleDateChange}
                                                shouldDisableDate={this.shouldDisableDate}
                                                maxDate={maxDate}
                                                slotProps={{ textField: { variant: 'outlined', required:true, error:errors.appointmentDate } }}
                                            />
                                        </LocalizationProvider>
                                    </FormControl>
                                </Grid>
                                <Grid item>
                                    <FormControl fullWidth>
                                        <InputLabel id="appointment-duration" required error={errors.appointmentDuration}>{__('Duration', 'bookify')}</InputLabel>
                                        <Select
                                            error={errors.appointmentDuration}
                                            required
                                            labelId="appointment-duration"
                                            label={__('Duration', 'bookify')}
                                            name="appointmentDuration"
                                            value={addFormData.appointmentDuration}
                                            onChange={this.handleInputChange}
                                        >
                                            <MenuItem key="none" value="none">
                                                {__('Select Duration', 'bookify')}
                                            </MenuItem>
                                            {slots.map((value) => (
                                                <MenuItem key={value} value={value}>
                                                    {value}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item>
                                    <FormControl fullWidth>
                                        <InputLabel id="appointment-customers" required error={errors.appointmentCustomer}>{__('Customers', 'bookify')}</InputLabel>
                                        <Select
                                            error={errors.appointmentCustomer}
                                            required
                                            labelId="appointment-customers"
                                            label={__('Customers', 'bookify')} 
                                            name="appointmentCustomer"
                                            value={addFormData.appointmentCustomer}
                                            onChange={this.handleInputChange}
                                        >
                                            <MenuItem key="none" value="none">
                                                {__('Select Customer', 'bookify')}
                                            </MenuItem>
                                            {customers.map((value) => (
                                                <MenuItem key={value.id} value={value.id}>
                                                    {value.customer_name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item>
                                    <FormControl fullWidth>
                                        <InputLabel id="appointment-status" required error={errors.appointmentStatus}>{__('Status', 'bookify')}</InputLabel>
                                        <Select
                                            error={errors.appointmentStatus}
                                            required
                                            labelId="appointment-status"
                                            label={__('Status', 'bookify')} 
                                            name="appointmentStatus"
                                            value={addFormData.appointmentStatus}
                                            onChange={this.handleInputChange}
                                        >
                                            {statuses.map((value) => (
                                                <MenuItem key={value} value={value}>
                                                    {value}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item>
                                    <FormControl fullWidth>
                                        <TextField
                                            multiline
                                            rows={4}
                                            label={__('Note', 'bookify')}
                                            name="appointmentNote"
                                            value={addFormData.appointmentNote}
                                            onChange={this.handleInputChange}
                                        />
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Box>
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
