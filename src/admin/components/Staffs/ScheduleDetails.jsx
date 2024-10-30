import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { 
    Box, Checkbox, FormControlLabel, Button, 
    Grid, IconButton, Typography, FormControl,
    Select, MenuItem, OutlinedInput, Chip, InputLabel,

} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';

class ScheduleDetailsForm extends Component {

    state = {
        timeSlotDuration: window.wp.hooks.applyFilters('bookify_staff_slot_time_duration', {
            '1': '1min',
            '5': '5min',
            '10': '10min',
            '15': '15min',
            '30': '30min',
            '60': '1h',
            '90': '1h 30min',
            '120': '2h',
        }),
        timeSlotInterval: window.wp.hooks.applyFilters('bookify_staff_slot_time_interval', {
            '1': '1min',
            '5': '5min',
            '10': '10min',
            '15': '15min',
            '30': '30min',
        }),
        schedule: {
            monday: { checked: false, from: null, to: null, fromError: false, toError: false, breaks: null },
            tuesday: { checked: false, from: null, to: null, fromError: false, toError: false, breaks: null },
            wednesday: { checked: false, from: null, to: null, fromError: false, toError: false, breaks: null },
            thursday: { checked: false, from: null, to: null, fromError: false, toError: false, breaks: null },
            friday: { checked: false, from: null, to: null, fromError: false, toError: false, breaks: null },
            saturday: { checked: false, from: null, to: null, fromError: false, toError: false, breaks: null },
            sunday: { checked: false, from: null, to: null, fromError: false, toError: false, breaks: null }
        },
        timeSlotDurationValue: '',
        timeSlotIntervalValue: '',
        timeFormat: '',
        ampm: false
    };

    componentDidMount() {
        const { formData, slotDuration, slotInterval, timeFormat } = this.props;
        if (formData) {
            const updatedSchedule = Object.keys(formData).reduce((acc, day) => {
                acc[day] = {
                    ...formData[day],
                    from: formData[day].from ? dayjs(formData[day].from) : null,
                    to: formData[day].to ? dayjs(formData[day].to) : null
                };
                return acc;
            }, {});

            this.setState({ 
                schedule: updatedSchedule 
            });
        }

        this.setState({ 
            timeSlotDurationValue: slotDuration, 
            timeSlotIntervalValue: slotInterval,
            timeFormat: timeFormat === '12-hour' ? 'hh:mm A' : 'HH:mm',
            ampm: timeFormat === '12-hour' ? true : false,
        });
    }

    handleCheckboxChange = (event) => {
        const { name, checked } = event.target;
        const updatedSchedule = {
            ...this.state.schedule,
            [name]: {
                ...this.state.schedule[name],
                checked: checked,
                fromError: checked,
                toError: checked,
            }
        };
    
        this.setState({ schedule: updatedSchedule }, () => {
            this.props.handleScheduleData(this.state.schedule);
        });
    };

    handleTimeChange = (day, field, newValue) => {
        const isChecked = this.state.schedule[day]?.checked;
        const updatedSchedule = {
            ...this.state.schedule,
            [day]: {
                ...this.state.schedule[day],
                [field]: newValue,
                [`${field}Error`]: isChecked && !newValue
            }
        };
    
        this.setState({ schedule: updatedSchedule }, () => {
            this.props.handleScheduleData(this.state.schedule);
        });
    };

    handleAddBreak = (day) => {
        this.setState(prevState => ({
            schedule: {
                ...prevState.schedule,
                [day]: {
                    ...prevState.schedule[day],
                    breaks: []
                }
            }
        }), () => {
            this.props.handleScheduleData(this.state.schedule);
        });
    };

    handleDeleteBreak = (day) => {
        this.setState(prevState => ({
            schedule: {
                ...prevState.schedule,
                [day]: {
                    ...prevState.schedule[day],
                    breaks: null
                }
            }
        }), () => {
            this.props.handleScheduleData(this.state.schedule);
        });
    };

    handleBreakChange = (event, day) => {
        const { value } = event.target;
        this.setState(prevState => ({
            schedule: {
                ...prevState.schedule,
                [day]: {
                    ...prevState.schedule[day],
                    breaks: value
                }
            }
        }), () => {
            this.props.handleScheduleData(this.state.schedule);
        });
    };

    convertHours = (time) => {
        const { timeFormat } = this.state;
        return dayjs().startOf('day').add(time, 'minute').format( timeFormat );
    };
    
