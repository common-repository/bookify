import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import {
    Paper, Typography, TableContainer, Table, TableHead, 
    TableRow, TableCell, TableSortLabel, TableBody,
    TablePagination, Avatar, IconButton, Skeleton
} from '@mui/material';
import ModeIcon from '@mui/icons-material/Mode';
import DeleteIcon from '@mui/icons-material/Delete';
import { 
    handleRequestSort, handleChangePage, handleChangeRowsPerPage, openDialog 
} from '../../functions';
import { SnackbarNotice, ConfirmationDialog } from '../../functions';

class StaffTable extends Component { 

    state = {
        snackbarOpen: false,
        snackbarMessage: '',
        snackbarType: 'success',
        confirmationDialogOpen: false,
        confirmationLoading: false,
        StaffIdToDelete: null
    }

    componentDidMount() {
        let { headCells } = this.props;

        headCells = window.wp.hooks.applyFilters('bookify_staff_table_add_columns', headCells);
        this.props.setState({ headCells });
    }

    handleStaffDelete = (staffId) => {
        this.setState({ confirmationDialogOpen: true, StaffIdToDelete: staffId });
    };

    ConfirmationStaffDelete = () => {
        const { StaffIdToDelete } = this.state;
        this.setState({ confirmationLoading: true });

        const dataToSend = new FormData();
        dataToSend.append('staff_id', StaffIdToDelete);

        fetch(`/wp-json/bookify/v1/delete-staff`, {
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
                    StaffIdToDelete: null,
                    snackbarOpen: true,
                    snackbarMessage: response.message,
                    snackbarType: 'success',
                });
                this.props.fetchStaffData();
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
        const { state, setState, headCells, TableData, totalCount, pageSize, page, orderBy, order, isStaff, dataLoading } = this.props;

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
                                    TableData.map((row) => (
                                        <TableRow hover key={row.id} >
                                            {headCells.sort((a, b) => a.priority - b.priority).map((headCell) => (
                                                <TableCell key={headCell.id} align="center">
                                                    {headCell.id === 'staff_name' ? (
                                                        <Typography 
                                                            sx={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                flexDirection: "row",
                                                                justifyContent: "center",
                                                            }}
                                                        >
                                                            <Avatar 
                                                                src={row.staff_img ? row.staff_img : undefined}
                                                                sx={{
                                                                    fontSize:"1rem",
                                                                    width:"35px",
                                                                    height:"35px",
                                                                    mr:"10px"
                                                                }}
                                                            />
                                                            {row[headCell.id]}
                                                        </Typography>
                                                    ) : headCell.id === 'action' ? (
                                                        <>
                                                            <IconButton 
                                                                color="success"
                                                                onClick={() => {
                                                                    openDialog(state, setState, 'AddStaffDialog', row.id);
                                                                }}
                                                                sx={{padding:"0px 8px"}}
                                                            >
                                                                <ModeIcon />
                                                            </IconButton>
                                                            { ! isStaff && (
                                                                <>
                                                                    <IconButton 
                                                                        color="error"
                                                                        onClick={(event) => {
                                                                            event.stopPropagation();
                                                                            this.handleStaffDelete(row.id);
                                                                        }}
                                                                        sx={{padding:"0px 8px"}}
                                                                    >
                                                                        <DeleteIcon />
                                                                    </IconButton>
                                                                </>
                                                            )}
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
                        onPageChange={(event, newPage) => handleChangePage(state, setState, this.props.fetchStaffData, newPage)}
                        onRowsPerPageChange={(event) => handleChangeRowsPerPage(state, setState, this.props.fetchStaffData, event)}
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
                    onClose={() => this.setState({ confirmationDialogOpen: false, StaffIdToDelete: null })}
                    onConfirm={this.ConfirmationStaffDelete}
                    loading={confirmationLoading}
                />
            </>
        )
    }
}

export default StaffTable;