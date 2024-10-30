import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
    Stack, Typography, Divider, Box, FormControl,
    TextField, InputAdornment, Button
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import SortIcon from '@mui/icons-material/Sort';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import AddNotification from './AddNotification';
import NotificationTable from './NotificationTable';
import { 
    openDialog, closeDialog
} from '../../functions';

class Notification extends Component {
    state = {
        allNotificationData: [],
        TableData: [],
        searchText: '',
        totalCount: 0,
        page: 0,
        pageSize: 10,
        order: 'desc',
        orderBy: 'id',
        dataLoading: false,
        editDialogHandle: null,
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
        this.fetchNotificationData();
        
        const title = window.wp.hooks.applyFilters('bookify_notification_title', 'Notification');
        this.setState({ title });
    }

    fetchNotificationById = (notificationId) => {
        return this.state.TableData.find(notification => notification.id === notificationId);
    };

    fetchNotificationData = (page = 1, pageSize = 10) => {
        const { searchText } = this.state;
        const searchQuery = searchText ? `&search=${encodeURIComponent(searchText)}` : '';
        this.setState({ dataLoading: true });

        fetch(`/wp-json/bookify/v1/notification?page=${page}&pageSize=${pageSize}${searchQuery}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': wpApiSettings.nonce
            }
        })
        .then((response) => response.json())
        .then((data) => {
            this.setState({
                allNotificationData: data.notificationData,
                TableData: data.notificationData,
                totalCount: data.total,
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
        const { allNotificationData } = this.state;
    
        let filteredData;
    
        if (searchText == '') {
            filteredData = allNotificationData;
        } else {
            filteredData = allNotificationData.filter(notification => {
                return (
                    notification.notification_name.toLowerCase().includes(searchText) ||
                    notification.notification_event.toLowerCase().includes(searchText)
                );
            });
        }
        
        this.setState({ 
            searchText: event.target.value, 
            TableData: filteredData 
        });
    };

    render() {
        const { TableData, theme, title, orderBy, order, totalCount, pageSize, page, editDialogHandle, dataLoading } = this.state;

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
                                md={10.25} 
                                sx={{
                                    display: "grid",
                                    justifyItems: "stretch",
                                    alignItems: "center"
                                }}
                            >
                                <FormControl>
                                    <TextField
                                        variant="outlined"
                                        placeholder="Search notifications"
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
                                md={1.75} 
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
                                    onClick={() => openDialog(this.state, this.setState.bind(this), 'AddNotificationDialog')}
                                >
                                    {__('Add Notification', 'bookify')}
                                </Button>
                                <AddNotification
                                    open={this.state.AddNotificationDialog}
                                    onClose={() => closeDialog(this.state, this.setState.bind(this), 'AddNotificationDialog')}
                                    fetchNotificationById={this.fetchNotificationById}
                                    fetchNotificationData={this.fetchNotificationData}
                                    notificationId={editDialogHandle}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                    <Box component="div" sx={{ ml: '1em', mr: '2em', mb: '2em', mt: '2em' }}>
                        <NotificationTable
                            state={this.state}
                            setState={this.setState.bind(this)}
                            fetchNotificationData={this.fetchNotificationData}
                            TableData={TableData}
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

export default Notification;
