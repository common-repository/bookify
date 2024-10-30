import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { 
    Grid, Paper, Typography, Stack, Divider, Box,
    Chip, FormControl, Select, MenuItem
} from '@mui/material';
import SortIcon from '@mui/icons-material/Sort';
import ReactApexChart from 'react-apexcharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TotalRevenue from './TotalRevenue';
import ServiceWiseEarning from './ServiceWiseEarning';
import StaffWiseEarning from './StaffWiseEarning';
import StaffWiseTotalAppointments from './StaffWiseTotalAppointments';
import CustomerStatus from './CustomerStatus';
import CustomerSection from './CustomerSection';
import ApprovedAppointment from './ApprovedAppointment';
import currencies from '../../currencies.json';

class Dashboard extends Component {

    state = {
        staffWiseEarning: [],
        staffWiseAppointments: [],
        customerStatuses: [],
        revenueSection: [],
        customerSection: [],
        approvedAppointment: [],
        services: [],
        currency: 'USD',
        open: false,
        dataHandler: {
            "today": "Today",
            "currentweek": "Current Week",
            "currentmonth": "Current Month",
            "currentyear": "Current Year",
        },
        approveAppointmentDefault: 'today',
        theme: createTheme({
            typography: {
                h2: {
                    fontSize: '2.5em',
                    textTransform: 'capitalize',
                },
            },
        }),
    };

    componentDidMount() {
        const title = window.wp.hooks.applyFilters('dokan_dashboard_title', 'Dashboard');
        this.setState({ title });

        this.fetchDashboardData();
    }

    fetchDashboardData = () => {
        fetch('/wp-json/bookify/v1/dashboard', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': wpApiSettings.nonce
            }
        })
        .then(response => response.json())
        .then(data => {
            this.setState({ 
                services: data.services,
                currency: data.currency,
                staffWiseEarning: data.staff_earning_chart,
                staffWiseAppointments: data.staff_total_appointment,
                customerStatuses: data.customer_status,
                revenueSection: data.revenue_section,
                customerSection: data.customer_section,
                approvedAppointment: data.approved_appointment
            });
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        })
    }

    render() {

        const { theme, title, dataHandler, approvedAppointment, services, staffWiseEarning, staffWiseAppointments, customerStatuses, revenueSection, customerSection, currency } = this.state;
        const matchedCurrency = Object.values(currencies).find(eachCurrency => eachCurrency.code === currency);

        return (

            <ThemeProvider theme={theme}>
                <Stack spacing={2} mt={2} mb={2} direction="row" alignItems="center">
                    <SortIcon fontSize="large" />
                    <Typography variant="h2">{title}</Typography>
                </Stack>

                <Divider variant="middle" />

                <Box component="section">
                    <Box component="div"
                        sx={{
                            ml: '1em',
                            mr: '2em',
                            mb: '2em',
                            mt: '2em',
                        }}
                    >
                        <Grid container spacing={5}>
                            <Grid item md={4}>
                                <TotalRevenue
                                    dataHandler={dataHandler}
                                    revenueSection={revenueSection}
                                    matchedCurrency={matchedCurrency}
                                />
                            </Grid>
                            <Grid item md={4}>
                                <CustomerSection
                                    dataHandler={dataHandler}
                                    customerSection={customerSection}
                                />
                            </Grid>
                            <Grid item md={4}>
                                <ApprovedAppointment
                                    dataHandler={dataHandler}
                                    approvedAppointment={approvedAppointment}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                    <Box component="div"
                        sx={{
                            ml: '1em',
                            mr: '2em',
                            mb: '2em',
                            mt: '2em',
                        }}
                    >
                        <Grid container spacing={5} >
                            <Grid item md={8}>
                                <StaffWiseTotalAppointments
                                    staffWiseAppointmentsChart={staffWiseAppointments}
                                />
                            </Grid>
                            <Grid item md={4}>
                                <ServiceWiseEarning
                                    services={services}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                    <Box component="div"
                        sx={{
                            ml: '1em',
                            mr: '2em',
                            mb: '2em',
                            mt: '2em',
                        }}
                    >
                        <Grid container spacing={5} >
                            <Grid item md={8}>
                                <StaffWiseEarning
                                    staffWiseEarningChart={staffWiseEarning}
                                />
                            </Grid>
                            <Grid item md={4}>
                                <CustomerStatus
                                    customerStatuses={customerStatuses}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </Box>

            </ThemeProvider>
            
        );
    }
}

export default Dashboard;
