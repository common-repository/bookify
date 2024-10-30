import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, Box, 
    Divider, IconButton, Grid, FormControl, TextField, 
    FormControlLabel, Button, Switch, InputLabel, Select, 
    MenuItem, FormLabel, FormGroup, Checkbox, Accordion,
    AccordionSummary, Typography, AccordionDetails, List, 
    ListItem, ListItemText
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import copy from "copy-to-clipboard";
import {SnackbarNotice} from '../../functions';
import { EmailCodes } from '../../functions';
import LoadingButton from '@mui/lab/LoadingButton';

class AddNotification extends Component { 
    state = { 
        notificationEvents: [
            'Appointment Requested',
            'Appointment Confirmed',
            'Appointment Cancelled',
            'Staff Created',
        ],
        addFormData: {
            notificationName: '',
            notificationToggle: true,
            notificationEvent: 'Appointment Requested',
            emailSubject: '',
            emailBody: '',
            emailToAdmin: true,
            emailToStaff: false,
            emailToCustomer: false, 
        },
        editFormData: {
            notificationName: '',
            notificationToggle: '',
            notificationEvent: '',
            emailSubject: '',
            emailBody: '',
            emailToAdmin: '',
            emailToStaff: '',
            emailToCustomer: '', 
        },
        errors: {
            notificationName: false,
            emailSubject: false,
            emailBody: false,
        },
        snackbarOpen: false,
        snackbarMessage: '',
        snackbarType: '',
        loading: false
    };

    componentDidUpdate(prevProps) {
        if (this.props.notificationId && prevProps.notificationId !== this.props.notificationId) {
            this.loadNotificationData(this.props.notificationId);
        }
    }

    loadNotificationData = (notificationId) => {
        const notification = this.props.fetchNotificationById(notificationId);
        if (notification) {
            this.setState({ 
                editFormData: { 
                    notificationName: notification.notification_name, 
                    notificationToggle: notification.notification_toggle,
                    notificationEvent: notification.notification_event,
                    emailSubject: notification.notification_email_subject,
                    emailBody: notification.notification_email_body,
                    emailToAdmin: notification.email_sends_to.admin,
                    emailToStaff: notification.email_sends_to.staff,
                    emailToCustomer: notification.email_sends_to.customer,
                } 
            });
        }
    };

    handleClose = () => { this.props.onClose && this.props.onClose() };

    copyEmailCode = (text) => {
        copy(text);
        this.setState({ 
            snackbarOpen: true,
            snackbarMessage: `"${text}" copied into clipboard!`,
            snackbarType: 'success',
        });
    }

    handleInputChange = (event) => {
        const { name, value, type, checked } = event.target;
        const formState = this.props.notificationId ? 'editFormData' : 'addFormData';
        this.setState(prevState => ({
            [formState]: { ...prevState[formState], [name]:  type === 'checkbox' ? checked : value},
            errors: { ...prevState.errors, [name]: false }
        }));
    };

    handleEmailBody = (value) => {
        const formState = this.props.notificationId ? 'editFormData' : 'addFormData';
        this.setState(prevState => ({
            [formState]: { ...prevState[formState], 'emailBody': value},
            errors: { ...prevState.errors, 'emailBody': false }
        }));
    };

    AddNotificationDetails = () => {
        const { addFormData, editFormData } = this.state;
        const { notificationId, fetchNotificationData } = this.props;

        const currentForm = notificationId ? editFormData : addFormData;
        
        const errors = {
            notificationName: !currentForm.notificationName,
            emailSubject: !currentForm.emailSubject,
            emailBody: !currentForm.emailBody,
        };

        this.setState({ errors });

        if ( errors.notificationName || errors.emailSubject || errors.emailBody ) {
            return;
        }

        this.setState({ loading: true });

        const dataToSend = new FormData();
        
        if (notificationId) {
            dataToSend.append('notification_id', notificationId);
        }
        dataToSend.append('notificationName', currentForm.notificationName);
        dataToSend.append('notificationToggle', currentForm.notificationToggle);
        dataToSend.append('notificationEvent', currentForm.notificationEvent);
        dataToSend.append('emailSubject', currentForm.emailSubject);
        dataToSend.append('emailBody', currentForm.emailBody);
        dataToSend.append('emailToAdmin', currentForm.emailToAdmin);
        dataToSend.append('emailToStaff', currentForm.emailToStaff);
        dataToSend.append('emailToCustomer', currentForm.emailToCustomer);

        const endpoint = notificationId ? `/wp-json/bookify/v1/update-notification` : `/wp-json/bookify/v1/add-notification`;
    
        fetch(endpoint, { 
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
                    snackbarOpen: true,
                    snackbarMessage: response.message,
                    snackbarType: 'success',
                    loading: false,
                    addFormData: {
                        notificationName: '',
                        notificationToggle: true,
                        notificationEvent: 'Appointment Requested',
                        emailSubject: '',
                        emailBody: '',
                        emailToAdmin: true,
                        emailToStaff: false,
                        emailToCustomer: false, 
                    },
                });
                this.handleClose();
                fetchNotificationData();
            } else {
                this.setState({ 
                    snackbarOpen: true, 
                    snackbarMessage: response.message, 
                    snackbarType:  'error',
                    loading: false,
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            this.setState({ loading: false });
        })
    };

