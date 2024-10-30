import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
    Stack, Typography, Divider, Box, FormControl,
    TextField, InputAdornment, Button, TableContainer, Paper,
    Table, TableHead, TableRow, TableCell, Checkbox, TableSortLabel,
    TableBody, TablePagination, Select, MenuItem, Avatar, Grid
} from '@mui/material';
import SortIcon from '@mui/icons-material/Sort';
import SearchIcon from '@mui/icons-material/Search';
import TaskIcon from '@mui/icons-material/Task';
import PaymentFilters from './PaymentFilters';
import PaymentTable from './PaymentTable';
import { 
    handleRequestSort, downloadCSV, handleChangePage, handleChangeRowsPerPage 
} from '../../functions';

class Payment extends Component {
    state = {
        headCells: [
            { id: 'payment_id', label: 'ID', priority: 0 },
            { id: 'appointment_date', label: 'Appointment Date', priority: 5 },
            { id: 'appointment_customer', label: 'Customer', priority: 10 },
            { id: 'appointment_staff', label: 'Staff', priority: 15 },
            { id: 'appointment_service', label: 'Service', priority: 20 },
            { id: 'method', label: 'Payment Method', priority: 25 },
            { id: 'total', label: 'Total Amount', priority: 30 },
            { id: 'paid', label: 'Paid Amount', priority: 35 },
            { id: 'due', label: 'Due Amount', priority: 40 },
            { id: 'status', label: 'Status', priority: 45 },
            { id: 'action', label: 'Action', priority: 50 },
        ],
        allPaymentData: [],
        TableData: [],
        searchText: '',
        staffs: [],
        services: [],
        customers: [],
        dateFormat: '',
        totalCount: 0,
        page: 0,
        pageSize: 10,
        order: 'desc',
        orderBy: 'id',
        filterDate: null,
        filterStaff: 'none',
        filterService: 'none',
        filterCustomer: 'none',
        filterStatus: 'none',
        dataLoading: true,
        StatusOptions: [
            'Paid', 
            'Unpaid', 
            'Pending', 
            'Cancelled'
        ],
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
        this.fetchPaymentData();

        const title = window.wp.hooks.applyFilters('bookify_payment_title', 'Payments');
        this.setState({ title });
    }

    fetchPaymentData = (page = 1, pageSize = 10, searchDate= '', searchStaff= '', searchService='', searchCustomer='', searchStatus='') => {
        const { searchText } = this.state;
        const params = {
            search: searchText.trim(),
            date: searchDate,
            staff: searchStaff,
            service: searchService,
            customer: searchCustomer,
            status: searchStatus
        };

        const queryString = Object.entries(params)
            .filter(([key, value]) => value && value != 'none')
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');

        this.setState({ dataLoading: true });


        fetch(`/wp-json/bookify/v1/payment?page=${page}&pageSize=${pageSize}&${queryString}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': wpApiSettings.nonce
            }
        })
        .then(response => response.json())
        .then(data => {
            this.setState({
            allPaymentData: data.data,
            TableData: data.data,
            totalCount: data.total,
            staffs: data.staffs,
            customers: data.customers,
            services: data.services,
            currency: data.currency,
            dateFormat: data.dateFormat
            });
        })
        .catch((error) => {
            console.error('Error fetching data:', error);
        })
        .finally(() => {
            this.setState({ dataLoading: false });
        });
    };

    handleSearchData = (event) => {
        const searchText = event.target.value.toLowerCase();
        const { allPaymentData } = this.state;
    
        let filteredData;
    
        if (searchText == '') {
            filteredData = allPaymentData;
        } else {
            filteredData = allPaymentData.filter(payment => {
                return (
                    payment.appointment_date.toLowerCase().includes(searchText) ||
                    payment.appointment_customer_name.toLowerCase().includes(searchText) ||
                    payment.appointment_customer_email.toLowerCase().includes(searchText) ||
                    payment.appointment_staff_name.toLowerCase().includes(searchText) ||
                    payment.appointment_staff_email.toLowerCase().includes(searchText) ||
                    payment.service_name.toLowerCase().includes(searchText) ||
                    payment.method.toLowerCase().includes(searchText) ||
                    payment.total.toLowerCase().includes(searchText) ||
                    payment.paid.toLowerCase().includes(searchText) ||
                    payment.due.toLowerCase().includes(searchText) ||
                    payment.status.toLowerCase().includes(searchText)
                );
            });
        }
        
        this.setState({ 
            searchText: event.target.value, 
            TableData: filteredData 
        });
    };

    render() {
        const {
            headCells, TableData, totalCount, title, theme, order, orderBy, pageSize, page, staffs, services, customers, filterDate, 
            filterStaff, filterService, filterCustomer, filterStatus, currency, dateFormat, dataLoading } = this.state;

        return (
            <ThemeProvider theme={theme}>
                <Stack spacing={2} mt={2} mb={2} direction="row" alignItems="center">
                    <SortIcon fontSize="large" />
                <   Typography variant="h2">{title}</Typography>
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
                                md={10.5} 
                                sx={{
                                    display: "grid",
                                    justifyItems: "stretch",
                                    alignItems: "center"
                                }}
                            >
                                <FormControl>
                                    <TextField
                                        variant="outlined"
                                        placeholder="Search payments"
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
                                    onClick={() => downloadCSV(this.state, "Bookify Payments")}
                                    >
                                        {__('Export to CSV', 'bookify')}
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>

                    <Box component="div" sx={{ ml: '1em', mr: '2em', mb: '3em', mt: '3em' }}>
                        <PaymentFilters
                            state={this.state}
                            setState={this.setState.bind(this)}
                            filterDate={filterDate}
                            filterStaff={filterStaff}
                            filterService={filterService}
                            filterCustomer={filterCustomer}
                            filterStatus={filterStatus}
                            staffs={staffs}
                            services={services}
                            customers={customers}
                            fetchPaymentData={this.fetchPaymentData}
                        />
                    </Box>

                    <Box component="div" sx={{ ml: '1em', mr: '2em', mb: '2em', mt: '2em' }}>
                        <PaymentTable
                            state={this.state}
                            setState={this.setState.bind(this)}
                            headCells={headCells}
                            fetchPaymentData={this.fetchPaymentData}
                            TableData={TableData}
                            totalCount={totalCount}
                            pageSize={pageSize}
                            page={page}
                            orderBy={orderBy}
                            order={order}
                            currency={currency}
                            dateFormat={dateFormat}
                            dataLoading={dataLoading}
                        />
                    </Box>
                </Box>
            </ThemeProvider>
        );
    }
}

export default Payment;

