import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, Box,
    Divider, IconButton, Grid, Accordion, AccordionSummary,
    AccordionDetails, Typography, FormControlLabel, FormControl,
    TextField, Switch, Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockPersonIcon from '@mui/icons-material/LockPerson';
import {SnackbarNotice} from '../../functions';
import LoadingButton from '@mui/lab/LoadingButton';

class IntegrationSettings extends Component { 
    state = { 
        integrationFormData: {
            GoogleClientID: '',
            GoogleClientSecret: '',
        },
        snackbarOpen: false,
        snackbarMessage: '',
        snackbarType: '',
    };

    componentDidUpdate(prevProps) {
        if (prevProps.savedIntegrationSettings !== this.props.savedIntegrationSettings) {
            this.setState({
                integrationFormData: {
                    GoogleClientID: this.props.savedIntegrationSettings.GoogleClientID || '',
                    GoogleClientSecret: this.props.savedIntegrationSettings.GoogleClientSecret || '',
                }
            });
        }
    }

    handleClose = () => this.props.onClose && this.props.onClose();

    handleInputChange = (event) => {
        const { name, value } = event.target;
        this.setState(prevState => ({
            integrationFormData: {
                ...prevState.integrationFormData,
                [name]: value,
            }
        }));
    };

    SaveIntegrationSettings = () => {
        const { integrationFormData } = this.state;
        this.setState({ loading: true });
    
        const dataToSend = new FormData();
        dataToSend.append('GoogleClientID', integrationFormData.GoogleClientID);
        dataToSend.append('GoogleClientSecret', integrationFormData.GoogleClientSecret);
    
        fetch('/wp-json/bookify/v1/save-integration-settings', {
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
        const { integrationFormData, snackbarOpen, snackbarMessage, snackbarType, loading } = this.state;

        return (
            <>
                <Dialog onClose={this.handleClose} open={open} fullWidth={true} maxWidth={'sm'}>
                    <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
                        {__('Integration Settings', 'bookify')}
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
                                    <Accordion defaultExpanded>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{color:"#ffffff"}}/>} sx={{bgcolor:"#036666", borderRadius:"5px"}}>
                                            <Typography sx={{color:"#ffffff"}}>{__('Google Calendar', 'bookify')}</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            {/* <Box component="section" sx={{ p:"0px 10px", mt:"1rem", mb:"1rem", border:"1px dashed #1a84ee", bgcolor:"rgba(26,132,238,.05)"}}>
                                                <FormControl fullWidth size="small" sx={{color:"#354052 !important"}} disabled>
                                                    <FormControlLabel 
                                                        control={<Switch color="primary" />} 
                                                        label={(
                                                            <Typography sx={{color:"#354052"}}>{__('Two-way Sync', 'bookify')}</Typography>
                                                        )}
                                                        labelPlacement="start" 
                                                        sx={{display:"flex", justifyContent:"space-between", ml:"5px"}}
                                                    />
                                                </FormControl>

                                                <Divider/>

                                                <Grid container direction="row" sx={{mt:"1em", mb:"1em", display:"flex", justifyContent:"space-between"}}>
                                                    <Grid item direction="row" sx={{display:"flex"}}>
                                                        <LockPersonIcon fontSize="small"/>
                                                        <Typography sx={{ml:"7px"}}>{__('Available in Pro Version', 'bookify')}</Typography>
                                                    </Grid>
                                                    <Grid item>
                                                        <Button variant="contained" sx={{height:"25px"}}>{__('Upgrade', 'bookify')}</Button>
                                                    </Grid>
                                                </Grid>
                                            </Box> */}
                                            <FormControl fullWidth size="small" sx={{mt:"1rem", mb:"1rem"}}>
                                                <TextField 
                                                    type="text" 
                                                    label={__('Client ID', 'bookify')} 
                                                    name="GoogleClientID" 
                                                    value={integrationFormData.GoogleClientID}
                                                    onChange={this.handleInputChange} 
                                                />
                                            </FormControl>
                                            <FormControl fullWidth size="small" sx={{mt:"1rem", mb:"1rem"}}>
                                                <TextField 
                                                    type="text" 
                                                    label={__('Client Secret', 'bookify')} 
                                                    name="GoogleClientSecret" 
                                                    value={integrationFormData.GoogleClientSecret}
                                                    onChange={this.handleInputChange} 
                                                />
                                            </FormControl>
                                        </AccordionDetails>
                                    </Accordion>
                                </Grid>
                                {/* <Grid item>
                                    <Accordion>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{color:"#ffffff"}}/>} sx={{bgcolor:"#036666", borderRadius:"5px"}}>
                                            <Typography sx={{color:"#ffffff"}}>{__('Outlook Calendar', 'bookify')}</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <Box component="section" sx={{ p:"0px 10px", mt:"1rem", mb:"1rem", border:"1px dashed #1a84ee", bgcolor:"rgba(26,132,238,.05)"}}>
                                                <Grid container direction="row" sx={{mt:"1em", mb:"1em", display:"flex", justifyContent:"space-between"}}>
                                                    <Grid item direction="row" sx={{display:"flex"}}>
                                                        <LockPersonIcon fontSize="small"/>
                                                        <Typography sx={{ml:"7px"}}>{__('Available in Pro Version', 'bookify')}</Typography>
                                                    </Grid>
                                                    <Grid item>
                                                        <Button variant="contained" sx={{height:"25px"}}>{__('Upgrade', 'bookify')}</Button>
                                                    </Grid>
                                                </Grid>
                                            </Box>
                                            <FormControl fullWidth size="small" sx={{color:"#354052 !important"}} disabled>
                                                <FormControlLabel 
                                                    control={<Switch color="primary" />} 
                                                    label={__('Two-way Sync', 'bookify')}
                                                    labelPlacement="start" 
                                                    sx={{display:"flex", justifyContent:"space-between", ml:"5px"}}
                                                />
                                            </FormControl>
                                            <FormControl fullWidth size="small" sx={{mt:"1rem", mb:"1rem"}}>
                                                <TextField 
                                                    type="text" 
                                                    label={__('Client ID', 'bookify')} 
                                                    disabled
                                                />
                                            </FormControl>
                                            <FormControl fullWidth size="small" sx={{mt:"1rem", mb:"1rem"}}>
                                                <TextField 
                                                    type="text" 
                                                    label={__('Client Secret', 'bookify')} 
                                                    disabled
                                                />
                                            </FormControl>
                                        </AccordionDetails>
                                    </Accordion>
                                </Grid> */}
                            </Grid>
                        </Box>
                    </DialogContent>
                    
                    <Divider variant="middle" />

                    <DialogActions sx={{ margin: 2 }}>
                        <LoadingButton variant="outlined" onClick={this.SaveIntegrationSettings} loading={loading}>
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

export default IntegrationSettings;