    BookifySplitTime = (start_time, end_time) => {
        let duration = parseInt(this.state.timeSlotDurationValue);
        let interval = parseInt(this.state.timeSlotIntervalValue);
        let time_slots = [];
        let start = start_time.hour() * 60 + start_time.minute();
        let end = end_time.hour() * 60 + end_time.minute();
    
        while ((start + interval) < end) {
            let slot_start = start;
            let slot_end = slot_start + duration;
            time_slots.push(`${this.convertHours(slot_start)} - ${this.convertHours(slot_end)}`);
            start = slot_end + interval;
        }
    
        return time_slots;
    };

    handleSlotDurationChange = (event) => {
        const { value } = event.target;
    
        this.setState(prevState => {
            const updatedSchedule = Object.keys(prevState.schedule).reduce((acc, day) => {
                acc[day] = {
                    ...prevState.schedule[day],
                    breaks: null
                };
                return acc;
            }, {});
    
            return {
                timeSlotDurationValue: value,
                schedule: updatedSchedule
            };
        }, () => {
            this.props.handleScheduleData(this.state.schedule);
            this.props.handleSlotDuration(value);
        });
    }

    handleSlotIntervalChange = (event) => {
        const { value } = event.target;
    
        this.setState(prevState => {
            const updatedSchedule = Object.keys(prevState.schedule).reduce((acc, day) => {
                acc[day] = {
                    ...prevState.schedule[day],
                    breaks: null
                };
                return acc;
            }, {});
    
            return {
                timeSlotIntervalValue: value,
                schedule: updatedSchedule
            };
        }, () => {
            this.props.handleScheduleData(this.state.schedule);
            this.props.handleSlotInterval(value);
        });
    }