    render() {

        const { open, notificationId } = this.props;
        const { addFormData ,editFormData, errors, notificationEvents, snackbarOpen, snackbarMessage, snackbarType, loading } = this.state;
        const currentForm = notificationId ? editFormData : addFormData;

        return (
            <>
                <Dialog onClose={this.handleClose} open={open} fullWidth={true} maxWidth={'sm'}>
                    <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
                        {notificationId ? __('Edit Notification', 'bookify') : __('Add Notification', 'bookify')}
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
                            <Grid container spacing={3} direction="column">
                                <Grid item>
                                    <FormControl fullWidth>
                                        <TextField 
                                            error={errors.notificationName}
                                            required
                                            type="text" 
                                            label={__('Notification Name', 'bookify')} 
                                            name="notificationName" 
                                            value={currentForm.notificationName}
                                            onChange={this.handleInputChange} 
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid item sx={{ paddingTop: "15px !important" }}>
                                    <FormControl fullWidth>
                                        <FormControlLabel 
                                            name="notificationToggle" 
                                            checked={currentForm.notificationToggle} 
                                            onChange={this.handleInputChange} 
                                            control={<Switch color="primary" />} 
                                            label={__('Enable/Disable Notification', 'bookify')} 
                                            labelPlacement="end" 
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid item>
                                    <FormControl fullWidth>
                                        <InputLabel id="bookify-notification-event">{__('Notification Events', 'bookify')}</InputLabel>
                                        <Select 
                                            labelId="bookify-notification-event" 
                                            name="notificationEvent" 
                                            value={currentForm.notificationEvent} 
                                            label={__('Notification Events', 'bookify')} 
                                            onChange={this.handleInputChange}
                                        >
                                            {notificationEvents.map((value) => (
                                                <MenuItem key={value} value={value}>
                                                    {value}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item>
                                    <FormControl fullWidth>
                                        <TextField 
                                            error={errors.emailSubject}
                                            required
                                            type="text" 
                                            label={__('Email Subject', 'bookify')} 
                                            name="emailSubject" 
                                            value={currentForm.emailSubject}
                                            onChange={this.handleInputChange} 
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid item>
                                    <FormControl fullWidth>
                                        <FormLabel 
                                            error={errors.emailBody}
                                            required
                                            sx={{paddingBottom:'5px'}}
                                        >
                                            {__('Email Body', 'bookify')}
                                        </FormLabel>
                                        <ReactQuill theme="snow" value={currentForm.emailBody} onChange={(value) => this.handleEmailBody(value)}/>
                                    </FormControl>
                                </Grid>
                                <Grid item>
                                    <FormGroup>
                                        <FormControlLabel name="emailToAdmin" checked={currentForm.emailToAdmin === "true" || currentForm.emailToAdmin === true} control={<Checkbox defaultChecked onChange={this.handleInputChange} />} label="Admin" />
                                        <FormControlLabel name="emailToStaff" checked={currentForm.emailToStaff === "true" || currentForm.emailToStaff === true} control={<Checkbox onChange={this.handleInputChange}/>} label="Staff" />
                                        { currentForm.notificationEvent != 'Staff Created' && (
                                            <FormControlLabel name="emailToCustomer"checked={currentForm.emailToCustomer  === "true" || currentForm.emailToCustomer === true} control={<Checkbox onChange={this.handleInputChange}/>} label="Customer" />
                                        )}
                                    </FormGroup>
                                </Grid>
                                <Grid item>
                                    <Accordion>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{color:"#ffffff"}}/>} sx={{bgcolor:"#036666", borderRadius:"5px"}}>
                                            <Typography sx={{color:"#ffffff"}}>{__('Email Notification Codes', 'bookify')}</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            {EmailCodes.map((code, index) => (
                                                <React.Fragment key={index}>
                                                    <ListItem
                                                        secondaryAction={
                                                            <IconButton
                                                                edge="end"
                                                                onClick={() => this.copyEmailCode(code.primary)}
                                                            >
                                                                <ContentCopyIcon />
                                                            </IconButton>
                                                        }
                                                    >
                                                        <ListItemText
                                                            primary={code.primary}
                                                            secondary={code.secondary}
                                                        />
                                                    </ListItem>
                                                    {index < EmailCodes.length - 1 && <Divider variant="middle" />}
                                                </React.Fragment>
                                            ))}
                                        </AccordionDetails>
                                    </Accordion>
                                </Grid>
                            </Grid>
                        </Box>
                    </DialogContent>

                    <Divider variant="middle" />

                    <DialogActions sx={{ margin: 2 }}>
                        <LoadingButton variant="outlined" onClick={this.AddNotificationDetails} loading={loading}>
                            {notificationId ? __('Update', 'bookify') : __('Save', 'bookify')}
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
        )
    }
}

export default AddNotification;