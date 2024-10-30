import React from 'react';
import { Snackbar, Alert, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

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
    const { headCells, data } = state;
    const csvRows = [];

    const headers = headCells.map(cell => cell.label);
    csvRows.push(headers.join(','));

    for (const row of data) {
        const values = headCells.map(cell => row[cell.id]);
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

const SnackbarNotice = ({ state, setState, open, message, type }) => {
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
            autoHideDuration={5000}
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

export default SnackbarNotice;
