import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, Box,
    Divider, IconButton, Grid, FormControl, TextField,
    Typography, Badge, Avatar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import {SnackbarNotice} from '../../functions';
import LoadingButton from '@mui/lab/LoadingButton';
import { MuiTelInput } from 'mui-tel-input';

class CompanyDetails extends Component { 
    state = {
        companyFormData: {
            companyName: '',
            address: '',
            phoneNumber: '',
            website: '',
            image: '',
        },
        frame: null,
        snackbarOpen: false,
        snackbarMessage: '',
        snackbarType: '',
        loading: false
    };

    componentDidUpdate(prevProps) {
        if (prevProps.savedCompanyDetails !== this.props.savedCompanyDetails) {
            this.setState({
                companyFormData: {
                    companyName: this.props.savedCompanyDetails.companyName || '',
                    address: this.props.savedCompanyDetails.address || '',
                    phoneNumber: this.props.savedCompanyDetails.phoneNumber || '',
                    website: this.props.savedCompanyDetails.website || '',
                    image: this.props.savedCompanyDetails.image || '',
                }
            });
        }
    }

    handleClose = () => this.props.onClose && this.props.onClose();

    handleCompanyImage = () => {
        if (this.state.frame) {
            this.state.frame.open();
            return;
        }

        const frame = wp.media({
            title: "Select or Upload Company Image",
            button: {
                text: "Upload",
            },
            multiple: false,
        });

        frame.on("select", () => {
            const attachment = frame.state().get("selection").first().toJSON();
            this.setState(prevState => ({
                companyFormData: {
                    ...prevState.companyFormData,
                    'image': attachment.url,
                }
            }));
        });

        frame.open();
        this.setState({ frame });
    };

    handleRemoveImage = () => {
        this.setState(prevState => ({
            companyFormData: {
                ...prevState.companyFormData,
                'image': null,
            }
        }));
    };

    handleInputChange = (event) => {
        const { name, value } = event.target;
        this.setState(prevState => ({
            companyFormData: {
                ...prevState.companyFormData,
                [name]: value,
            }
        }));
    };

    handlePhoneChange = (newphone) => {
        this.setState(prevState => ({
            companyFormData: {
                ...prevState.companyFormData,
                'phoneNumber': newphone,
            }
        }));
    };

    SaveCompanyDetails = () => {
        const { companyFormData } = this.state;
        this.setState({ loading: true });
    
        const dataToSend = new FormData();
        dataToSend.append('companyName', companyFormData.companyName);
        dataToSend.append('address', companyFormData.address);
        dataToSend.append('phoneNumber', companyFormData.phoneNumber);
        dataToSend.append('website', companyFormData.website);
        dataToSend.append('image', companyFormData.image);

        fetch('/wp-json/bookify/v1/save-company-details', {
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
                    loading: false,
                });
                this.handleClose();
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
        const { open } = this.props;
        const { companyFormData, snackbarOpen, snackbarMessage, snackbarType, loading } = this.state;

        return (
            <>
                <Dialog onClose={this.handleClose} open={open} fullWidth={true} maxWidth={'sm'}>
                    <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
                        {__('Company Details', 'bookify')}
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
                                    <Box mt={2} textAlign="-webkit-center">
                                        {companyFormData.image ? (
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
                                                    src={companyFormData.image} 
                                                    onClick={this.handleCompanyImage}
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
                                                onClick={this.handleCompanyImage}
                                            >
                                                <Typography sx={{p:'30px'}}>{__('Click here to upload company image', 'bookify')}</Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Grid>
                                <Grid item>
                                    <FormControl fullWidth>
                                        <TextField 
                                            type="text" 
                                            label={__('Company Name', 'bookify')} 
                                            name="companyName" 
                                            value={companyFormData.companyName}
                                            onChange={this.handleInputChange} 
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid item container spacing={2} justifyContent="space-between">
                                    <Grid item sx={{width:"50%"}}>
                                        <FormControl fullWidth>
                                            <TextField 
                                                type="text" 
                                                label={__('Address', 'bookify')} 
                                                name="address" 
                                                value={companyFormData.address}
                                                onChange={this.handleInputChange} 
                                            />
                                        </FormControl>
                                    </Grid>
                                    <Grid item sx={{width:"50%"}}>
                                        <FormControl fullWidth>
                                            <MuiTelInput
                                                inputProps={{ pattern: '[0-9]*' }}
                                                label={__('Phone Number', 'bookify')}
                                                name="phoneNumber"
                                                value={companyFormData.phoneNumber}
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
                                </Grid>
                                <Grid item>
                                    <FormControl fullWidth>
                                        <TextField 
                                            type="text" 
                                            label={__('Website', 'bookify')} 
                                            placeholder="https://" 
                                            name="website" 
                                            value={companyFormData.website}
                                            onChange={this.handleInputChange} 
                                        />
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Box>
                    </DialogContent>
                    
                    <Divider variant="middle" />

                    <DialogActions sx={{ margin: 2 }}>
                        <LoadingButton variant="outlined" onClick={this.SaveCompanyDetails} loading={loading}>
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

export default CompanyDetails;