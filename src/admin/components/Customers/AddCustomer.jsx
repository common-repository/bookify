import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, Box, 
    Divider, IconButton, Grid, FormControl, TextField,
    Typography, Badge, Avatar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { SnackbarNotice } from '../../functions';
import LoadingButton from '@mui/lab/LoadingButton';
import { MuiTelInput } from 'mui-tel-input';

class AddCustomer extends Component { 
    state = { 
        addFormData: {
            fullName: '',
            phoneNumber: '',
            email: '',
            password: '',
            note: '',
            image: ''
        },
        editFormData: {
            fullName: '',
            phoneNumber: '',
            email: '',
            password: '',
            note: '',
            image: ''
        }, 
        errors: {
            fullName: false,
            phoneNumber: false,
            email: false,
            emailValidation: false,
            password: false,
        },
        frame: null,
        snackbarOpen: false,
        snackbarMessage: '',
        snackbarType: '',
        loading: false
    };

    componentDidUpdate(prevProps) {
        if (this.props.customerId && prevProps.customerId !== this.props.customerId) {
            this.loadCustomerData(this.props.customerId);
        }
    };

    handleClose = () => { this.props.onClose && this.props.onClose() };

    handleInputChange = (event) => {
        const { name, value } = event.target;
        const formState = this.props.customerId ? 'editFormData' : 'addFormData';
        this.setState(prevState => ({
            [formState]: { ...prevState[formState], [name]: value },
            errors: { ...prevState.errors, [name]: false }
        }));
    };

    handlePhoneChange = (newphone) => {
        const formState = this.props.customerId ? 'editFormData' : 'addFormData';
        this.setState(prevState => ({
            [formState]: { ...prevState[formState], 'phoneNumber': newphone },
            errors: { ...prevState.errors, 'phoneNumber': false }
        }));
    };

    handleRemoveImage = () => {
        this.setState(prevState => ({
            [this.props.customerId ? 'editFormData' : 'addFormData']: {
                ...prevState[this.props.customerId ? 'editFormData' : 'addFormData'],
                image: '',
            }
        }));
    };

    handleCustomerImage = () => {
        if (this.state.frame) {
            this.state.frame.open();
            return;
        }

        const frame = wp.media({
            title: "Select or Upload Customer Photo",
            button: {
                text: "Upload",
            },
            multiple: false,
        });

        frame.on("select", () => {
            const attachment = frame.state().get("selection").first().toJSON();
            this.setState(prevState => ({
                [this.props.customerId ? 'editFormData' : 'addFormData']: {
                    ...prevState[this.props.customerId ? 'editFormData' : 'addFormData'],
                    image: attachment.url,
                }
            }));
        });

        frame.open();
        this.setState({ frame });
    }

    loadCustomerData = (customerId) => {
        const customer = this.props.fetchCustomerById(customerId);
        if (customer) {
            this.setState({ 
                editFormData: {
                    fullName: customer.customer_name,
                    email: customer.customer_email,
                    password: '',
                    phoneNumber: customer.customer_phone,
                    note: customer.customer_note,
                    image: customer.customer_img
                }
            });
        }
    }; 

