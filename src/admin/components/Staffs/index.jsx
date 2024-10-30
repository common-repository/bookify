import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
    Stack, Typography, Divider, Box, FormControl,
    TextField, InputAdornment, Button,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import SortIcon from '@mui/icons-material/Sort';
import SearchIcon from '@mui/icons-material/Search';
import TaskIcon from '@mui/icons-material/Task';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AddStaff from './AddStaff';
import StaffTable from './StaffTable';
import { 
    downloadCSV, openDialog, closeDialog
} from '../../functions';

class Staffs extends Component {
    state = {
        headCells: [
            { id: 'id', label: 'ID', priority: 0 },
            { id: 'staff_name', label: 'Staff Name', priority: 5 },
            { id: 'staff_phone', label: 'Phone', priority: 10 },
            { id: 'staff_email', label: 'Email', priority: 15 },
            { id: 'service_assigned', label: 'Services', priority: 20 },
            { id: 'action', label: 'Action', priority: 25 },
        ],
        services: [],
        allStaffData: [],
        TableData: [],
        searchText: '',
        dateFormat: '',
        timeFormat: '',
        slotDuration: '30',
        slotInterval: '15',
        totalCount: 0,
        page: 0,
        pageSize: 10,
        order: 'desc',
        orderBy: 'id',
        currency: 'USD',
        editDialogHandle: null,
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
        const title = window.wp.hooks.applyFilters('bookify_staff_title', 'Staffs');
        this.setState({ title });

        this.fetchStaffData();
    }
    
    fetchStaffData = (page = 1, pageSize = 10) => {
        const { searchText } = this.state;
        const searchQuery = searchText ? `&search=${encodeURIComponent(searchText)}` : '';
        this.setState({ dataLoading: true });

        fetch(`/wp-json/bookify/v1/staffs?page=${page}&pageSize=${pageSize}${searchQuery}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': wpApiSettings.nonce
            }
        })
        .then((response) => response.json())
        .then((data) => {
            this.setState({
                allStaffData: data.data,
                TableData: data.data,
                totalCount: data.total,
                dateFormat: data.dateFormat,
                timeFormat: data.timeFormat,
                services: data.services,
                slotDuration: data.duration,
                slotInterval: data.interval,
                currency: data.currency,
                isStaff: data.is_staff
            });
        })
        .catch((error) => {
            console.error('Error fetching data:', error);
        })
        .finally(() => {
            this.setState({ dataLoading: false });
        });
    };

    fetchStaffById = (staffId) => {
        return this.state.TableData.find(staff => staff.id === staffId);
    };

    handleSearchData = (event) => {
        const searchText = event.target.value.toLowerCase();
        const { allStaffData } = this.state;
    
        let filteredData;
    
        if (searchText == '') {
            filteredData = allStaffData;
        } else {
            filteredData = allStaffData.filter(staff => {
                return (
                    staff.staff_name.toLowerCase().includes(searchText) ||
                    staff.staff_phone.toLowerCase().includes(searchText) ||
                    staff.staff_email.toLowerCase().includes(searchText) ||
                    staff.service_assigned.toLowerCase().includes(searchText)
                );
            });
        }
        
        this.setState({ 
            searchText: event.target.value, 
            TableData: filteredData 
        });
    };

    render() {
        const { headCells, TableData, services, theme, title, orderBy, order, totalCount, pageSize, page, editDialogHandle, slotDuration, slotInterval, dateFormat, timeFormat, currency, isStaff, dataLoading } = this.state;
        const staffLength = TableData.length;
        const ProLocation = window.ProLocation;

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
                                md={ ! isStaff  ? 9 : 12 } 
                                sx={{
                                    display: "grid",
                                    justifyItems: "stretch",
                                    alignItems: "center"
                                }}
                            >
                                <FormControl>
                                    <TextField
                                        variant="outlined"
                                        placeholder="Search staffs"
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
                                            onClick={() => downloadCSV(this.state, "Bookify Staffs")}
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
                                            disabled={ProLocation ? false : staffLength >= 1}
                                            sx={{
                                                borderColor: '#ff6c22',
                                                backgroundColor: '#ff6c22',
                                                color: '#ffffff',
                                                textTransform: 'capitalize',
                                                padding: "14px 21px",
                                                '&:hover': {
                                                    color: '#036666',
                                                },
                                                '&.Mui-disabled': {
                                                    backgroundColor: '#9d9d9d96',
                                                    color: '#ffffff',
                                                },
                                            }}
                                            onClick={() => openDialog(this.state, this.setState.bind(this), 'AddStaffDialog')}
                                        >
                                            {__('Add Staff', 'bookify')}
                                        </Button>
                                    </Grid>
                                </>
                            )}
                            <AddStaff
                                open={this.state.AddStaffDialog}
                                onClose={() => closeDialog(this.state, this.setState.bind(this), 'AddStaffDialog')}
                                fetchStaffById={this.fetchStaffById}
                                fetchStaffData={this.fetchStaffData}
                                dateFormat={dateFormat}
                                timeFormat={timeFormat}
                                services={services}
                                staffId={editDialogHandle}
                                slotDuration={slotDuration}
                                slotInterval={slotInterval}
                                currency={currency}
                            />
                        </Grid>
                    </Box>
                    <Box component="div" sx={{ ml: '1em', mr: '2em', mb: '2em', mt: '2em' }}>
                        <StaffTable
                            state={this.state}
                            setState={this.setState.bind(this)}
                            headCells={headCells}
                            fetchStaffData={this.fetchStaffData}
                            TableData={TableData}
                            totalCount={totalCount}
                            pageSize={pageSize}
                            page={page}
                            orderBy={orderBy}
                            order={order}
                            isStaff={isStaff}
                            dataLoading={dataLoading}
                        />
                    </Box>
                </Box>
            </ThemeProvider>
        );
    }
}

export default Staffs;
