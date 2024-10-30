import React from 'react';
import { __ } from '@wordpress/i18n';
import { Snackbar, Alert, IconButton, Dialog, DialogActions,
    DialogContent, DialogContentText, DialogTitle, Button, Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import LoadingButton from '@mui/lab/LoadingButton';

export function handleRequestSort(state, setState, property) {
    const { orderBy, order, TableData } = state;
    const isAsc = orderBy === property && order === 'asc';
    const sortedData = [...TableData].sort((a, b) => {
        if (isAsc) {
            return a[property] > b[property] ? 1 : -1;
        } else {
            return a[property] < b[property] ? 1 : -1;
        }
    });
    setState({
        ...state,
        TableData: sortedData,
        order: isAsc ? 'desc' : 'asc',
        orderBy: property,
    });
}

export function handleSelectAllClick(state, setState, event) {
    const { data } = state;
    if (event.target.checked) {
        const newSelected = data.map((n) => n.id);
        setState({ ...state, selected: newSelected });
        return;
    }
    setState({ ...state, selected: [] });
}

export function handleClick(state, setState, event, id) {
    const { selected } = state;
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
        newSelected = [...selected, id];
    } else if (selectedIndex === 0) {
        newSelected = selected.slice(1);
    } else if (selectedIndex === selected.length - 1) {
        newSelected = selected.slice(0, -1);
    } else if (selectedIndex > 0) {
        newSelected = [
            ...selected.slice(0, selectedIndex),
            ...selected.slice(selectedIndex + 1),
        ];
    }

    setState({ ...state, selected: newSelected });
};

function convertToCSV(state) {
    const { headCells, TableData } = state;
    const csvRows = [];

    const filteredHeadCells = headCells.filter(cell => cell.id !== 'action');

    const headers = filteredHeadCells.map(cell => cell.label);
    csvRows.push(headers.join(','));

    for (const row of TableData) {
        const values = filteredHeadCells.map(cell => row[cell.id]);
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
};

export function downloadCSV(state, fileName) {
    const csvData = convertToCSV(state);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

export function openDialog(state, setState, dialogHandle, editID = null) {
    setState({ ...state, [dialogHandle]: true, editDialogHandle: editID });
}

export function closeDialog(state, setState, dialogHandle) {
    setState({ ...state, [dialogHandle]: false});
};

export function handleChangePage(state, setState, fetchData, newPage) {
    setState({ ...state, page: newPage });
    fetchData(newPage + 1, state.pageSize);
}

export function handleChangeRowsPerPage(state, setState, fetchData, event) {
    const newPageSize = parseInt(event.target.value, 10);
    setState({ ...state, pageSize: newPageSize, page: 0 });
    fetchData(1, newPageSize);
}

export const SnackbarNotice = ({ state, setState, open, message, type }) => {
    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setState({ ...state, snackbarOpen: false });
    };

    return (
        <Snackbar
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            open={open}
            autoHideDuration={4000}
            onClose={handleClose}
            message={message}
            action={
                <IconButton
                    size="small"
                    aria-label="close"
                    color="inherit"
                    onClick={handleClose}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            }
        >
            <Alert
                onClose={handleClose}
                severity={type}
                variant="filled"
                sx={{ width: '100%' }}
            >
                {message}
            </Alert>
        </Snackbar>
    );
};

export const ConfirmationDialog = ({ open, onClose, onConfirm, loading }) => {
    return (
        <Dialog open={open} onClose={onClose} 
            sx={{
                '& .MuiDialog-paper': {
                    padding:"20px",
                },
                '& .MuiDialogActions-root': {
                    justifyContent: "space-between",
                }
            }}
        >   
            <Box component={"div"} sx={{textAlign:"center"}}>
                <ErrorOutlineOutlinedIcon fontSize="large" sx={{color:"#facea8", width:"6rem", height:"6rem"}}/>
            </Box>
            <DialogTitle sx={{textAlign:"center"}}>{__('Are you sure?', 'bookify')}</DialogTitle>
            <DialogContent>
                <DialogContentText>{__('You won\'t be able to revert this!', 'bookify')}</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    {__('Cancel', 'bookify')}
                </Button>
                <LoadingButton onClick={onConfirm} color="primary" autoFocus loading={loading}>
                    {__('Confirm', 'bookify')}
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};

export const EmailCodes = [
    { primary: '{appointment_id}', secondary: 'Appointment number' },
    { primary: '{appointment_date}', secondary: 'Date of booked appointment' },
    { primary: '{appointment_slot}', secondary: 'Slot of booked appointment' },
    { primary: '{appointment_duration}', secondary: 'Duration of booked appointment' },
    { primary: '{appointment_service_category}', secondary: 'Service\'s category name of booked appointment' },
    { primary: '{appointment_service}', secondary: 'Service name of booked appointment' },
    { primary: '{appointment_price}', secondary: 'Total price of booked appointment' },
    { primary: '{appointment_status}', secondary: 'Status of booked appointment' },
    { primary: '{customer_name}', secondary: 'Customer name' },
    { primary: '{customer_phone}', secondary: 'Customer phone number' },
    { primary: '{customer_email}', secondary: 'Customer email' },
    { primary: '{staff_name}', secondary: 'Staff name' },
    { primary: '{staff_phone}', secondary: 'Staff phone' },
    { primary: '{staff_email}', secondary: 'Staff email' },
    { primary: '{staff_profession}', secondary: 'Staff profession' },
    { primary: '{company_name}', secondary: 'Company name' },
    { primary: '{company_address}', secondary: 'Company address' },
    { primary: '{company_phone}', secondary: 'Company phone' },
    { primary: '{company_website}', secondary: 'company website address' },
    { primary: '{company_logo}', secondary: 'Company logo' },
];
