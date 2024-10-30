import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { 
    Box, Grid, Typography, Button, 
    Chip, FormControl, TextField
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';

class HolidayDetailsForm extends Component {

    state = {
        Holidays: {}
    };

    componentDidMount() {
        const { formData } = this.props;
        if (formData) {
            const updatedHolidays = Object.keys(formData).reduce((acc, key) => {
                const holiday = formData[key];
                acc[key] = {
                    holidayName: holiday.holidayName || '',
                    nameError: holiday.holidayName ? false : true,
                    date: holiday.date ? dayjs(holiday.date) : null,
                    dateError: holiday.date ? false : true,
                    note: holiday.note || ''
                };
                return acc;
            }, {});
            this.setState({ Holidays: updatedHolidays });
        }
    }

    handleAddHolidays = () => {
        this.setState(prevState => {
            const newIndex = Object.keys(prevState.Holidays).length;
            const newHolidays = { ...prevState.Holidays, [newIndex]: { holidayName: '', nameError: true, date: null, dateError: true, note: '' } };
            this.props.handleHolidayData(newHolidays);
            return { Holidays: newHolidays };
        });
    }

    handleDeleteHoliday = (index) => {
        this.setState(prevState => {
            const newHolidays = { ...prevState.Holidays };
            delete newHolidays[index];
            this.props.handleHolidayData(newHolidays);
            return { Holidays: newHolidays };
        });
    }

    handleInputChange = (index, field, value) => {
        this.setState(prevState => {
            const updatedHoliday = {
                ...prevState.Holidays[index],
                [field]: value,
                ...(field === 'holidayName' && { nameError: false }),
                ...(field === 'date' && { dateError: false }),
            };

            const updatedHolidays = {
                ...prevState.Holidays,
                [index]: updatedHoliday
            };

            this.props.handleHolidayData(updatedHolidays);
            return { Holidays: updatedHolidays };
        });
    }

    renderHoliday = (holiday, index) => (
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
            <Grid item md={6} sx={{pl:"unset !important", pt:"unset !important"}}>
                <FormControl fullWidth>
                    <TextField
                        label={__('Holiday Name', 'bookify')}
                        name="name"
                        value={holiday.holidayName}
                        onChange={(e) => this.handleInputChange(index, 'holidayName', e.target.value)}
                        error={holiday.nameError}
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
                        }} 
                    />
                </FormControl>
            </Grid>
            <Grid item md={5.5} sx={{pl:"unset !important", pt:"unset !important"}}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker 
                        label="Date"
                        format={this.props.dateFormat}
                        value={holiday.date}
                        onChange={(newValue) => this.handleInputChange(index, 'date', newValue)}
                        disablePast={true}
                        slotProps={{
                            textField: {
                                error: holiday.dateError,
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
                                value={holiday.note}
                                onChange={(e) => this.handleInputChange(index, 'note', e.target.value)}
                            />
                        </FormControl>
                    </Grid>
                    <Grid item md={12} sx={{display:"flex", flexDirection:"column", alignItems:"flex-end"}}>
                        <Chip
                            label="Remove Holiday"
                            onClick={() => this.handleDeleteHoliday(index)}
                            onDelete={() => this.handleDeleteHoliday(index)}
                            deleteIcon={<DeleteIcon />}
                            variant="outlined"
                            color="error"
                        />
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );

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
                            {__('Holidays', 'bookify')}
                        </Typography>
                    </Grid>
                    <Grid item xs={5} sx={{display:"flex", flexDirection:"column", alignItems:"flex-end"}}>
                        <Button variant="contained" onClick={this.handleAddHolidays} 
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
                                {__('Add Holiday', 'bookify')}
                            </Typography>
                        </Button>
                    </Grid>
                </Grid>
                {Object.keys(this.state.Holidays).map(index => this.renderHoliday(this.state.Holidays[index], index))}
            </Box>
        )
    }
}

export default HolidayDetailsForm;
