import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
    Stack, Typography, Divider, Box, FormControl, TextField,
    InputAdornment, Button, Grid
} from '@mui/material';
import SortIcon from '@mui/icons-material/Sort';
import SearchIcon from '@mui/icons-material/Search';
import TaskIcon from '@mui/icons-material/Task';
import PostAddIcon from '@mui/icons-material/PostAdd';
import { 
    downloadCSV, openDialog, closeDialog
} from '../../functions';
import AppointmentTable from './AppointmentTable';
import AddAppointment from './AddAppointment';

class Appointments extends Component {
    state = {
        headCells: [
            { id: 'appointment_id', label: 'ID', priority: 0 },
            { id: 'appointment_date', label: 'Appointment Date', priority: 5 },
            { id: 'appointment_customer', label: 'Customer', priority: 10 },
            { id: 'appointment_staff', label: 'Staff', priority: 15 },
            { id: 'appointment_service', label: 'Service', priority: 20 },
            { id: 'appointment_price', label: 'Payment', priority: 25 },
            { id: 'appointment_duration', label: 'Duration', priority: 30 },
            { id: 'appointment_created', label: 'Created At', priority: 35 },
            { id: 'appointment_status', label: 'Status', priority: 40 },
            { id: 'action', label: 'Action', priority: 45 },
        ],
        allAppointmentData: [],
        TableData: [],
        selected: [],
        searchText: '',
        totalCount: 0,
        page: 0,
        pageSize: 10,
        order: 'desc',
        orderBy: 'id',
        currency: 'USD',
        locations: [],
        services: [],
        customers: [],
        DefaultAppointmentStatus: '',
        dateFormat: '',
        timeFormat: '',
        priorToggle: 'Disable',
        priorTime: '3',
        isStaff: false,
        dataLoading: true,
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

        this.fetchAppointmentData();

        const title = window.wp.hooks.applyFilters('bookify_appointment_title', 'Appointments');
        this.setState({ title });
    }

    fetchAppointmentData = (page = 1, pageSize = 10) => {
        const { searchText } = this.state;
        this.setState({ dataLoading: true });

        const searchQuery = searchText ? `&search=${encodeURIComponent(searchText)}` : '';
        fetch(`/wp-json/bookify/v1/appointments?page=${page}&pageSize=${pageSize}${searchQuery}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': wpApiSettings.nonce
            }
        })
        .then((response) => response.json())
        .then((data) => {
            this.setState({
                allAppointmentData: data.data,
                TableData: data.data,
                totalCount: data.total,
                locations: data.locations,
                services: data.services,
                customers: data.customers,
                currency: data.currency,
                DefaultAppointmentStatus: data.default_status,
                dateFormat: data.dateFormat,
                timeFormat: data.timeFormat,
                priorToggle: data.priorToggle,
                priorTime: data.priorTime,
                isStaff: data.is_staff
            });
        })
        .catch(error => {
            console.error('Error:', error);
        })
        .finally(() => {
            this.setState({ dataLoading: false });
        });
    };

    handleSearchData = (event) => {
        const searchText = event.target.value.toLowerCase();
        const { allAppointmentData } = this.state;
    
        let filteredData;
    
        if (searchText == '') {
            filteredData = allAppointmentData;
        } else {
            filteredData = allAppointmentData.filter(appointment => {
                return (
                    appointment.appointment_date.toLowerCase().includes(searchText) ||
                    appointment.appointment_customer_name.toLowerCase().includes(searchText) ||
                    appointment.appointment_customer_email.toLowerCase().includes(searchText) ||
                    appointment.appointment_staff_name.toLowerCase().includes(searchText) ||
                    appointment.appointment_staff_email.toLowerCase().includes(searchText) ||
                    appointment.service_name.toLowerCase().includes(searchText) ||
                    appointment.appointment_price.toLowerCase().includes(searchText) ||
                    appointment.appointment_duration.toLowerCase().includes(searchText) ||
                    appointment.appointment_created.toLowerCase().includes(searchText) ||
                    appointment.appointment_status.toLowerCase().includes(searchText)
                );
            });
        }
        
        this.setState({ 
            searchText: event.target.value, 
            TableData: filteredData 
        });
    };

    render() {

        const { headCells, TableData, totalCount, title, theme, order, orderBy, pageSize, page, currency, locations, services, customers, DefaultAppointmentStatus, dateFormat, timeFormat, priorToggle, priorTime, isStaff, dataLoading } = this.state;

        return (
            <ThemeProvider theme={theme}>
                <Stack spacing={2} mt={2} mb={2} direction="row" alignItems="center">
                    <SortIcon fontSize="large" />
                    <Typography variant="h2">{title}</Typography>
                </Stack>

                <Divider variant="middle" />

                <Box component="section">
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
                        <Grid container spacing={5}>
                            <Grid item 
                                md={ ! isStaff ? 8.85 : 12 } 
                                sx={{
                                    display: "grid",
                                    justifyItems: "stretch",
                                    alignItems: "center"
                                }}
                            >
                                <FormControl>
                                    <TextField
                                        variant="outlined"
                                        placeholder="Search appointments"
                                        sx={{borderColor: '#D9D9D9'}}
                                        onChange={this.handleSearchData}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start" sx={{ color: '#036666' }}>
                                                    <SearchIcon />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </FormControl>
                            </Grid>
                            { ! isStaff && (
                                <>
                                    <Grid item 
                                        md={1.5} 
                                        sx={{
                                            display: "grid",
                                            justifyItems: "stretch",
                                            alignItems: "center"
                                        }}
                                    >
                                        <Button
                                            variant="outlined"
                                            startIcon={<TaskIcon />}
                                            sx={{
                                                borderColor: '#D9D9D9',
                                                color: '#036666',
                                                textTransform: 'capitalize',
                                                height: '4em',
                                            }}
                                            onClick={() => downloadCSV(this.state, "Bookify Appointments")}
                                            >
                                                {__('Export to CSV', 'bookify')}
                                        </Button>
                                    </Grid>
                                    <Grid item 
                                        md={1.65} 
                                        sx={{
                                            display: "grid",
                                            justifyItems: "stretch",
                                            alignItems: "center"
                                        }}
                                    >
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
                                            fetchAppointmentData={this.fetchAppointmentData}
                                            DefaultAppointmentStatus={DefaultAppointmentStatus}
                                            locations={locations}
                                            services={services}
                                            customers={customers}
                                            currency={currency}
                                            dateFormat={dateFormat}
                                            priorToggle={priorToggle}
                                            priorTime={priorTime}
                                        />
                                    </Grid>
                                </>
                            )}
                        </Grid>
                    </Box>

                    <Box component="div" sx={{ ml: '1em', mr: '2em', mb: '2em', mt: '2em' }}>
                        <AppointmentTable
                            state={this.state}
                            setState={this.setState.bind(this)}
                            headCells={headCells}
                            fetchAppointmentData={this.fetchAppointmentData}
                            TableData={TableData}
                            totalCount={totalCount}
                            pageSize={pageSize}
                            page={page}
                            orderBy={orderBy}
                            order={order}
                            currency={currency}
                            locations={locations}
                            services={services}
                            customers={customers}
                            priorToggle={priorToggle}
                            priorTime={priorTime}
                            dateFormat={dateFormat}
                            timeFormat={timeFormat}
                            isStaff={isStaff}
                            dataLoading={dataLoading}
                        />
                    </Box>
                </Box>
            </ThemeProvider>
        );
    }
}

export default Appointments;