import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { 
    Box, Grid, FormControl, InputLabel, Select,
    MenuItem, TextField
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

class AppointmentFields extends Component {

    state = {
        services: [],
        staffs: [],
        daysOpen: [],
        holidays: [],
        specialDate: [],
        slots: [],
        statuses: [
            'Pending',
            'Confirmed',
            'Completed',
            'Delayed',
            'On Hold',
            'Cancelled'
        ],
        isLoading: true,
    }

    componentDidMount() {
        this.loadInitialData();
    }

    loadInitialData = () => {
        const { formData } = this.props;
        const ProLocation = window.ProLocation;

        if ( ProLocation ) {
            if ( formData.appointmentService !== 'none' ) {
                this.handleLocationChange({ target: { name: 'appointmentLocation', value: formData.appointmentLocation } }, true)
            }
        } else {
            if ( formData.appointmentService !== 'none' ) {
                this.handleServiceChange({ target: { name: 'appointmentService', value: formData.appointmentService } }, true)
            }
        }
    }

    handleLocationChange = ( event, initialLoad = false ) => {
        const { value } = event.target;
        const { setState } = this.props;

        const dataToSend = new FormData();
        dataToSend.append('location_id', value);

        fetch('/wp-json/bookify/v1/services-by-location', {
            method: 'POST',
            headers: {
                'X-WP-Nonce': wpApiSettings.nonce
            },
            body: dataToSend,
        })
        .then(response => response.json())
        .then(data => {
            setState(prevState => ({
                formData: {
                    ...prevState.formData,
                    appointmentLocation: value,
                    appointmentService: initialLoad ? prevState.formData.appointmentService : 'none',
                    appointmentStaff: initialLoad ? prevState.formData.appointmentStaff : 'none',
                    appointmentDate: initialLoad ? prevState.formData.appointmentDate : null,
                    appointmentDuration: initialLoad ? prevState.formData.appointmentDuration : 'none',
                    appointmentCustomer: initialLoad ? prevState.formData.appointmentCustomer : 'none',
                },
                errors: { 
                    ...prevState.errors,
                     appointmentLocation: false 
                },
            }));
            this.setState({
                services: data.services,
                staffs: [],
                slots: [],
                daysOpen: [],
                specialDate: [],
                holidays: []
            });

            if ( initialLoad && 'none' != this.props.formData.appointmentService ) {
                this.handleServiceChange({ target: { name: 'appointmentService', value: this.props.formData.appointmentService } }, true);
            }

        })
        .catch(error => {
            console.error('Error:', error);
        })
    }

    handleServiceChange = (event, initialLoad = false) => {
        const { value } = event.target;
        const { setState } = this.props;
    
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
            setState(prevState => ({
                formData: {
                    ...prevState.formData,
                    appointmentService: value,
                    appointmentStaff: initialLoad ? prevState.formData.appointmentStaff : 'none',
                    appointmentDate: initialLoad ? prevState.formData.appointmentDate : null,
                    appointmentDuration: initialLoad ? prevState.formData.appointmentDuration : 'none',
                    appointmentCustomer: initialLoad ? prevState.formData.appointmentCustomer : 'none',
                },
                errors: { 
                    ...prevState.errors,
                     appointmentService: false 
                },
            }));
            this.setState({
                staffs: data.staffs,
                slots: [],
                daysOpen: [],
                specialDate: [],
                holidays: []
            });

            if ( initialLoad && 'none' != this.props.formData.appointmentStaff ) {
                this.handleStaffChange({ target: { name: 'appointmentStaff', value: this.props.formData.appointmentStaff } }, true);
            }

        })
        .catch(error => {
            console.error('Error:', error);
        })
    }

    handleStaffChange = (event, initialLoad = false) => {
        const { value } = event.target;
        const { staffs } = this.state;
        const { setState } = this.props;

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

            const selectedStaff = staffs.find(staff => staff.staff_id === value);
            const servicePrice = selectedStaff.service_price;

            setState(prevState => ({
                formData: {
                    ...prevState.formData,
                    appointmentStaff: value,
                    appointmentDate: initialLoad ? prevState.formData.appointmentDate : null,
                    appointmentDuration: initialLoad ? prevState.formData.appointmentDuration : 'none',
                    appointmentCustomer: initialLoad ? prevState.formData.appointmentCustomer : 'none',
                },
                errors: { 
                    ...prevState.errors,
                    appointmentStaff: false 
                },
                servicePrice: servicePrice,
            }));
            this.setState({
                daysOpen: data.dates,
                specialDate: data.special,
                holidays: data.holidays
            });

            if (initialLoad && this.props.formData.appointmentDate) {
                this.handleDateChange( this.props.formData.appointmentDate, true );
            }
        })
        .catch(error => {
            console.error('Error:', error);
        })
    }

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

    handleDateChange = (date, initialLoad = false) => {
        const weekDay = date.day();
        const selectedDate = dayjs(date).format('YYYY-MM-DD');
        const { formData, setState, timeFormat } = this.props;
        const timeFormated = timeFormat === '12-hour' ? 'hh:mm A' : 'HH:mm';
    
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
    
        if (!isSpecialDate) {
            for (let key in daysOpen) {
                if (daysOpen[weekDay]) {
                    timeSlots = daysOpen[weekDay].slots;
                    break;
                }
            }
        }
    
        const dataToSend = new FormData();
        dataToSend.append('date', selectedDate);
        dataToSend.append('slots', JSON.stringify(timeSlots));
        dataToSend.append('staff_id', formData.appointmentStaff);
    
        fetch('/wp-json/bookify/v1/available-slots', {
            method: 'POST',
            headers: {
                'X-WP-Nonce': wpApiSettings.nonce
            },
            body: dataToSend,
        })
        .then(response => response.json())
        .then(data => {
            const formattedAppointmentDuration = formData.appointmentDuration
                .split(' - ')
                .map((time) => dayjs(`1970-01-01 ${time}`).format(timeFormated))
                .join(' - ');
    
            formData.appointmentDuration = formattedAppointmentDuration;
    
            let availableSlots = data.available_slots;
            if (initialLoad && formData.appointmentDuration !== 'none') {
                const updatedSlots = [...data.available_slots, formattedAppointmentDuration];
                availableSlots = this.sortTimeSlots(updatedSlots);
            }
    
            setState(prevState => ({
                formData: {
                    ...prevState.formData,
                    appointmentDate: date,
                    appointmentDuration: initialLoad ? prevState.formData.appointmentDuration : 'none'
                },
                errors: { ...prevState.errors, appointmentDate: false },
            }));
    
            this.setState({
                slots: availableSlots,
            });
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };

    handleInputChange = (event) => {
        const { name, value } = event.target;
        const { setState } = this.props;

        setState(prevState => ({
            formData: {
                ...prevState.formData,
                [name]: value,
            },
            errors: { ...prevState.errors, [name]: false }
        }));
    };

    sortTimeSlots = (slots) => {
        return Array.from(
            new Set(
                slots
                    .map(slot => {
                        const [start, end] = slot.split(' - ');
                        const [startHour, startMinute] = start.split(':').map(Number);
                        return {
                            slot,
                            startHour,
                            startMinute
                        };
                    })
                    .sort((a, b) => {
                        if (a.startHour !== b.startHour) return a.startHour - b.startHour;
                        return a.startMinute - b.startMinute;
                    })
                    .map(item => item.slot)
            )
        );
    };

    render() { 

        const { locations, customers,  formData, errors, dateFormat, priorToggle, priorTime } = this.props;
        const { statuses, staffs, slots } = this.state;
        const ProLocation = window.ProLocation;
        const allservices = ProLocation ? this.state.services : this.props.services;
        let appointmentLocation = [];

        let maxDate = null;
        if ( priorToggle == "Enable" ) {
            maxDate = dayjs().add(parseInt(priorTime), 'month');
        }

        if ( ProLocation ) {
            appointmentLocation = locations.some(location => location.id === formData.appointmentLocation) ? formData.appointmentLocation : 'none';
        }
        const appointmentService = allservices.some(service => service.id === formData.appointmentService) ? formData.appointmentService : 'none';
        const appointmentStaff = staffs.some(staff => staff.staff_id === formData.appointmentStaff) ? formData.appointmentStaff : 'none';
        const appointmentDuration = slots.includes(formData.appointmentDuration) ? formData.appointmentDuration : 'none';

        


        return (
            <>
                <Box component="form">
                    <Grid container spacing={3} direction="column">
                        {ProLocation && (
                            <Grid item>
                                <FormControl fullWidth>
                                    <InputLabel id="appointment-location" required error={errors.appointmentLocation}>{__('Location', 'bookify')}</InputLabel>
                                    <Select
                                        error={errors.appointmentLocation}
                                        required
                                        labelId="appointment-location"
                                        label={__('Location', 'bookify')}
                                        name="appointmentLocation"
                                        value={appointmentLocation}
                                        onChange={(event) => this.handleLocationChange(event, false)}
                                    >
                                        <MenuItem key="none" value="none">
                                            {__('Select Location', 'bookify')}
                                        </MenuItem>
                                        {locations.map((value) => (
                                            <MenuItem key={value.id} value={value.id}>
                                                {value.location_name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}
                        <Grid item>
                            <FormControl sx={{ minWidth: '100%', backgroundColor: '#ffffff' }}>
                                <InputLabel id="appointment-services" required error={errors.appointmentService}>{__('Services', 'bookify')}</InputLabel>
                                <Select
                                    error={errors.appointmentService}
                                    required
                                    labelId="appointment-services"
                                    label={__('Services', 'bookify')}
                                    name="appointmentService"
                                    value={appointmentService}
                                    onChange={(event) => this.handleServiceChange(event, false)}
                                >
                                    <MenuItem key="none" value="none">
                                        {__('Select Service', 'bookify')}
                                    </MenuItem>
                                    {allservices.map((value) => (
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
                                    value={appointmentStaff}
                                    onChange={(event) => this.handleStaffChange(event, false)}
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
                                        value={formData.appointmentDate}
                                        onChange={(event) => this.handleDateChange(event, false)}
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
                                    value={appointmentDuration}
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
                                    value={formData.appointmentCustomer}
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
                                    value={formData.appointmentStatus}
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
                                    value={formData.appointmentNote}
                                    onChange={this.handleInputChange}
                                />
                            </FormControl>
                        </Grid>
                    </Grid>
                </Box>
            </>
        )
    }

}

export default AppointmentFields;