    AddCustomerDetails = () => {
        const { addFormData, editFormData } = this.state;
        const { customerId, fetchCustomerData } = this.props;
        const dataToSend = new FormData();

        const currentForm = customerId ? editFormData : addFormData;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const errors = {
            fullName: !currentForm.fullName,
            email: !currentForm.email,
            emailValidation: !emailRegex.test(currentForm.email),
            phoneNumber: !currentForm.phoneNumber,
        };

        if ( !customerId ) {
            errors.password = !currentForm.password;
        }

        this.setState({ errors });

        if ( errors.fullName || errors.email || errors.emailValidation || errors.phoneNumber || (!customerId && errors.password) ) {
            return;
        }

        this.setState({ loading: true });

        if (customerId) {
            dataToSend.append('customer_id', customerId);
        }
        dataToSend.append('customer_fullname', currentForm.fullName);
        dataToSend.append('customer_phone', currentForm.phoneNumber);
        dataToSend.append('customer_email', currentForm.email);
        dataToSend.append('customer_password', currentForm.password);
        dataToSend.append('customer_note', currentForm.note);
        dataToSend.append('customer_img', currentForm.image);

        const endpoint = customerId ? `/wp-json/bookify/v1/update-customer` : `/wp-json/bookify/v1/add-customer`;

        fetch(endpoint, { 
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
                    addFormData: {
                        fullName: '',
                        phoneNumber: '',
                        email: '',
                        password: '',
                        note: '',
                        image: ''
                    },
                    errors: { fullName: false, email: false, password: false, phoneNumber: false },
                    snackbarOpen: true,
                    snackbarMessage: response.message,
                    snackbarType: 'success',
                    loading: false,
                });
                fetchCustomerData();
                this.handleClose();
            } else {
                this.setState({ 
                    snackbarOpen: true,
                    snackbarMessage: response.message,
                    snackbarType: 'error',
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
        const { open, customerId } = this.props;
        const { addFormData, editFormData, errors, snackbarOpen, snackbarMessage, snackbarType, loading } = this.state;
        const currentForm = customerId ? editFormData : addFormData;

        return (
            <>
                <Dialog onClose={this.handleClose} open={open} fullWidth={true} maxWidth={'sm'}>
                    <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
                        {customerId ? __('Edit Customer', 'bookify') : __('Add Customer', 'bookify')}
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
                                    <Box mt={2} textAlign="-webkit-center">
                                        {currentForm.image ? (
                                            <Badge
                                                overlap="circular"
                                                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                                                badgeContent={
                                                    <IconButton onClick={this.handleRemoveImage} color={'error'}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                }
                                            >
                                                <Avatar 
                                                    alt="Staff image" 
                                                    sx={{
                                                        width: '12rem',
                                                        height: '12rem',
                                                        border:"2px solid #ccc"
                                                    }} 
                                                    src={currentForm.image} 
                                                    onClick={this.handleCustomerImage}
                                                />
                                            </Badge>
                                        ) : (
                                            <Box 
                                                border="2px dashed #ccc" 
                                                textAlign="center" 
                                                sx={{
                                                    width: '12rem', 
                                                    height: '12rem', 
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                                onClick={this.handleCustomerImage}
                                            >
                                                <Typography sx={{p:'30px'}}>{__('Click here to upload customer image', 'bookify')}</Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Grid>
                                <Grid item>
                                    <FormControl fullWidth>
                                        <TextField 
                                            error={errors.fullName}
                                            required
                                            type="text" 
                                            label={__('Full Name', 'bookify')} 
                                            name="fullName" 
                                            value={currentForm.fullName}
                                            onChange={this.handleInputChange} 
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid item container spacing={2} justifyContent="space-between">
                                    <Grid item sx={{width:"50%"}}>
                                        <FormControl fullWidth>
                                            <MuiTelInput
                                                error={errors.phoneNumber}
                                                required
                                                inputProps={{ pattern: '[0-9]*' }}
                                                label={__('Phone Number', 'bookify')}
                                                name="phoneNumber"
                                                value={currentForm.phoneNumber}
                                                onChange={this.handlePhoneChange}
                                                defaultCountry="US"
                                                sx={{
                                                    '& input[type=number]::-webkit-outer-spin-button': {
                                                        WebkitAppearance: 'none',
                                                        margin: 0,
                                                    },
                                                    '& input[type=number]::-webkit-inner-spin-button': {
                                                        WebkitAppearance: 'none',
                                                        margin: 0,
                                                    },
                                                    '.MuiInputBase-input': {
                                                        pl: '0px'
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                    </Grid>
                                    <Grid item sx={{width:"50%"}}>
                                        <FormControl fullWidth>
                                            <TextField 
                                                error={errors.email || errors.emailValidation}
                                                helperText={errors.emailValidation && __('Please enter a valid email', 'bookify')}
                                                required
                                                type="email" 
                                                label={__('Email', 'bookify')} 
                                                name="email" 
                                                value={currentForm.email}
                                                onChange={this.handleInputChange} 
                                                sx={{
                                                    '.MuiFormHelperText-root': {
                                                        ml:'0px',
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                    </Grid>
                                </Grid>
                                <Grid item>
                                    <FormControl fullWidth>
                                        <TextField 
                                            error={!customerId && errors.password}
                                            required={!customerId}
                                            type="password" 
                                            label={__('Password', 'bookify')} 
                                            name="password" 
                                            value={currentForm.password}
                                            onChange={this.handleInputChange} 
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid item>
                                    <FormControl fullWidth>
                                        <TextField
                                            multiline
                                            rows={4}
                                            label={__('Note', 'bookify')}
                                            name="note"
                                            value={currentForm.note}
                                            onChange={this.handleInputChange}
                                        />
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Box>
                    </DialogContent>
                    
                    <Divider variant="middle" />

                    <DialogActions sx={{ margin: 2 }}>
                        <LoadingButton variant="outlined" onClick={this.AddCustomerDetails} loading={loading}>
                            {customerId ? __('Update', 'bookify') : __('Save', 'bookify')}
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

export default AddCustomer;