    renderBreaks = (day) => {
        const { timeFormat } = this.state;
        const { from, to, breaks } = this.state.schedule[day];
        const slots = from && to ? this.BookifySplitTime(from, to) : [];

        if ( ! breaks ) {
            return null;
        }

        let formattedBreaks = breaks.map((breakTime) => 
            breakTime.split(' - ').map((time) => 
                dayjs(`1970-01-01 ${time}`).format(timeFormat)
            ).join(' - ')
        );
    
        return (
            <Grid item xs={12} mt={1} key={`${day}-break`}>
                <Grid container spacing={3} direction="row" justifyContent="space-between" alignItems="center">
                    <Grid item md={3} sx={{pl:"unset !important", pt:"unset !important", display:"flex", flexDirection:"column", alignItems:"flex-end"}}>
                        <Typography
                            sx={{
                                textTransform: 'capitalize',
                                color: "red",
                                fontSize: "14px",
                            }}
                        >
                            {__('Break', 'bookify')}
                        </Typography>
                    </Grid>
                    <Grid item md={6} sx={{pl:"unset !important", pt:"unset !important"}}>
                        <FormControl sx={{ width:280 }}>
                            <Select
                                multiple
                                value={formattedBreaks}
                                onChange={(event) => this.handleBreakChange(event, day)}
                                input={<OutlinedInput />}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => (
                                            <Chip key={value} label={value} />
                                        ))}
                                    </Box>
                                )}
                                sx={{
                                    '& .MuiOutlinedInput-input': {
                                        padding: '7px 10px'
                                    },
                                }}
                            >
                                {slots.map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {value}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item md={2.5} sx={{pl:"unset !important", pt:"unset !important", display:"flex", flexDirection:"column", alignItems:"center"}}>
                        <IconButton color="error" onClick={() => this.handleDeleteBreak(day)}>
                            <DeleteIcon />
                        </IconButton>
                    </Grid>
                </Grid>
            </Grid>
        );
    };

    renderDayRow = (day) => {

        const { schedule, timeFormat, ampm } = this.state;

        return (
            <Grid container spacing={3} direction="row" justifyContent="space-between" alignItems="center"
                sx={{
                    border: "1px solid #036666",
                    borderRadius: '5px',
                    padding: "10px",
                    mt: "unset",
                    ml: "unset",
                    mt: "10px",
                    width: "100%"
                }}
                key={day}
            >
                <Grid item md={3} sx={{pl:"unset !important", pt:"unset !important"}}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={schedule[day].checked}
                                onChange={this.handleCheckboxChange}
                                name={day}
                            />
                        }
                        label={day.charAt(0).toUpperCase() + day.slice(1)}
                    />
                </Grid>
                <Grid item md={3} sx={{pl:"unset !important", pt:"unset !important"}}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <TimePicker
                            label="From"
                            format={timeFormat}
                            views={['hours', 'minutes']}
                            ampm={ampm}
                            timeSteps={{hours:1, minutes:1}}
                            value={schedule[day].from}
                            onChange={(newValue) => this.handleTimeChange(day, 'from', newValue)}
                            slotProps={{
                                textField: {
                                    error: schedule[day].fromError,
                                },
                            }}
                            sx={{
                                '& input[type=text]': {
                                    padding: '7px 10px'
                                },
                                '& label': {
                                    fontSize: '13px',
                                    lineHeight: '6px',
                                    overflow: 'unset'
                                },
                                '& label.MuiInputLabel-shrink': {
                                    lineHeight: '25px',
                                },
                                '& svg': {
                                    width: '18px',
                                    height: '18px',
                                },
                            }}
                        />
                    </LocalizationProvider>
                </Grid>
                <Grid item md={3} sx={{pl:"unset !important", pt:"unset !important"}}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <TimePicker
                            label="To"
                            format={timeFormat}
                            views={['hours', 'minutes']}
                            ampm={ampm}
                            timeSteps={{hours:1, minutes:1}}
                            value={schedule[day].to}
                            onChange={(newValue) => this.handleTimeChange(day, 'to', newValue)}
                            slotProps={{
                                textField: {
                                    error: schedule[day].toError,
                                },
                            }}
                            sx={{
                                '& input[type=text]': {
                                    padding: '7px 10px'
                                },
                                '& label': {
                                    fontSize: '13px',
                                    lineHeight: '6px',
                                    overflow: 'unset'
                                },
                                '& label.MuiInputLabel-shrink': {
                                    lineHeight: '25px',
                                },
                                '& svg': {
                                    width: '18px',
                                    height: '18px',
                                },
                            }}
                        />
                    </LocalizationProvider>
                </Grid>
                <Grid item md={2.5} sx={{pl:"unset !important", pt:"unset !important", display:"flex", flexDirection:"column", alignItems:"center"}}>
                    <Button variant="contained" onClick={() => this.handleAddBreak(day)}
                        sx={{
                            backgroundColor: "#ff6c22",
                            '&:hover': {
                                backgroundColor: "#db6e38",
                            }
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: '13px',
                                lineHeight: '24px',
                                textTransform: 'capitalize',
                            }}
                        >
                            {__('Add Break', 'bookify')}
                        </Typography>
                    </Button>
                </Grid>

                {this.renderBreaks(day)}
            </Grid>
        );
    };

    render() {

        const { timeSlotDuration, timeSlotInterval, timeSlotDurationValue, timeSlotIntervalValue } = this.state;

        return (
            <>     
                <Grid container spacing={3} direction="column">
                    <Grid item>
                        <FormControl fullWidth>
                            <InputLabel id="bookify-staff-slot-time-duration">{__('Time Slot Duration', 'bookify')}</InputLabel>
                            <Select 
                                required
                                labelId="bookify-staff-slot-time-duration" 
                                name="timeSlotDurationValue" 
                                value={timeSlotDurationValue} 
                                label={__('Time Slot Duration', 'bookify')} 
                                onChange={(event) => this.handleSlotDurationChange(event)}
                            >
                                {Object.entries(timeSlotDuration).map(([key, value]) => (
                                    <MenuItem key={key} value={key}>
                                        {value}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item>
                        <FormControl fullWidth>
                            <InputLabel id="bookify-staff-slot-time-interval">{__('Time Slot Interval', 'bookify')}</InputLabel>
                            <Select 
                                required
                                labelId="bookify-staff-slot-time-interval" 
                                name="timeSlotIntervalValue" 
                                value={timeSlotIntervalValue} 
                                label={__('Time Slot Interval', 'bookify')} 
                                onChange={(event) => this.handleSlotIntervalChange(event)}
                            >
                                {Object.entries(timeSlotInterval).map(([key, value]) => (
                                    <MenuItem key={key} value={key}>
                                        {value}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item sx={{pt:"10px !important"}}>
                        <Box component="form">
                            {Object.keys(this.state.schedule).map(day => this.renderDayRow(day))}
                        </Box>
                    </Grid>
                </Grid>
            </>
        );
    }
}

export default ScheduleDetailsForm;
