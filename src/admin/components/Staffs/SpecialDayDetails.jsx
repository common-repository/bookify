import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { 
    Box, Grid, Typography, Button, 
    Chip, FormControl, TextField
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker, DatePicker } from '@mui/x-date-pickers';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';

class SpecialDayDetailsForm extends Component {
    state = {
        specialDays: {},
        timeFormat: '',
        ampm: false,
    };

    componentDidMount() {
        const { formData, timeFormat } = this.props;
        if (formData) {
            const updatedSpecialDays = Object.keys(formData).reduce((acc, key) => {
                const day = formData[key];
                acc[key] = {
                    date: day.date ? dayjs(day.date) : null,
                    dateError: day.date ? false : true,
                    from: day.from ? dayjs(day.from) : null,
                    fromError: day.from ? false : true,
                    to: day.to ? dayjs(day.to) : null,
                    toError: day.to ? false : true,
                    note: day.note || ''
                };
                return acc;
            }, {});
            this.setState({ specialDays: updatedSpecialDays });
        }

        this.setState({ 
            timeFormat: timeFormat === '12-hour' ? 'hh:mm A' : 'HH:mm',
            ampm: timeFormat === '12-hour' ? true : false,
        });
    }

    handleAddSpecialDay = () => {
        this.setState(prevState => {
            const newIndex = Object.keys(prevState.specialDays).length;
            const newSpecialDays = {
                ...prevState.specialDays,
                [newIndex]: { date: null, dateError: true, from: null, fromError: true, to: null, toError: true, note: '' }
            };
            this.props.handleSpecialDayData(newSpecialDays);
            return { specialDays: newSpecialDays };
        });
    }

    handleDeleteSpecialDay = (index) => {
        this.setState(prevState => {
            const newSpecialDays = { ...prevState.specialDays };
            delete newSpecialDays[index];
            this.props.handleSpecialDayData(newSpecialDays);
            return { specialDays: newSpecialDays };
        });
    }

    handleInputChange = (index, field, value) => {
        this.setState(prevState => {
            const updatedDay = { ...prevState.specialDays[index] };
            updatedDay[field] = value;

            if (field === 'date') {
                updatedDay.dateError = false;
            } else if (field === 'from') {
                updatedDay.fromError = false;
            } else if (field === 'to') {
                updatedDay.toError = false;
            }
    
            const updatedSpecialDays = {
                ...prevState.specialDays,
                [index]: updatedDay
            };
    
            this.props.handleSpecialDayData(updatedSpecialDays);
            return { specialDays: updatedSpecialDays };
        });
    }

    renderSpecialDay = (day, index) => {

        const { timeFormat, ampm } = this.state;

        return (
            <Grid container spacing={3} direction="row" justifyContent="space-between" alignItems="center" 
                sx={{
                    border: "1px solid #036666", 
                    borderRadius: '5px',
                    padding: "15px", 
                    mt: "unset", 
                    ml: "unset",
                    mt: "2rem",
                    width: "100%"
                }}
                key={index}
            >
                <Grid item md={3.9} sx={{pl:"unset !important", pt:"unset !important"}}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker 
                            format={this.props.dateFormat}
                            label="Date"
                            value={day.date}
                            disablePast={true}
                            onChange={(newValue) => this.handleInputChange(index, 'date', newValue)}
                            slotProps={{
                                textField: {
                                    error: day.dateError,
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
                <Grid item md={3.9} sx={{pl:"unset !important", pt:"unset !important"}}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <TimePicker 
                            label="From" 
                            format={timeFormat}
                            views={['hours', 'minutes']}
                            ampm={ampm}
                            timeSteps={{hours:1, minutes:1}}
                            value={day.from}
                            onChange={(newValue) => this.handleInputChange(index, 'from', newValue)}
                            slotProps={{
                                textField: {
                                    error: day.fromError,
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
                <Grid item md={3.9} sx={{pl:"unset !important", pt:"unset !important"}}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <TimePicker 
                            label="To" 
                            format={timeFormat}
                            views={['hours', 'minutes']}
                            ampm={ampm}
                            timeSteps={{hours:1, minutes:1}}
                            value={day.to}
                            onChange={(newValue) => this.handleInputChange(index, 'to', newValue)}
                            slotProps={{
                                textField: {
                                    error: day.toError,
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
                <Grid item xs={12} mt={1}>
                    <Grid container spacing={3} direction="row" justifyContent="space-between" alignItems="center">
                        <Grid item md={12} sx={{pl:"unset !important", pt:"10px !important", display:"flex", flexDirection:"column", alignItems:"flex-end"}}>
                            <FormControl fullWidth>
                                <TextField
                                    multiline
                                    rows={2}
                                    label={__('Note', 'bookify')}
                                    name="note"
                                    value={day.note}
                                    onChange={(e) => this.handleInputChange(index, 'note', e.target.value)}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item md={12} sx={{display:"flex", flexDirection:"column", alignItems:"flex-end"}}>
                            <Chip
                                label="Remove Special Date"
                                onClick={() => this.handleDeleteSpecialDay(index)}
                                onDelete={() => this.handleDeleteSpecialDay(index)}
                                deleteIcon={<DeleteIcon />}
                                variant="outlined"
                                color="error"
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        )
    }

    render() {
        return (
            <Box component="form">
                <Grid container spacing={3} direction="row" justifyContent="space-between" alignItems="center">
                    <Grid item xs={5}>
                        <Typography
                            variant='h6'
                            sx={{
                                textTransform: 'capitalize',
                            }}
                        >
                            {__('Special Days', 'bookify')}
                        </Typography>
                    </Grid>
                    <Grid item xs={5} sx={{display:"flex", flexDirection:"column", alignItems:"flex-end"}}>
                        <Button variant="contained" onClick={this.handleAddSpecialDay} 
                            sx={{
                                backgroundColor:"#ff6c22",
                                '&:hover': {
                                    backgroundColor:"#db6e38",
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
                                {__('Add Special Day', 'bookify')}
                            </Typography>
                        </Button>
                    </Grid>
                </Grid>
                {Object.keys(this.state.specialDays).map(index => this.renderSpecialDay(this.state.specialDays[index], index))}
            </Box>
        );
    }
}

export default SpecialDayDetailsForm;
