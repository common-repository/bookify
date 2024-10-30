import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
    FormControl, FormControlLabel, Divider, Box, Select, 
    TextField, RadioGroup, Radio, MenuItem, Button, InputLabel
} from '@mui/material';
import Grid from '@mui/material/Grid';
import CloseIcon from '@mui/icons-material/Close';
import currencies from  '../../currencies.json';
import { SnackbarNotice } from '../../functions';
import LoadingButton from '@mui/lab/LoadingButton';

class GeneralSettings extends Component {
    state = {
        GeneralCurrencies: window.wp.hooks.applyFilters( 'bookify_general_currencies', currencies ),
        GlobalSlotTimeDuration: window.wp.hooks.applyFilters('bookify_global_slot_time_duration', {
            '1': '1min',
            '5':  '5min',
            '10': '10min',
            '15': '15min',
            '30': '30min',
            '60': '1h',
            '90': '1h 30min',
            '120': '2h',
        }),
        GlobalSlotTimeInterval: window.wp.hooks.applyFilters('bookify_global_slot_time_interval', {
            '1': '1min',
            '5': '5min',
            '10': '10min',
            '15': '15min',
            '30': '30min',
        }),
        WeekStartOn: window.wp.hooks.applyFilters('bookify_week_start_on', [
            'Saturday',
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
        ]),
        AppointmentStatus: window.wp.hooks.applyFilters('bookify_appointment_status', [
            'Pending',
            'Confirmed',
            'Completed',
            'Delayed',
            'On Hold',
            'Cancelled',
        ]),
        TimeFormat: window.wp.hooks.applyFilters('bookify_time_format', [
            '12-hour',
            '24-hour',
        ]),
        DateFormat: window.wp.hooks.applyFilters('bookify_date_format', [
            'DD/MM/YY',
            'MM/DD/YY',
            'YY/MM/DD',
            'MMMM DD, YY',
        ]),
        PriorToBooking: [
            'Enable',
            'Disable',
        ],
        generalFormData: {
            DefaultGlobalSlotTimeDuration: '30',
            DefaultGlobalSlotTimeInterval: '15',
            DefaultWeekStartOn: 'Saturday',
            DefaultAppointmentStatus: 'Pending',
            DefaultTimeFormat: '12-hour',
            DefaultDateFormat: 'DD/MM/YY',
            DefaultGeneralCurrencies: 'USD',
            DefaultPriorToBooking: 'Disable',
            PriorTimeToBooking: '3',
            usersCanBook: 'registerAfterBook',
        },
        snackbarOpen: false,
        snackbarMessage: '',
        snackbarType: '',
        loading: false,
    };

    componentDidUpdate(prevProps) {
        if (prevProps.savedGeneralSettings !== this.props.savedGeneralSettings) {
            this.setState({
                generalFormData: {
                    DefaultGlobalSlotTimeDuration: this.props.savedGeneralSettings.DefaultGlobalSlotTimeDuration || '30',
                    DefaultGlobalSlotTimeInterval: this.props.savedGeneralSettings.DefaultGlobalSlotTimeInterval || '15',
                    DefaultWeekStartOn: this.props.savedGeneralSettings.DefaultWeekStartOn || 'Saturday',
                    DefaultAppointmentStatus: this.props.savedGeneralSettings.DefaultAppointmentStatus || 'Pending',
                    DefaultTimeFormat: this.props.savedGeneralSettings.DefaultTimeFormat || '12-hour',
                    DefaultDateFormat: this.props.savedGeneralSettings.DefaultDateFormat || 'DD/MM/YY',
                    DefaultGeneralCurrencies: this.props.savedGeneralSettings.DefaultGeneralCurrencies || 'USD',
                    DefaultPriorToBooking: this.props.savedGeneralSettings.DefaultPriorToBooking || 'Disable',
                    PriorTimeToBooking: this.props.savedGeneralSettings.PriorTimeToBooking || '3',
                    usersCanBook: this.props.savedGeneralSettings.usersCanBook || 'registerAfterBook',
                }
            });
        }
    }

    handleClose = () => this.props.onClose && this.props.onClose();

    handleAllInputChange = (event) => {
        const { name, value } = event.target;
        this.setState(prevState => ({
            generalFormData: {
                ...prevState.generalFormData,
                [name]: value,
            }
        }));
    }

