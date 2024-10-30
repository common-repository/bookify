import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import {
    Paper, Typography, TableContainer, Table, TableHead, 
    TableRow, TableCell, TableSortLabel, TableBody,
    TablePagination, Avatar, IconButton, Box, Button
} from '@mui/material';
import currencies from './currencies.json';
import { SnackbarNotice, ConfirmationDialog } from './functions';
import { 
    handleRequestSort, handleChangePage, handleChangeRowsPerPage 
} from './functions';

class AppointmentApp extends Component {

    state = {
        headCells: [
            { id: 'appointment_id', label: 'ID', priority: 0 },
            { id: 'appointment_date', label: 'Appointment Date', priority: 5 },
            { id: 'appointment_staff', label: 'Staff', priority: 15 },
            { id: 'appointment_service', label: 'Service', priority: 20 },
            { id: 'appointment_price', label: 'Payment', priority: 25 },
            { id: 'appointment_duration', label: 'Duration', priority: 30 },
            { id: 'appointment_created', label: 'Created At', priority: 35 },
            { id: 'appointment_status', label: 'Status', priority: 40 },
        ],
        title: 'Appointment(s)',
        currency: 'USD',
        TableData: [],
        orderBy: 'id',
        order: 'desc',
        totalCount: 0,
        pageSize: 10,
        page: 0,
        snackbarOpen: false,
        snackbarMessage: '',
        snackbarType: 'success',
        confirmationDialogOpen: false,
        confirmationLoading: false,
        AppointmentStatus: null,
    }

    componentDidMount() {

        this.fetchAppointmentData();

        const title = window.wp.hooks.applyFilters('bookify_frontend_appointment_title', 'Appointment(s)');
        this.setState({ title });
    }

