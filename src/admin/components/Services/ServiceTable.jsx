import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import {
    Paper, Typography, TableContainer, Table, TableHead, 
    TableRow, TableCell, TableSortLabel, TableBody,
    TablePagination, IconButton, Avatar, Box, Skeleton
} from '@mui/material';
import ModeIcon from '@mui/icons-material/Mode';
import DeleteIcon from '@mui/icons-material/Delete';
import { 
    handleRequestSort, handleChangePage, handleChangeRowsPerPage, openDialog 
} from '../../functions';
import { SnackbarNotice, ConfirmationDialog } from '../../functions';
import currencies from '../../currencies.json';

class ServiceTable extends Component { 
    state = {
        snackbarOpen: false,
        snackbarMessage: '',
        snackbarType: 'success',
        confirmationDialogOpen: false,
        confirmationLoading: false,
        ServiceIdToDelete: null
    }

    componentDidMount() {
        let { headCells } = this.props;

        headCells = window.wp.hooks.applyFilters('bookify_service_table_add_columns', headCells);
        this.props.setState({ headCells });
    }

    handleServiceDelete = (serviceId) => {
        this.setState({ confirmationDialogOpen: true, ServiceIdToDelete: serviceId });
    };

    ConfirmationServiceDelete = () => {
        const { ServiceIdToDelete } = this.state;
        this.setState({ confirmationLoading: true });
        
        const dataToSend = new FormData();
        dataToSend.append('service_id', ServiceIdToDelete);

        fetch(`/wp-json/bookify/v1/delete-service`, {
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
                    ServiceIdToDelete: null,
                    snackbarOpen: true,
                    snackbarMessage: response.message,
                    snackbarType: 'success',
                });
                this.props.fetchServiceData();
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
    };

    render() {

        const { snackbarOpen, snackbarMessage, snackbarType, confirmationDialogOpen, confirmationLoading } = this.state;
        const { state, setState, headCells, TableData, totalCount, pageSize, page, orderBy, order, currency, ServiceDataLoading } = this.props;

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
                                                onClick={() => handleRequestSort(state, setState, headCell.id)}
                                            >
                                                {headCell.label}
                                            </TableSortLabel>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {ServiceDataLoading ? (
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
                                    TableData.map((row) => (
                                        <TableRow hover key={row.service_id}>
                                            {headCells.sort((a, b) => a.priority - b.priority).map((headCell) => (
                                                <TableCell key={headCell.id} align="center">
                                                    {headCell.id === 'service_name' ? (
                                                        <Typography 
                                                            sx={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                flexDirection: "row",
                                                                justifyContent: "center",
                                                            }}
                                                        >
                                                            <Avatar
                                                                src={row.service_img ? row.service_img : undefined}
                                                                children={(() => {
                                                                    const nameParts = row[headCell.id].split(' ');
                                                                    const initials = nameParts.length > 1
                                                                        ? `${nameParts[0][0]}${nameParts[1][0]}`
                                                                        : `${nameParts[0][0]}`;
                                                                    return initials;
                                                                })()}
                                                                sx={{
                                                                    fontSize: "1rem",
                                                                    width: "35px",
                                                                    height: "35px",
                                                                    mr: "10px"
                                                                }}
                                                            />
                                                            {row[headCell.id]}
                                                        </Typography>
                                                    ) : headCell.id === 'service_price' ? (
                                                        (() => {
                                                            const matchedCurrency = Object.values(currencies).find(eachCurrency => eachCurrency.code === currency);
                                                            return (
                                                                <Box component={'span'}>
                                                                    {matchedCurrency ? `${matchedCurrency.symbol} ${row[headCell.id]}` : row[headCell.id]}
                                                                </Box>
                                                            );
                                                        })()
                                                    ) : headCell.id === 'action' ? (
                                                        <>
                                                            <IconButton 
                                                                color="success"
                                                                onClick={(event) => {
                                                                    openDialog(state, setState, 'AddServiceDialog', row.service_id);
                                                                }}
                                                                sx={{padding:"0px 8px"}}
                                                            >
                                                                <ModeIcon />
                                                            </IconButton>
                                                            <IconButton 
                                                                color="error"
                                                                onClick={(event) => {
                                                                    this.handleServiceDelete(row.service_id);
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
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        component="div"
                        count={totalCount}
                        rowsPerPage={pageSize}
                        page={page}
                        onPageChange={(event, newPage) => handleChangePage(state, setState, this.props.fetchServiceData, newPage)}
                        onRowsPerPageChange={(event) => handleChangeRowsPerPage(state, setState, this.props.fetchServiceData, event)}
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
                    onClose={() => this.setState({ confirmationDialogOpen: false, ServiceIdToDelete: null })}
                    onConfirm={this.ConfirmationServiceDelete}
                    loading={confirmationLoading}
                />
            </>
        )
    }
}

export default ServiceTable;