    SaveGeneralSettings = () => {
        const { generalFormData } = this.state;
        this.setState({ loading: true });
        
        const dataToSend = new FormData();
        dataToSend.append('DefaultGlobalSlotTimeDuration', generalFormData.DefaultGlobalSlotTimeDuration);
        dataToSend.append('DefaultGlobalSlotTimeInterval', generalFormData.DefaultGlobalSlotTimeInterval);
        dataToSend.append('DefaultWeekStartOn', generalFormData.DefaultWeekStartOn);
        dataToSend.append('DefaultAppointmentStatus', generalFormData.DefaultAppointmentStatus);
        dataToSend.append('DefaultTimeFormat', generalFormData.DefaultTimeFormat);
        dataToSend.append('DefaultDateFormat', generalFormData.DefaultDateFormat);
        dataToSend.append('DefaultGeneralCurrencies', generalFormData.DefaultGeneralCurrencies);
        dataToSend.append('DefaultPriorToBooking', generalFormData.DefaultPriorToBooking);
        dataToSend.append('PriorTimeToBooking', generalFormData.PriorTimeToBooking);
        dataToSend.append('usersCanBook', generalFormData.usersCanBook);
    
        fetch('/wp-json/bookify/v1/save-general-settings', {
            method: 'POST',
            headers: {
                'X-WP-Nonce': wpApiSettings.nonce
            },
            body: dataToSend,
        })
        .then(response => response.json())
        .then((response) => {
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
        })
        .catch(error => {
            console.error('Error:', error);
            this.setState({ loading: false });
        })
    };