    fetchAppointmentData = (page = 1, pageSize = 10) => {
        fetch(`/wp-json/bookify/frontend/v1/get-appointments?page=${page}&pageSize=${pageSize}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': wpbAptApp.nonce
            }
        })
        .then((response) => response.json())
        .then((data) => {
            this.setState({
                TableData: data.data,
                totalCount: data.total,
                currency: data.currency,
            });
        })
        .catch(error => {
            console.error('Error:', error);
        })
    };

    handleCancelAppointment = ( event, appointmentId ) => {
        this.setState({ confirmationDialogOpen: true, AppointmentStatus: appointmentId });
    }

    confirmationAppointmentDelete = () => {
        const { AppointmentStatus } = this.state;
        this.setState({ confirmationLoading: true });

        const dataToSend = new FormData();
        dataToSend.append('appointment_id', AppointmentStatus);

        fetch(`/wp-json/bookify/frontend/v1/appointment-status`, {
            method: 'POST',
            headers: {
                'X-WP-Nonce': wpbAptApp.nonce
            },
            body: dataToSend
        })
        .then(response => response.json())
        .then((response) => {
            if ( response.success ) {
                this.setState({ 
                    confirmationDialogOpen: false,
                    confirmationLoading: false,
                    AppointmentStatus: null,
                    snackbarOpen: true,
                    snackbarMessage: response.message,
                    snackbarType: 'success',
                });
                this.fetchAppointmentData();
            } else {
                this.setState({ 
                    confirmationDialogOpen: false,
                    confirmationLoading: false,
                    AppointmentStatus: null,
                    snackbarOpen: true,
                    snackbarMessage: response.message,
                    snackbarType: 'error',
                });
            }
        })
        .catch(error => {
            console.error('Error deleting category:', error);
            this.setState({ confirmationLoading: false });
        })
    }

    render() {

        const { headCells, title, TableData, currency, orderBy, order, totalCount, pageSize, page, snackbarOpen, snackbarMessage, snackbarType, confirmationDialogOpen, confirmationLoading } = this.state;
        const matchedCurrency = Object.values(currencies).find(eachCurrency => eachCurrency.code === currency);

        return(
            <>
                <Paper sx={{ pt:'1em' }}>
                    <Typography sx={{ pl: '1rem', pb:'1rem' }} variant="h6" component="div">
                        {title}
                    </Typography>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    {headCells.sort((a, b) => a.priority - b.priority).map((headCell) => (
                                        <TableCell
                                            key={headCell.id}
                                            align="center"
                                            sortDirection={orderBy === headCell.id ? order : false}
                                        >
                                            <TableSortLabel
                                                active={orderBy === headCell.id}
                                                direction={orderBy === headCell.id ? order : 'desc'}
                                                onClick={(event) => handleRequestSort(this.state, this.setState.bind(this), headCell.id)}
                                            >
                                                {headCell.label}
                                            </TableSortLabel>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {TableData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={headCells.length} align="center">
                                            {__('No records to display', 'bookify')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    TableData.map((row) => {
                                        return (
                                            <TableRow hover key={row.appointment_id} >
                                                {headCells.sort((a, b) => a.priority - b.priority).map((headCell) => (
                                                    <TableCell key={headCell.id} align="center">
                                                        {headCell.id === 'appointment_date' ? (
                                                            <Typography 
                                                                sx={{
                                                                    display: "flex",
                                                                    flexDirection: "column",
                                                                    color:"#036666",
                                                                    fontSize:"0.875rem"
                                                                }}
                                                            >
                                                                {row[headCell.id]}
                                                            </Typography>
                                                        ) : headCell.id === 'appointment_staff' ? (
                                                            <Box sx={{ display: "flex" }}>
                                                                <Typography 
                                                                    sx={{
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        flexDirection: "column",
                                                                        color: "#036666",
                                                                        fontSize: "0.875rem"
                                                                    }}
                                                                >
                                                                    {row['appointment_staff_name']}
                                                                    <Typography 
                                                                        variant="caption"
                                                                        sx={{
                                                                            color: "#18120F",
                                                                            fontSize: "0.875rem"
                                                                        }}
                                                                    >
                                                                        {row['appointment_staff_email']}
                                                                    </Typography>
                                                                </Typography>
                                                            </Box>
                                                        ) : headCell.id === 'appointment_service' ? (
                                                            <Typography 
                                                                sx={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    flexDirection: "column",
                                                                    fontSize: "0.875rem"
                                                                }}
                                                            >
                                                                {row['service_name'] ? row['service_name'] : ' - '}
                                                            </Typography>
                                                        ) : headCell.id === 'appointment_price' ? (
                                                            <Box component={'span'}>
                                                                {matchedCurrency ? `${matchedCurrency.symbol} ${row[headCell.id]}` : row[headCell.id]}
                                                            </Box>
                                                        ) : headCell.id === 'appointment_status' ? (
                                                            row[headCell.id] == 'Pending' || row[headCell.id] == 'On Hold' ? (
                                                                <Button variant="contained" onClick={(event) => this.handleCancelAppointment(event, row.appointment_id)}
                                                                    sx={{
                                                                        textTransform: 'capitalize',
                                                                        '&:hover': {
                                                                            color:'#FFFFFF',
                                                                        }
                                                                    }}
                                                                >
                                                                    {__('Cancel Appointment', 'bookify')}
                                                                </Button>
                                                            ) : (
                                                                row[headCell.id]
                                                            )
                                                        ) : (
                                                            row[headCell.id]
                                                        )}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        component="div"
                        count={totalCount}
                        rowsPerPage={pageSize}
                        page={page}
                        onPageChange={(event, newPage) => handleChangePage(this.state, this.setState.bind(this), this.fetchAppointmentData, newPage)}
                        onRowsPerPageChange={(event) => handleChangeRowsPerPage(this.state, this.setState.bind(this), this.fetchAppointmentData, event)}
                    />
                </Paper>
                <SnackbarNotice
                    state={this.state}
                    setState={this.setState.bind(this)}
                    open={snackbarOpen}
                    message={snackbarMessage}
                    type={snackbarType}
                />
                <ConfirmationDialog
                    open={confirmationDialogOpen}
                    onClose={() => this.setState({ confirmationDialogOpen: false, AppointmentStatus: null })}
                    onConfirm={this.confirmationAppointmentDelete}
                    loading={confirmationLoading}
                />
            </>
        )
    }
}

export default AppointmentApp;