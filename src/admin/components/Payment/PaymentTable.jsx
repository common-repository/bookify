import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import {
    Paper, Typography, TableContainer, Table, TableHead,
    TableRow, TableCell, TableSortLabel, TableBody, TablePagination,
    Avatar, FormControl, Select, MenuItem, Box, IconButton, Skeleton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { 
    handleRequestSort, handleChangePage, handleChangeRowsPerPage 
} from '../../functions';
import { SnackbarNotice, ConfirmationDialog } from '../../functions';
import currencies from '../../currencies.json';
import dayjs from 'dayjs';

class PaymentTable extends Component {

    state = {
        StatusOptions: [
            'Pending',
            'Paid',
            'Partially Paid'
        ],
        snackbarOpen: false,
        snackbarMessage: '',
        snackbarType: 'success',
        confirmationDialogOpen: false,
        confirmationLoading: false,
        paymentToDelete: null,
    };

    componentDidMount() {
        let { headCells } = this.props;

        headCells = window.wp.hooks.applyFilters('bookify_payment_table_add_columns', headCells);
        this.props.setState({ headCells });
    }

    handlePaymentDelete = (payment) => {
        this.setState({ confirmationDialogOpen: true, paymentToDelete: payment });
    };

    ConfirmationPaymentDelete = () => {
        const { paymentToDelete } = this.state;

        const { fetchPaymentData } = this.props
        this.setState({ confirmationLoading: true });

        const dataToSend = new FormData();
        dataToSend.append('payment_id', paymentToDelete.payment_id);
        dataToSend.append('total_amount', paymentToDelete.total);
        dataToSend.append('appointment_id', paymentToDelete.appointment_id);

        fetch(`/wp-json/bookify/v1/delete-payment`, {
            method: 'POST',
            headers: {
                'X-WP-Nonce': wpApiSettings.nonce
            },
            body: dataToSend
        })
        .then(response => response.json())
        .then((response) => {
            if ( response.success ) {
                this.setState({ 
                    confirmationDialogOpen: false,
                    confirmationLoading: false,
                    paymentToDelete: null,
                    snackbarOpen: true,
                    snackbarMessage: response.message,
                    snackbarType: 'success',
                });
                fetchPaymentData();
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
            console.error('Error:', error);
            this.setState({ confirmationLoading: false });
        })
    }

    handlePaymentStatusChange = ( event, paymentID ) => {
        const { value } = event.target;
        const { fetchPaymentData } = this.props

        const dataToSend = new FormData();
        dataToSend.append('payment_id', paymentID);
        dataToSend.append('payment_status', value);

        fetch('/wp-json/bookify/v1/update-payment', {
            method: 'POST',
            headers: {
                'X-WP-Nonce': wpApiSettings.nonce
            },
            body: dataToSend,
        })
        .then(response => response.json())
        .then(response => {
            if ( response.success ) {
                this.setState({ 
                    snackbarOpen: true,
                    snackbarMessage: response.message,
                    snackbarType: 'success',
                });
                fetchPaymentData();
            } else {
                this.setState({ 
                    snackbarOpen: true, 
                    snackbarMessage: response.message, 
                    snackbarType:  'error'
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
        })
    }

    render() {

        const { StatusOptions, snackbarOpen, snackbarMessage, snackbarType, confirmationDialogOpen, confirmationLoading } = this.state;
        const { state, setState, headCells, TableData, totalCount, currency, dateFormat, pageSize, page, order, orderBy, dataLoading } = this.props;

        const matchedCurrency = Object.values(currencies).find(eachCurrency => eachCurrency.code === currency);

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
                                            <TableRow hover key={row.id} >
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
                                                                {row['service_name']}
                                                            </Typography>
                                                        ) : headCell.id === 'total' ? ( 
                                                            <Typography 
                                                                sx={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    flexDirection: "column",
                                                                    fontSize:"0.875rem"
                                                                }}
                                                            >
                                                                {`${matchedCurrency.symbol} ${row[headCell.id]}`}
                                                            </Typography>
                                                        ) : headCell.id === 'paid' ? ( 
                                                            <Typography 
                                                                sx={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    flexDirection: "column",
                                                                    fontSize:"0.875rem"
                                                                }}
                                                            >
                                                                {`${matchedCurrency.symbol} ${row[headCell.id]}`}
                                                            </Typography>
                                                        ) : headCell.id === 'due' ? (
                                                            <Typography 
                                                                sx={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    flexDirection: "column",
                                                                    fontSize:"0.875rem"
                                                                }}
                                                            >
                                                                {`${matchedCurrency.symbol} ${row[headCell.id]}`}
                                                            </Typography>
                                                        ) : headCell.id === 'status' ? (
                                                            <FormControl size='small' sx={{width:"10em"}}>
                                                                <Select
                                                                    value={row[headCell.id]}
                                                                    onChange={(event) => {
                                                                        event.stopPropagation();
                                                                        this.handlePaymentStatusChange(event, row['payment_id'])
                                                                    }}
                                                                >
                                                                    {StatusOptions.map((value) => (
                                                                        <MenuItem key={value} value={value}>
                                                                            {value}
                                                                        </MenuItem>
                                                                    ))}
                                                                </Select>
                                                            </FormControl>
                                                        ) : headCell.id === 'action' ? (
                                                            <>
                                                                <IconButton 
                                                                    color="error"
                                                                    onClick={(event) => { 
                                                                        this.handlePaymentDelete(row) 
                                                                    }}
                                                                    sx={{padding:"0px 8px"}}
                                                                >
                                                                    <DeleteIcon />
                                                                </IconButton>
                                                                
                                                            </>
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
                        onPageChange={(event, newPage) => handleChangePage(state, setState, this.props.fetchPaymentData, newPage)}
                        onRowsPerPageChange={(event) => handleChangeRowsPerPage(state, setState, this.props.fetchPaymentData, event)}
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
                    onClose={() => this.setState({ confirmationDialogOpen: false, paymentToDelete: null })}
                    onConfirm={this.ConfirmationPaymentDelete}
                    loading={confirmationLoading}
                />
            </>
        )
    }
}

export default PaymentTable;