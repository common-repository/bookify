import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { 
    Stack, Typography, Divider, Box, Button,
    Grid, FormControl, Select, MenuItem
} from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import SortIcon from '@mui/icons-material/Sort';
import PostAddIcon from '@mui/icons-material/PostAdd';
import AddAppointment from './AddAppointment';
import { 
    openDialog, closeDialog
} from '../../functions';
import dayjs from 'dayjs';


class Calendar extends Component {
    state = {
        CalenderData: [],
        dateFormat: '',
        priorToggle: 'Disable',
        priorTime: '3',
        staffs: [],
        services: [],
        customers: [],
        calendarStaffFilter: 'none',
        defaultAppointmentStatus: 'Pending',
        isStaff: false,
        theme: createTheme({
            typography: {
                h2: {
                    fontSize: '2.5em',
                    textTransform: 'capitalize',
                },
                h5: {
                    fontSize: '1.5em',
                    textTransform: 'capitalize',
                    color: '#000000',
                },
            },
            components: {
                MuiPaper: {
                    variants: [
                        {
                            props: { variant: 'bookify-variant' },
                            style: {
                                width: '4em',
                                height: '4em',
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            },
                        },
                    ],
                },
            },
        }),
    };

    componentDidMount() {
        const title = window.wp.hooks.applyFilters('bookify_calendar_title', 'Calendar');
        this.setState({ title });

        this.fetchCalendarData();
    }

