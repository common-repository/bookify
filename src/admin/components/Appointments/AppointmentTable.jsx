import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import {
    Paper, Typography, TableContainer, Table, TableHead, 
    TableRow, TableCell, TableSortLabel, TableBody,
    TablePagination, Avatar, IconButton, Box, Skeleton
} from '@mui/material';
import ModeIcon from '@mui/icons-material/Mode';
import DeleteIcon from '@mui/icons-material/Delete';
import { 
    handleRequestSort, handleChangePage, handleChangeRowsPerPage 
} from '../../functions';
import { SnackbarNotice, ConfirmationDialog } from '../../functions';
import currencies from '../../currencies.json';
import EditAppointment from './EditAppointment';
import dayjs from 'dayjs';

class AppointmentTable extends Component {
    state = {
        snackbarOpen: false,
        snackbarMessage: '',
        snackbarType: 'success',
        dialogOpen: false,
        selectedAppointment: null,
        confirmationDialogOpen: false,
        confirmationLoading: false,
        AppointmentIdToDelete: null,
    }

    handleEditDialogOpen = (appointment) => {
        this.setState({ dialogOpen: true, selectedAppointment: appointment });
    };

    handleDeleteDialogClose = () => {
        this.setState({ dialogOpen: false, selectedAppointment: null });
    };

    componentDidMount() {
        let { headCells } = this.props;

        headCells = window.wp.hooks.applyFilters('bookify_appointment_table_add_columns', headCells);
        this.props.setState({ headCells });
    }

    handleAppointmentDelete = (AppointmentId) => {
        this.setState({ confirmationDialogOpen: true, AppointmentIdToDelete: AppointmentId });
    };

