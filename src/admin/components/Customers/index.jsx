import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
    Stack, Typography, Divider, Box, FormControl,
    TextField, InputAdornment, Button, Grid
} from '@mui/material';
import SortIcon from '@mui/icons-material/Sort';
import SearchIcon from '@mui/icons-material/Search';
import TaskIcon from '@mui/icons-material/Task';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AddCustomer from './AddCustomer';
import CustomerTable from './CustomerTable';
import { 
    downloadCSV, openDialog, closeDialog
} from '../../functions';

class Customers extends Component {
    state = {
        headCells: [
            { id: 'id', label: 'ID', priority: 0 },
            { id: 'customer_name', label: 'Customer Name', priority: 5 },
            { id: 'customer_phone', label: 'Phone', priority: 10 },
            { id: 'customer_email', label: 'Email', priority: 15 },
            { id: 'total_appointments', label: 'Total Appointments', priority: 20 },
            { id: 'last_appointment', label: 'Last Appointment', priority: 25 },
            { id: 'action', label: 'Action', priority: 30 },
        ],
        allCustomerData: [],
        TableData: [],
        searchText: '',
        totalCount: 0,
        page: 0,
        pageSize: 10,
        order: 'desc',
        orderBy: 'id',
        editDialogHandle: null,
        dateFormat: '',
        dataLoading: true,
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
        const title = window.wp.hooks.applyFilters('bookify_customer_title', 'Customers');
        this.setState({ title });

        this.fetchCustomerData();
    }

    fetchCustomerData = (page = 1, pageSize = 10) => {
        const { searchText } = this.state;
        const searchQuery = searchText ? `&search=${encodeURIComponent(searchText)}` : '';
        this.setState({ dataLoading: true });

        fetch(`/wp-json/bookify/v1/customers?page=${page}&pageSize=${pageSize}${searchQuery}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': wpApiSettings.nonce
            }
        })
        .then((response) => response.json())
        .then((data) => {
            this.setState({
                allCustomerData: data.data,
                TableData: data.data,
                totalCount: data.total,
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

    fetchCustomerById = (customerId) => {
        return this.state.TableData.find(customer => customer.id === customerId);
    };

    handleSearchData = (event) => {
        const searchText = event.target.value.toLowerCase();
        const { allCustomerData } = this.state;
    
        let filteredData;
    
        if (searchText == '') {
            filteredData = allCustomerData;
        } else {
            filteredData = allCustomerData.filter(customer => {
                return (
                    customer.customer_name.toLowerCase().includes(searchText) ||
                    customer.customer_email.toLowerCase().includes(searchText) ||
                    customer.customer_phone.toLowerCase().includes(searchText) ||
                    customer.total_appointments.toString().toLowerCase().includes(searchText) ||
                    customer.last_appointment.toLowerCase().includes(searchText)
                );
            });
        }
        
        this.setState({ 
            searchText: event.target.value, 
            TableData: filteredData 
        });
    };

    render() {
        const { headCells, TableData, theme, title, orderBy, order, totalCount, pageSize, page, editDialogHandle, dateFormat, dataLoading } = this.state;

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
                                md={9} 
                                sx={{
                                    display: "grid",
                                    justifyItems: "stretch",
                                    alignItems: "center"
                                }}
                            >
                                <FormControl>
                                    <TextField
                                        variant="outlined"
                                        placeholder="Search customers"
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
                                    onClick={() => downloadCSV(this.state, "Bookify Customers")}
                                    >
                                        {__('Export to CSV', 'bookify')}
                                </Button>
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
                                    startIcon={<PersonAddIcon />}
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
                                    onClick={() => openDialog(this.state, this.setState.bind(this), 'AddCustomerDialog')}
                                >
                                    {__('Add Customer', 'bookify')}
                                </Button>
                                <AddCustomer
                                    open={this.state.AddCustomerDialog}
                                    onClose={() => closeDialog(this.state, this.setState.bind(this), 'AddCustomerDialog')}
                                    fetchCustomerById={this.fetchCustomerById}
                                    fetchCustomerData={this.fetchCustomerData}
                                    customerId={editDialogHandle}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                    <Box component="div" sx={{ ml: '1em', mr: '2em', mb: '2em', mt: '2em' }}>
                        <CustomerTable
                            state={this.state}
                            setState={this.setState.bind(this)}
                            headCells={headCells}
                            fetchCustomerData={this.fetchCustomerData}
                            TableData={TableData}
                            dateFormat={dateFormat}
                            totalCount={totalCount}
                            pageSize={pageSize}
                            page={page}
                            orderBy={orderBy}
                            order={order}
                            dataLoading={dataLoading}
                        />
                    </Box>
                </Box>
            </ThemeProvider>
        );
    }
}

export default Customers;