    fetchCalendarData = (searchStaff = '') => {
        let queryString = '';
        if ( searchStaff ) {
            queryString = `?staff=${searchStaff}`
        }

        fetch(`/wp-json/bookify/v1/calendar${queryString}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': wpApiSettings.nonce
            }
        })
        .then(response => response.json())
        .then(data => {
            this.setState({
                CalenderData: data.calender_data,
                dateFormat: data.dateFormat,
                priorToggle: data.priorToggle,
                priorTime: data.priorTime,
                staffs: data.staffs,
                services: data.services,
                customers: data.customers,
                defaultAppointmentStatus: data.defaultAppointmentStatus,
                isStaff: data.is_staff
            });
        })
        .catch((error) => {
            console.error('Error fetching data:', error);
        })
    };

    CalendarEvents = () => {
        let events = this.state.CalenderData.map(item => {
            let Color;
            let textColor;
            switch (item.appointment_status) {
                case "Pending":
                    Color = "#FFC107";
                    textColor = "#000000";
                    break;
                case "Confirmed":
                    Color = "#4CAF50";
                    textColor = "#FFFFFF";
                    break;
                case "Delayed":
                    Color = "#FF9800";
                    textColor = "#FFFFFF";
                    break;
                case "Completed":
                    Color = "#2196F3";
                    textColor = "#FFFFFF";
                    break;
                case "On Hold":
                    Color = "#FF5722";
                    textColor = "#FFFFFF";
                    break;
                case "Cancelled":
                    Color = "#F02626";
                    textColor = "#FFFFFF";
                    break;
                default:
                    Color = "#9E9E9E";
                    textColor = "#FFFFFF";
            }
    
            return {
                title: `${item.customer_name} | ${item.appointment_duration}`,
                date: item.appointment_date,
                color: Color,
                textColor: textColor
            };
        });
        return events;
    };

    handleMaxDates = ( nowDate ) => {
        const { priorToggle, priorTime } = this.state;

        let maxDate = null;
        if ( priorToggle == "Enable" ) {
            maxDate = dayjs(nowDate).add(parseInt(priorTime), 'month').format( 'YYYY-MM-DD' );
        }

        return { end: maxDate };
    }

    render() {

        const { dateFormat, theme, title, staffs, services, customers, calendarStaffFilter, priorToggle, priorTime, defaultAppointmentStatus, isStaff } = this.state;
        const events = this.CalendarEvents();

        

        return (
            <ThemeProvider theme={theme}>
                <Stack spacing={2} mt={2} mb={2} direction="row" alignItems="center">
                    <SortIcon fontSize="large" />
                    <Typography variant="h2">{title}</Typography>
                </Stack>

                <Divider variant="middle" />

                 <Box component="section">
                    { ! isStaff && (
                        <Box
                            component="div"
                            sx={{
                                ml: '1em',
                                mr: '2em',
                                mb: '2em',
                                mt: '2em',
                                backgroundColor: '#FFFFFF',
                                p: '23px',
                                borderRadius: '5px',
                            }}
                        >
                            <Grid container spacing={3} alignItems="center" justifyContent="flex-end">
                                <Grid item md={2}>
                                    <FormControl sx={{ minWidth: '100%', backgroundColor: '#ffffff' }}>
                                        <Select
                                            name="calendarStaffFilter"
                                            value={calendarStaffFilter}
                                            onChange={this.handleStaffChange}
                                        >
                                            <MenuItem key="none" value="none">
                                                {__('All Staffs', 'bookify')}
                                            </MenuItem>
                                            {staffs.map((value) => (
                                                <MenuItem key={value.id} value={value.id}>
                                                    {value.staff_name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item md={1.65} sx={{display:"flex", justifyContent:"flex-end"}}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<PostAddIcon />}
                                        sx={{
                                            borderColor: '#ff6c22',
                                            backgroundColor: '#ff6c22',
                                            color: '#ffffff',
                                            textTransform: 'capitalize',
                                            padding: "14px 21px",
                                            '&:hover': {
                                                color: '#036666',
                                            },
                                        }}
                                        onClick={() => openDialog(this.state, this.setState.bind(this), 'AddAppointmentDialog')}
                                    >
                                        {__('Add Appointment', 'bookify')}
                                    </Button>
                                    <AddAppointment
                                        open={this.state.AddAppointmentDialog}
                                        onClose={() => closeDialog(this.state, this.setState.bind(this), 'AddAppointmentDialog')}
                                        fetchCalendarData={this.fetchCalendarData}
                                        dateFormat={dateFormat}
                                        priorToggle={priorToggle}
                                        priorTime={priorTime}
                                        services={services}
                                        customers={customers}
                                        defaultStatus={defaultAppointmentStatus}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                    <Box
                        component="section"
                        sx={{
                            ml: '1em',
                            mr: '2em',
                            mb: '2em',
                            mt: '2em',
                            backgroundColor: '#FFFFFF',
                            p: '23px',
                            borderRadius: '5px',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', 
                        }}
                    >
                        <Box component="div" sx={{display:"flex", justifyContent:"flex-end", mb:"1rem"}}>
                            <Box component="span" sx={{pr:"1rem", pl:"1rem", display:"flex", alignItems:"center"}}>
                                <Box
                                    sx={{
                                        width: 15,
                                        height: 15,
                                        borderRadius: 50,
                                        bgcolor: "#FFC107",
                                        mr:"5px"
                                    }}
                                />
                                <Typography variant="subtitle1">{__('Pending', 'bookify')}</Typography>
                            </Box>
                            <Box component="span" sx={{pr:"1rem", pl:"1rem", display:"flex", alignItems:"center"}}>
                                <Box
                                    sx={{
                                        width: 15,
                                        height: 15,
                                        borderRadius: 50,
                                        bgcolor: "#4CAF50",
                                        mr:"5px"
                                    }}
                                />
                                <Typography variant="subtitle1">{__('Confirmed', 'bookify')}</Typography>
                            </Box>
                            <Box component="span" sx={{pr:"1rem", pl:"1rem", display:"flex", alignItems:"center"}}>
                                <Box
                                    sx={{
                                        width: 15,
                                        height: 15,
                                        borderRadius: 50,
                                        bgcolor: "#FF9800",
                                        mr:"5px"
                                    }}
                                />
                                <Typography variant="subtitle1">{__('Delayed', 'bookify')}</Typography>
                            </Box>
                            <Box component="span" sx={{pr:"1rem", pl:"1rem", display:"flex", alignItems:"center"}}>
                                <Box
                                    sx={{
                                        width: 15,
                                        height: 15,
                                        borderRadius: 50,
                                        bgcolor: "#2196F3",
                                        mr:"5px"
                                    }}
                                />
                                <Typography variant="subtitle1">{__('Completed', 'bookify')}</Typography>
                            </Box>
                            <Box component="span" sx={{pr:"1rem", pl:"1rem", display:"flex", alignItems:"center"}}>
                                <Box
                                    sx={{
                                        width: 15,
                                        height: 15,
                                        borderRadius: 50,
                                        bgcolor: "#FF5722",
                                        mr:"5px"
                                    }}
                                />
                                <Typography variant="subtitle1">{__('On Hold', 'bookify')}</Typography>
                            </Box>
                            <Box component="span" sx={{pr:"1rem", pl:"1rem", display:"flex", alignItems:"center"}}>
                                <Box
                                    sx={{
                                        width: 15,
                                        height: 15,
                                        borderRadius: 50,
                                        bgcolor: "#F02626",
                                        mr:"5px"
                                    }}
                                />
                                <Typography variant="subtitle1">{__('Cancelled', 'bookify')}</Typography>
                            </Box>
                        </Box>
                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            validRange={(nowDate) => this.handleMaxDates(nowDate)}
                            events={events}
                            headerToolbar={{
                                left: 'dayGridMonth,dayGridWeek,dayGridDay',
                                center: 'prev,title,next',
                                right: 'today',
                            }}
                            eventDidMount={(info) => {
                                info.el.setAttribute('title', info.event.title);
                            }}
                        />
                    </Box>
                </Box>
            </ThemeProvider>
        );
    }
}

export default Calendar;