    confirmationAppointmentDelete = () => {
        const { AppointmentIdToDelete } = this.state;
        this.setState({ confirmationLoading: true });

        const dataToSend = new FormData();
        dataToSend.append('appointment_id', AppointmentIdToDelete);

        fetch(`/wp-json/bookify/v1/delete-appointment`, {
            method: 'POST',
            headers: {
                'X-WP-Nonce': wpApiSettings.nonce
            },
            body: dataToSend
        })
        .then(response => response.json())
        .then(response => {
            if ( response.success ) {
                this.setState({ 
                    confirmationDialogOpen: false,
                    AppointmentIdToDelete: null,
                    confirmationLoading: false,
                    snackbarOpen: true,
                    snackbarMessage: response.message,
                    snackbarType: 'success',
                });
                this.props.fetchAppointmentData();
            } else {
                this.setState({ 
                    confirmationLoading: false,
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

        const { dialogOpen, selectedAppointment, snackbarOpen, snackbarMessage, snackbarType, confirmationDialogOpen, confirmationLoading } = this.state;
        const { state, setState, headCells, TableData, totalCount, pageSize, page, orderBy, order, currency, locations, services, customers, priorToggle, priorTime, dateFormat, timeFormat, isStaff, dataLoading } = this.props;
        const matchedCurrency = Object.values(currencies).find(eachCurrency => eachCurrency.code === currency);
        const timeFormated = timeFormat == '12-hour' ? 'hh:mm A' : 'HH:mm';

        return (
            <>
                <Paper sx={{ pt: '2em' }}>
                    <Typography sx={{ pl: '1rem' }} variant="h6" component="div">
                        {__('Details', 'bookify')}
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
                                                onClick={(event) => handleRequestSort(state, setState, headCell.id)}
                                            >
                                                {headCell.label}
                                            </TableSortLabel>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {dataLoading ? (
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <TableRow key={index}>
                                            {headCells.map((headCell) => (
                                                <TableCell key={headCell.id} align="center">
                                                    <Skeleton animation="wave" variant="text" width="80%" />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : TableData.length === 0 ? (
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
                                                                {dayjs(row[headCell.id]).format(dateFormat)}
                                                            </Typography>
                                                        ) : headCell.id === 'appointment_customer' ? (
                                                            <Box sx={{display:"flex"}}>
                                                                <Avatar 
                                                                    src={row.appointment_customer_img ? row.appointment_customer_img : undefined}
                                                                    sx={{
                                                                        fontSize:"1rem",
                                                                        width:"35px",
                                                                        height:"35px",
                                                                        mr:"10px"
                                                                    }}
                                                                />
                                                                <Typography 
                                                                    sx={{
                                                                        display: "flex",
                                                                        flexDirection: "column",
                                                                        color:"#036666",
                                                                        fontSize:"0.875rem"
                                                                    }}
                                                                >
                                                                    {row['appointment_customer_name']}
                                                                    <Typography 
                                                                        variant="caption"
                                                                        sx={{
                                                                            color:"#18120F",
                                                                            fontSize:"0.875rem"
                                                                        }}
                                                                    >
                                                                        {row['appointment_customer_email']}
                                                                    </Typography>
                                                                </Typography>
                                                            </Box>
                                                        ) : headCell.id === 'appointment_staff' ? (
                                                            <Box sx={{display:"flex"}}>
                                                                <Avatar 
                                                                    src={row.appointment_staff_img ? row.appointment_staff_img : undefined}
                                                                    sx={{
                                                                        fontSize:"1rem",
                                                                        width:"35px",
                                                                        height:"35px",
                                                                        mr:"10px"
                                                                    }}
                                                                />
                                                                <Typography 
                                                                    sx={{
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        flexDirection: "column",
                                                                        color:"#036666",
                                                                        fontSize:"0.875rem"
                                                                    }}
                                                                >
                                                                    {row['appointment_staff_name']}
                                                                    <Typography 
                                                                        variant="caption"
                                                                        sx={{
                                                                            color:"#18120F",
                                                                            fontSize:"0.875rem"
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
                                                                    fontSize:"0.875rem"
                                                                }}
                                                            >
                                                                {row['service_name'] ? row['service_name'] : ' - '}
                                                            </Typography>
                                                        ) : headCell.id === 'appointment_price' ? (
                                                            <Box component={'span'}>
                                                                {matchedCurrency ? `${matchedCurrency.symbol} ${row[headCell.id]}` : row[headCell.id]}
                                                            </Box>
                                                        ) : headCell.id === 'appointment_duration' ? (
                                                            <Box component={'span'} sx={{textWrap:"nowrap"}}>
                                                                {row[headCell.id].split('-').map((time) => 
                                                                    dayjs(`1970-01-01 ${time}`).format(timeFormated)
                                                                ).join(' - ')}
                                                            </Box>
                                                        ) : headCell.id === 'appointment_created' ? (
                                                            <Box component={'span'}>
                                                                {dayjs(row[headCell.id]).format(dateFormat + ' ' + timeFormated)}
                                                            </Box>
                                                        ) : headCell.id === 'action' ? (
                                                            <Box sx={{textWrap:"nowrap"}}>
                                                                <IconButton 
                                                                    color="success"
                                                                    sx={{padding:"0px 8px"}}
                                                                    onClick={() => this.handleEditDialogOpen(row)}
                                                                >
                                                                    <ModeIcon />
                                                                </IconButton>
                                                                { ! isStaff && (
                                                                    <>
                                                                        <IconButton 
                                                                            color="error"
                                                                            onClick={(event) => { 
                                                                                this.handleAppointmentDelete(row.appointment_id) 
                                                                            }}
                                                                            sx={{padding:"0px 8px"}}
                                                                        >
                                                                            <DeleteIcon />
                                                                        </IconButton>
                                                                    </>
                                                                )}
                                                            </Box>
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
                        onPageChange={(event, newPage) => handleChangePage(state, setState, this.props.fetchAppointmentData, newPage)}
                        onRowsPerPageChange={(event) => handleChangeRowsPerPage(state, setState, this.props.fetchAppointmentData, event)}
                    />
                </Paper>
                <SnackbarNotice
                    state={this.state}
                    setState={this.setState.bind(this)}
                    open={snackbarOpen}
                    message={snackbarMessage}
                    type={snackbarType}
                />
                <EditAppointment
                    open={dialogOpen}
                    onClose={this.handleDeleteDialogClose}
                    fetchAppointmentData={this.props.fetchAppointmentData}
                    editFormData={selectedAppointment}
                    locations={locations}
                    services={services}
                    customers={customers}
                    priorToggle={priorToggle}
                    priorTime={priorTime}
                    dateFormat={dateFormat}
                    timeFormat={timeFormat}
                    currency={currency}
                />
                <ConfirmationDialog
                    open={confirmationDialogOpen}
                    onClose={() => this.setState({ confirmationDialogOpen: false, AppointmentIdToDelete: null })}
                    onConfirm={this.confirmationAppointmentDelete}
                    loading={confirmationLoading}
                />
            </>
        );
    }
}

export default AppointmentTable;