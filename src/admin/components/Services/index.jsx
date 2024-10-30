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
import PostAddIcon from '@mui/icons-material/PostAdd';
import AddService from './AddService';
import CategorySection from './CategorySection';
import ServiceTable from './ServiceTable';
import { 
    downloadCSV, openDialog, closeDialog
} from '../../functions';

class Services extends Component {
    state = {
        headCells: [
            { id: 'service_id', label: 'ID', priority: 0 },
            { id: 'service_name', label: 'Service Name', priority: 5 },
            { id: 'category_name', label: 'Service Category', priority: 10 },
            { id: 'service_price', label: 'Price', priority: 15 },
            { id: 'action', label: 'Action', priority: 20 },
        ],
        allServiceData: [],
        TableData: [],
        searchText: '',
        CategoryData: [],
        totalCount: 0,
        page: 0,
        pageSize: 10,
        orderBy: 'id',
        order: 'desc',
        serviceID: null,
        editDialogHandle: null,
        currency: 'USD',
        ServiceDataLoading: true,
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
            }
        }),
    };

    componentDidMount() {
        this.fetchServiceData();

        const title = window.wp.hooks.applyFilters('bookify_service_title', 'Services');
        this.setState({ title });
    }

    fetchServiceData = (page = 1, pageSize = 10, category = '') => {
        const { searchText } = this.state;
        const categoryQuery = category.length > 0 ? `&categories=${category.join(',')}` : '';
        const searchQuery = searchText ? `&search=${encodeURIComponent(searchText)}` : '';
        this.setState({ ServiceDataLoading: true });


        fetch(`/wp-json/bookify/v1/services?page=${page}&pageSize=${pageSize}${categoryQuery}${searchQuery}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': wpApiSettings.nonce
            }
        })
        .then((response) => response.json())
        .then((data) => {
            this.setState({
                allServiceData: data.serviceData,
                TableData: data.serviceData,
                totalCount: data.total,
                currency: data.currency,
            });
        })
        .catch((error) => {
            console.error('Error fetching data:', error);
        })
        .finally(() => {
            this.setState({ ServiceDataLoading: false });
        });
    };

    fetchServiceById = (serviceId) => {
        return this.state.TableData.find(service => service.service_id === serviceId);
    };

    handleSearchData = (event) => {
        const searchText = event.target.value.toLowerCase();
        const { allServiceData } = this.state;
    
        let filteredData;
    
        if (searchText == '') {
            filteredData = allServiceData;
        } else {
            filteredData = allServiceData.filter(service => {
                return (
                    service.service_name.toLowerCase().includes(searchText) ||
                    service.category_name.toLowerCase().includes(searchText) ||
                    service.service_price.toLowerCase().includes(searchText)
                );
            });
        }
        
        this.setState({ 
            searchText: event.target.value, 
            TableData: filteredData 
        });
    };

    render() {
        const { headCells, TableData, CategoryData, currency, theme, title, totalCount, pageSize, page, orderBy, order, editDialogHandle, ServiceDataLoading } = this.state;
        return (
            <ThemeProvider theme={theme}>
                <Stack spacing={2} mt={2} mb={2} direction="row" alignItems="center">
                    <SortIcon fontSize="large" />
                    <Typography variant="h2">{title}</Typography>
                </Stack>

                <Divider variant="middle" />

                <Grid container>
                    <Grid item container md={3} direction="column">
                        <CategorySection
                            CategoryData={CategoryData}
                            fetchServiceData={this.fetchServiceData}
                            state={this.state}
                            setState={this.setState.bind(this)}
                        />
                    </Grid>

                    <Grid item md={9}>
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
                                    <Grid item md={8} 
                                        sx={{
                                            display: "grid",
                                            justifyItems: "stretch",
                                            alignItems: "center"
                                        }}
                                    >
                                        <FormControl>
                                            <TextField
                                                variant="outlined"
                                                placeholder="Search services"
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
                                    <Grid item md={2} 
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
                                            onClick={() => downloadCSV(this.state, "Bookify Services")}
                                            >
                                                {__('Export to CSV', 'bookify')}
                                        </Button>
                                    </Grid>
                                    <Grid item 
                                        md={2} 
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
                                            onClick={() => openDialog(this.state, this.setState.bind(this), 'AddServiceDialog')}
                                        >
                                            {__('Add Service', 'bookify')}
                                        </Button>
                                        <AddService
                                            open={this.state.AddServiceDialog}
                                            onClose={() => closeDialog(this.state, this.setState.bind(this), 'AddServiceDialog')}
                                            AllCategories={CategoryData}
                                            fetchServiceById={this.fetchServiceById}
                                            fetchServiceData={this.fetchServiceData}
                                            serviceId={editDialogHandle}
                                            currency={currency}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                            <Box component="div" sx={{ ml: '1em', mr: '2em', mb: '2em', mt: '2em' }}>
                                <ServiceTable
                                    state={this.state}
                                    setState={this.setState.bind(this)}
                                    headCells={headCells}
                                    fetchServiceData={this.fetchServiceData}
                                    TableData={TableData}
                                    totalCount={totalCount}
                                    pageSize={pageSize}
                                    page={page}
                                    orderBy={orderBy}
                                    order={order}
                                    currency={currency}
                                    ServiceDataLoading={ServiceDataLoading}
                                />
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </ThemeProvider>
        );
    }
}

export default Services;