    render() {
        const { open } = this.props;
        const { generalFormData, GlobalSlotTimeDuration, GlobalSlotTimeInterval, WeekStartOn, AppointmentStatus, TimeFormat, DateFormat, GeneralCurrencies, PriorToBooking, snackbarOpen, snackbarMessage, snackbarType, loading } = this.state;
        
        return (
            <>
                <Dialog onClose={this.handleClose} open={open} fullWidth={true} maxWidth={'sm'}>
                    <DialogTitle sx={{display:"flex", alignItems:"center"}}>
                        {__('General Settings', 'bookify')}
                        <IconButton
                            onClick={this.handleClose}
                            sx={{
                                position: "absolute",
                                right: 8,
                                top: 8,
                                color: (theme) => theme.palette.grey[500],
                            }}
                        >
                            <CloseIcon sx={{fontSize: "1rem"}}/>
                        </IconButton>
                    </DialogTitle>

                    <Divider variant="middle" />

                    <DialogContent>
                        <Box component="form">
                            <Grid container spacing={4} direction="column">
                                <Grid item>
                                    <FormControl fullWidth>
                                        <InputLabel id="bookify-global-slot-time-duration">{__('Time Slot Duration', 'bookify')}</InputLabel>
                                        <Select 
                                            labelId="bookify-global-slot-time-duration" 
                                            name="DefaultGlobalSlotTimeDuration" 
                                            value={generalFormData.DefaultGlobalSlotTimeDuration} 
                                            label={__('Time Slot Duration', 'bookify')} 
                                            onChange={this.handleAllInputChange}
                                        >
                                            {Object.entries(GlobalSlotTimeDuration).map(([key, value]) => (
                                                <MenuItem key={key} value={key}>
                                                    {value}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item>
                                    <FormControl fullWidth>
                                        <InputLabel id="bookify-global-time-interval">{__('Time Slot Interval', 'bookify')}</InputLabel>
                                        <Select 
                                            labelId="bookify-global-time-interval" 
                                            name="DefaultGlobalSlotTimeInterval" 
                                            value={generalFormData.DefaultGlobalSlotTimeInterval} 
                                            label={__('Time Slot Interval', 'bookify')} 
                                            onChange={this.handleAllInputChange}
                                        >
                                            {Object.entries(GlobalSlotTimeInterval).map(([key, value]) => (
                                                <MenuItem key={key} value={key}>
                                                    {value}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item>
                                    <FormControl fullWidth>
                                        <InputLabel id="bookify-week-start">{__('Week Start On', 'bookify')}</InputLabel>
                                        <Select 
                                            labelId="bookify-week-start" 
                                            name="DefaultWeekStartOn" 
                                            value={generalFormData.DefaultWeekStartOn} 
                                            label={__('Week Starts On', 'bookify')} 
                                            onChange={this.handleAllInputChange}
                                        >
                                            {WeekStartOn.map((value) => (
                                                <MenuItem key={value} value={value}>
                                                    {value}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item>
                                    <FormControl fullWidth>
                                        <InputLabel id="bookify-appointment-status">{__('Default Appointment Status', 'bookify')}</InputLabel>
                                        <Select 
                                            labelId="bookify-appointment-status" 
                                            name="DefaultAppointmentStatus" 
                                            value={generalFormData.DefaultAppointmentStatus} 
                                            label={__('Default Appointment Status', 'bookify')} 
                                            onChange={this.handleAllInputChange}
                                        >
                                            {AppointmentStatus.map((value) => (
                                                <MenuItem key={value} value={value}>
                                                    {value}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item>
                                    <FormControl fullWidth>
                                        <InputLabel id="bookify-time-format">{__('Time Format', 'bookify')}</InputLabel>
                                        <Select 
                                            labelId="bookify-time-format" 
                                            name="DefaultTimeFormat" 
                                            value={generalFormData.DefaultTimeFormat} 
                                            label={__('Time Format', 'bookify')} 
                                            onChange={this.handleAllInputChange}
                                        >
                                            {TimeFormat.map((value) => (
                                                <MenuItem key={value} value={value}>
                                                    {value}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item>
                                    <FormControl fullWidth>
                                        <InputLabel id="bookify-date-format">{__('Date Format', 'bookify')}</InputLabel>
                                        <Select 
                                            labelId="bookify-date-format" 
                                            name="DefaultDateFormat" 
                                            value={generalFormData.DefaultDateFormat} 
                                            label={__('Date Format', 'bookify')} 
                                            onChange={this.handleAllInputChange}
                                        >
                                            {DateFormat.map((value) => (
                                                <MenuItem key={value} value={value}>
                                                    {value}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item>
                                    <FormControl fullWidth>
                                        <InputLabel id="bookify-currency">{__('Currency', 'bookify')}</InputLabel>
                                        <Select 
                                            labelId="bookify-currency" 
                                            name="DefaultGeneralCurrencies" 
                                            value={generalFormData.DefaultGeneralCurrencies} 
                                            label={__('Currency', 'bookify')} 
                                            onChange={this.handleAllInputChange}
                                        >
                                            {Object.values( GeneralCurrencies ).map( currency => (
                                                <MenuItem key={currency.code} value={currency.code}>
                                                    {`${currency.code} - ${currency.name}`}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item>
                                    <FormControl fullWidth>
                                        <InputLabel id="bookify-prior-booking">{__('Minimum Time Requirement Prior To Booking', 'bookify')}</InputLabel>
                                        <Select 
                                            labelId="bookify-prior-booking" 
                                            name="DefaultPriorToBooking" 
                                            value={generalFormData.DefaultPriorToBooking} 
                                            label={__('Minimum Time Requirement Prior To Booking', 'bookify')} 
                                            onChange={this.handleAllInputChange}
                                        >
                                            {PriorToBooking.map((value) => (
                                                <MenuItem key={value} value={value}>
                                                    {value}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                {generalFormData.DefaultPriorToBooking === 'Enable' && (
                                    <Grid item>
                                        <FormControl fullWidth>
                                            <TextField 
                                                type="number" 
                                                label={__('Limited Booking Month(s)', 'bookify')} 
                                                name="PriorTimeToBooking" 
                                                value={generalFormData.PriorTimeToBooking} 
                                                onChange={this.handleAllInputChange}
                                            />
                                        </FormControl>
                                    </Grid>
                                )}
                                <Grid item sx={{ paddingTop: "20px !important" }}>
                                    <FormControl fullWidth>
                                        <RadioGroup 
                                            name="usersCanBook" 
                                            value={generalFormData.usersCanBook} 
                                            onChange={this.handleAllInputChange}
                                        >   
                                            <FormControlLabel value="registerAfterBook" control={<Radio />} label="Create A New Customer On Booking" />
                                            <FormControlLabel value="onlyRegistered" control={<Radio />} label="Only Registered Customer Can Book" />
                                        </RadioGroup>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Box>  
                    </DialogContent>

                    <Divider variant="middle" />

                    <DialogActions sx={{ margin: 2 }}>
                            <LoadingButton variant="outlined" onClick={this.SaveGeneralSettings} loading={loading}>
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

export default GeneralSettings;
