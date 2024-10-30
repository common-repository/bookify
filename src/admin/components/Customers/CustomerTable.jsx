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
    handleRequestSort, handleChangePage, handleChangeRowsPerPage, openDialog 
} from '../../functions';
import { SnackbarNotice, ConfirmationDialog } from '../../functions';
import dayjs from 'dayjs';

class CustomerTable extends Component {
    state = {
        snackbarOpen: false,
        snackbarMessage: '',
        snackbarType: 'success',
        confirmationDialogOpen: false,
        confirmationLoading: false,
        CustomerIdToDelete: null
    }

    componentDidMount() {
        let { headCells } = this.props;

        headCells = window.wp.hooks.applyFilters('bookify_staff_table_add_columns', headCells);
        this.props.setState({ headCells });
    }

    handleCustomerDelete = (customerID) => {
        this.setState({ confirmationDialogOpen: true, CustomerIdToDelete: customerID });
    };

    ConfirmationCustomerDelete = () => {
        const { CustomerIdToDelete } = this.state;
        this.setState({ confirmationLoading: true });

        const dataToSend = new FormData();
        dataToSend.append('customer_id', CustomerIdToDelete);

        fetch(`/wp-json/bookify/v1/delete-customer`, {
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
                    confirmationLoading: false,
                    CustomerIdToDelete: null,
                    snackbarOpen: true,
                    snackbarMessage: response.message,
                    snackbarType: 'success',
                });
                this.props.fetchCustomerData();
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

        const { snackbarOpen, snackbarMessage, snackbarType, confirmationDialogOpen, confirmationLoading } = this.state;
        const { state, setState, headCells, TableData, dateFormat, totalCount, pageSize, page, orderBy, order, dataLoading } = this.props;

        return(
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
                                            <TableRow hover key={row.id}>
                                                {headCells.sort((a, b) => a.priority - b.priority).map((headCell) => (
                                                    <TableCell key={headCell.id} align="center">
                                                        {headCell.id === 'customer_name' ? (
                                                            <Typography 
                                                                sx={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    flexDirection: "row",
                                                                    justifyContent: "center",
                                                                }}
                                                            >
                                                                <Avatar
                                                                    src={row.customer_img ? row.customer_img : undefined}
                                                                    sx={{
                                                                        fontSize: "1rem",
                                                                        width: "35px",
                                                                        height: "35px",
                                                                        mr: "10px"
                                                                    }}
                                                                />
                                                                {row[headCell.id]}
                                                            </Typography>
                                                        ) : headCell.id === 'action' ? (
                                                            <>
                                                                <IconButton 
                                                                    color="success"
                                                                    onClick={(event) => {
                                                                        openDialog(state, setState, 'AddCustomerDialog', row.id);
                                                                    }}
                                                                    sx={{padding:"0px 8px"}}
                                                                >
                                                                    <ModeIcon />
                                                                </IconButton>
                                                                <IconButton 
                                                                    color="error"
                                                                    onClick={(event) => {
                                                                        this.handleCustomerDelete(row.id);
                                                                    }}
                                                                    sx={{padding:"0px 8px"}}
                                                                >
                                                                    <DeleteIcon />
                                                                </IconButton>
                                                            </>
                                                        ) : headCell.id === 'last_appointment' ? (
                                                            row[headCell.id] == '-' ? (
                                                                row[headCell.id]
                                                            ) : (
                                                                <Box component={'span'}>
                                                                    {dayjs(row[headCell.id]).format(dateFormat)}
                                                                </Box>
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
                        onPageChange={(event, newPage) => handleChangePage(state, setState, this.props.fetchCustomerData, newPage)}
                        onRowsPerPageChange={(event) => handleChangeRowsPerPage(state, setState, this.props.fetchCustomerData, event)}
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
                    onClose={() => this.setState({ confirmationDialogOpen: false, CustomerIdToDelete: null })}
                    onConfirm={this.ConfirmationCustomerDelete}
                    loading={confirmationLoading}
                />
            </>
        )
    }
}

export default CustomerTable;