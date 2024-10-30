import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, Box,
    Divider,IconButton, Grid, FormControl, TextField, Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {SnackbarNotice} from '../../functions';
import LoadingButton from '@mui/lab/LoadingButton';

class NotificationSettings extends Component { 
    state = { 
        notificationFormData: {
            senderName: '',
            senderEmail: '',
        },
        snackbarOpen: false,
        snackbarMessage: '',
        snackbarType: '',
        loading: false
    };

    componentDidUpdate(prevProps) {
        if (prevProps.savedNotificationSettings !== this.props.savedNotificationSettings) {
            this.setState({
                notificationFormData: {
                    senderName: this.props.savedNotificationSettings.senderName || '',
                    senderEmail: this.props.savedNotificationSettings.senderEmail || '',
                }
            });
        }
    }

    handleClose = () => this.props.onClose && this.props.onClose();

    handleInputChange = (event) => {
        const { name, value } = event.target;
        this.setState(prevState => ({
            notificationFormData: {
                ...prevState.notificationFormData,
                [name]: value,
            }
        }));
    };

    SaveNotificationSettings = () => {
        const { notificationFormData } = this.state;
        this.setState({ loading: true });
    
        const dataToSend = new FormData();
        dataToSend.append('senderName', notificationFormData.senderName);
        dataToSend.append('senderEmail', notificationFormData.senderEmail);
    
        fetch('/wp-json/bookify/v1/save-notification-settings', {
            method: 'POST',
            headers: {
                'X-WP-Nonce': wpApiSettings.nonce
            },
            body: dataToSend,
        })
        .then(response => response.json())
        .then((response) => {
            if ( response.success ) {
                this.setState({ 
                    snackbarOpen: true,
                    snackbarMessage: response.message,
                    snackbarType: 'success',
                    loading: false
                });
                this.handleClose();
            } else {
                this.setState({ 
                    snackbarOpen: true, 
                    snackbarMessage: response.message, 
                    snackbarType:  'error',
                    loading: false
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            this.setState({ loading: false });
        })
    };

    render() { 
        const { open } = this.props;
        const { notificationFormData, snackbarOpen, snackbarMessage, snackbarType, loading } = this.state;

        return (
            <>
                <Dialog onClose={this.handleClose} open={open} fullWidth={true} maxWidth={'sm'}>
                    <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
                        {__('Notification Settings', 'bookify')}
                        <IconButton
                            onClick={this.handleClose}
                            sx={{
                                position: "absolute",
                                right: 8,
                                top: 8,
                                color: (theme) => theme.palette.grey[500],
                            }}
                        >
                            <CloseIcon sx={{ fontSize: "1rem" }} />
                        </IconButton>
                    </DialogTitle>

                    <Divider variant="middle" />

                    <DialogContent>
                        <Box component="form">
                            <Grid container spacing={4} direction="column">
                                <Grid item>
                                    <FormControl fullWidth size="small">
                                        <TextField 
                                            type="text" 
                                            label={__('Sender Name', 'bookify')} 
                                            name="senderName"
                                            value={notificationFormData.senderName} 
                                            onChange={this.handleInputChange} 
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid item>
                                    <FormControl fullWidth size="small">
                                        <TextField 
                                            type="text" 
                                            label={__('Sender Email', 'bookify')} 
                                            name="senderEmail"
                                            value={notificationFormData.senderEmail} 
                                            onChange={this.handleInputChange} 
                                        />
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Box>
                    </DialogContent>
                    
                    <Divider variant="middle" />

                    <DialogActions sx={{ margin: 2 }}>
                        <LoadingButton variant="outlined" onClick={this.SaveNotificationSettings} loading={loading}>
                        {__('Save', 'bookify')}
                        </LoadingButton>
                    </DialogActions>
                </Dialog>
                <SnackbarNotice
                    state={this.state}
                    setState={this.setState.bind(this)}
                    open={snackbarOpen}
                    message={snackbarMessage}
                    type={snackbarType}
                />
            </>
        );
    }
}

export default NotificationSettings;