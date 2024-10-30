import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import {
    Paper, Typography, TableContainer, Table, TableHead,
    TableRow, TableCell, TableSortLabel, TableBody, Switch,
    IconButton, TablePagination, FormControl, FormControlLabel, Skeleton
} from '@mui/material';
import ModeIcon from '@mui/icons-material/Mode';
import DeleteIcon from '@mui/icons-material/Delete';
import { 
    handleRequestSort, handleChangePage, handleChangeRowsPerPage, openDialog 
} from '../../functions';
import { SnackbarNotice, ConfirmationDialog } from '../../functions';

class NotificationTable extends Component {

    state = {
        headCells: [
            { id: 'id', label: 'ID', priority: 0 },
            { id: 'notification_name', label: 'Notification Name', priority: 5 },
            { id: 'notification_event', label: 'Event', priority: 10 },
            { id: 'state', label: 'Status', priority: 15 },
            { id: 'email_sends_to', label: 'Email Sends To', priority: 20 },
            { id: 'action', label: 'Action', priority: 30 },
        ],
        snackbarOpen: false,
        snackbarMessage: '',
        snackbarType: 'success',
        confirmationDialogOpen: false,
        confirmationLoading: false,
        NotificationIdToDelete: null
    }

    componentDidMount() {
        let { headCells } = this.state;

        headCells = window.wp.hooks.applyFilters('bookify_notification_table_add_columns', headCells);
        this.setState({ headCells });
    }

    handleNotificationDelete = (notificationID) => {
        this.setState({ confirmationDialogOpen: true, NotificationIdToDelete: notificationID });
    };
    
    ConfirmationNotificationDelete = () => {
        const { NotificationIdToDelete } = this.state
        this.setState({ confirmationLoading: true });

        const dataToSend = new FormData();
        dataToSend.append('notification_id', NotificationIdToDelete);

        fetch(`/wp-json/bookify/v1/delete-notification`, {
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
                    NotificationIdToDelete: null,
                    snackbarOpen: true,
                    snackbarMessage: response.message,
                    snackbarType: 'success',
                });
                this.props.fetchNotificationData();
            } else {
                this.setState({ 
                    confirmationLoading: false,
                    snackbarOpen: true, 
                    snackbarMessage: response.message, 
                    snackbarType:  'error'
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            this.setState({ confirmationLoading: false });
        })
    };

    handleNotificationState = (event, notificationId) => {
        const { checked } = event.target;
        const dataToSend = new FormData();
        dataToSend.append('notification_id', notificationId);
        dataToSend.append('notificationState', checked);

        fetch(`/wp-json/bookify/v1/update-notification-state`, {
            method: 'POST',
            headers: {
                'X-WP-Nonce': wpApiSettings.nonce
            },
            body: dataToSend
        })
        .then(response => response.json())
        .then((response) => {
            if (response.success) {
                this.setState({
                    snackbarOpen: true,
                    snackbarMessage: response.message,
                    snackbarType: 'success'
                });
                this.props.fetchNotificationData();
            } else {
                this.setState({
                    snackbarOpen: true,
                    snackbarMessage: response.message,
                    snackbarType: 'error'
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
        })
    }

    render() {

        const { headCells, snackbarOpen, snackbarMessage, snackbarType, confirmationDialogOpen, confirmationLoading } = this.state;
        const { state, setState, TableData, orderBy, order, totalCount, pageSize, page, dataLoading } = this.props

        const getTrueKeys = (data) => {
            return Object.keys(data)
                .filter(key => data[key] === "true")
                .map(key => key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()))
                .join(' | ');
        };

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
                                        <TableRow hover key={row.id}>
                                            {headCells.sort((a, b) => a.priority - b.priority).map((headCell) => (
                                                <TableCell key={headCell.id} align="center">
                                                    {headCell.id === 'state' ? (
                                                        <FormControl>
                                                            <FormControlLabel 
                                                                name="notificationState" 
                                                                checked={row.notification_toggle} 
                                                                onChange={(event) => {
                                                                    this.handleNotificationState(event, row.id);
                                                                }}
                                                                control={<Switch color="primary" />} 
                                                            />
                                                        </FormControl>
                                                    ) : headCell.id === 'action' ? (
                                                        <>
                                                            <IconButton 
                                                                color="success"
                                                                onClick={(event) => {
                                                                    openDialog(state, setState, 'AddNotificationDialog', row.id);
                                                                }}
                                                                sx={{padding: "0px 8px"}}
                                                            >
                                                                <ModeIcon />
                                                            </IconButton>
                                                                <IconButton 
                                                                    color="error"
                                                                    onClick={(event) => {
                                                                        this.handleNotificationDelete(row.id);
                                                                    }}
                                                                    sx={{padding:"0px 8px"}}
                                                                >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </>
                                                    ) : headCell.id === 'email_sends_to' ? (
                                                        <>
                                                            {getTrueKeys(row[headCell.id])}
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
                        onPageChange={(event, newPage) => handleChangePage(state, setState, this.props.fetchNotificationData, newPage)}
                        onRowsPerPageChange={(event) => handleChangeRowsPerPage(state, setState, this.props.fetchNotificationData, event)}
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
                    onClose={() => this.setState({ confirmationDialogOpen: false, NotificationIdToDelete: null })}
                    onConfirm={this.ConfirmationNotificationDelete}
                    loading={confirmationLoading}
                />
            </>
        )
    }
}

export default NotificationTable;


