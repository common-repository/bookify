import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, Box,
    Divider, IconButton, Grid, Accordion, AccordionSummary,
    AccordionDetails, Typography, Button, FormControl, FormControlLabel,
    Switch
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockPersonIcon from '@mui/icons-material/LockPerson';
import {SnackbarNotice} from '../../functions';
import LoadingButton from '@mui/lab/LoadingButton';

class PaymentDetails extends Component { 
    state = { 
        paymentGateways: {
            onsite: {
                toggled: true,
            },
            paypal: {
                toggled: false,
                clientId: '',
                secretKey: '',
            },
            stripe: {
                toggled: false,
                publishableKey: '',
                secretKey: '',
            },
        }, 
        errors: {
            paypalCI: false,
            paypalSK: false,
            stripePK: false,
            stripeSK: false
        },
        snackbarOpen: false,
        snackbarMessage: '',
        snackbarType: '',
        loading: false
    };

    componentDidUpdate(prevProps) {
        if ( this.props.savedPaymentDetails && ( prevProps.savedPaymentDetails !== this.props.savedPaymentDetails ) ) {
            this.setState({
                paymentGateways: JSON.parse( this.props.savedPaymentDetails )
            });
        }
    }

    handleClose = () => this.props.onClose && this.props.onClose();

    handlePaymentChange = (event) => {
        const { name, type, checked, value } = event.target;
        const dataKey = event.target.getAttribute('data-key');

        let errors = { ...this.state.errors };
        if ( name === 'paypal' && dataKey === 'clientId' && value ) {
            errors.paypalCI = false;
        } else if ( name === 'paypal' && dataKey === 'secretKey' && value ) {
            errors.paypalSK = false;
        } else if ( name === 'stripe' && dataKey === 'publishableKey' && value ) {
            errors.stripePK = false;
        } else if ( name === 'stripe' && dataKey === 'secretKey' && value ) {
            errors.stripeSK = false;
        }

        this.setState(prevState => ({
            paymentGateways: {
                ...prevState.paymentGateways,
                [name]: {
                    ...prevState.paymentGateways[name],
                    [dataKey]: type === 'checkbox' ? checked : value,
                },
            },
            errors: errors,
        }));
    };

    SavePaymentSettings = () => {
        const { paymentGateways } = this.state;

        const errors = {
            paypalCI: paymentGateways.paypal.toggled && !paymentGateways.paypal.clientId,
            paypalSK: paymentGateways.paypal.toggled && !paymentGateways.paypal.secretKey,
            stripePK: paymentGateways.stripe.toggled && !paymentGateways.stripe.publishableKey,
            stripeSK: paymentGateways.stripe.toggled && !paymentGateways.stripe.secretKey,
        };
    
        this.setState({ errors });

        if ( errors.paypalCI || errors.paypalSK || errors.stripePK || errors.stripeSK ) {
            return;
        }

        this.setState({ loading: true });
    
        const dataToSend = new FormData();
        dataToSend.append('payment_gateways', JSON.stringify( paymentGateways ));
    
        fetch('/wp-json/bookify/v1/save-payment-settings', {
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
        const { paymentGateways, errors, snackbarOpen, snackbarMessage, snackbarType, loading } = this.state;

        const ProPaymentDetails = window.ProPaymentDetails;

        return (
            <>
                <Dialog onClose={this.handleClose} open={open} fullWidth={true} maxWidth={'sm'}>
                    <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
                        {__('Payment Settings', 'bookify')}
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
                                            <Typography sx={{color:"#ffffff"}}>{__('Payment On Site', 'bookify')}</Typography>
                                        </AccordionSummary>
                                        {ProPaymentDetails ? 
                                            <AccordionDetails>
                                                <FormControl fullWidth size="small" sx={{color:"#354052 !important"}} disabled={!ProPaymentDetails}>
                                                    <FormControlLabel 
                                                        control={<Switch defaultChecked color="primary" />} 
                                                        label={(
                                                            <Box sx={{display: "flex", alignItems: "center"}}>
                                                                <Typography sx={{color:"#354052"}}>{__('On Site', 'bookify')}</Typography>
                                                            </Box>
                                                        )}
                                                        labelPlacement="end" 
                                                        name={'onsite'}
                                                        value={paymentGateways.onsite.toggled}
                                                        onChange={this.handlePaymentChange}
                                                        sx={{ml:"5px"}}
                                                    />
                                                </FormControl>
                                            </AccordionDetails>
                                        : 
                                            <AccordionDetails>
                                                <Box component="section" sx={{ p:"0px 10px", mt:"1rem", mb:"1rem", border:"1px dashed #1a84ee", bgcolor:"rgba(26,132,238,.05)"}}>
                                                    <FormControl fullWidth size="small" sx={{color:"#354052 !important"}} disabled>
                                                        <FormControlLabel  
                                                            control={
                                                                <Switch defaultChecked color="primary" 
                                                                    sx={{
                                                                        '& input': {
                                                                            border:'none', 
                                                                            height:'0px'
                                                                        },
                                                                    }}
                                                                />
                                                            }
                                                            label={(
                                                                <Box sx={{display: "flex", alignItems: "center"}}>
                                                                    <Typography sx={{color:"#354052"}}>{__('On Site', 'bookify')}</Typography>
                                                                </Box>
                                                            )}
                                                            labelPlacement="end" 
                                                            sx={{ml:"5px"}}
                                                        />
                                                    </FormControl>

                                                    <Divider/>

                                                    <Grid container direction="row" sx={{mt:"1em", mb:"1em", display:"flex", justifyContent:"space-between"}}>
                                                        <Grid item direction="row" sx={{display:"flex"}}>
                                                            <Typography sx={{ml:"7px"}}>{__('Offline payment is the default method for the free version.', 'bookify')}</Typography>
                                                        </Grid>
                                                    </Grid>
                                                </Box>
                                            </AccordionDetails>
                                        }
                                    </Accordion>
                                </Grid>
                                {ProPaymentDetails ? 
                                    <ProPaymentDetails 
                                        state={this.state}
                                        setState={this.setState.bind(this)}
                                        errors={errors}
                                        handlePaymentChange={this.handlePaymentChange}
                                    /> 
                                : 
                                    <>
                                    <Grid item>
                                        <Accordion>
                                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{color:"#ffffff"}}/>} sx={{bgcolor:"#036666", borderRadius:"5px"}}>
                                                <Typography sx={{color:"#ffffff"}}>{__('Payment with Paypal', 'bookify')}</Typography>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <Box component="section" sx={{ p:"0px 10px", mt:"1rem", mb:"1rem", border:"1px dashed #1a84ee", bgcolor:"rgba(26,132,238,.05)"}}>
                                                    <FormControl fullWidth size="small" sx={{color:"#354052 !important"}} disabled>
                                                        <FormControlLabel 
                                                            control={
                                                                <Switch color="primary" 
                                                                    sx={{
                                                                        '& input': {
                                                                            border:'none', 
                                                                            height:'0px'
                                                                        },
                                                                    }}
                                                                />
                                                            } 
                                                            label={(
                                                                <Box sx={{display: "flex", alignItems: "center"}}>
                                                                    <Typography sx={{color:"#354052"}}>{__('Paypal', 'bookify')}</Typography>
                                                                </Box>
                                                            )}
                                                            labelPlacement="end" 
                                                            sx={{ml:"5px"}}
                                                        />
                                                    </FormControl>

                                                    <Divider/>

                                                    <Grid container direction="row" sx={{mt:"1em", mb:"1em", display:"flex", justifyContent:"space-between"}}>
                                                        <Grid item direction="row" sx={{display:"flex"}}>
                                                            <LockPersonIcon fontSize="small"/>
                                                            <Typography sx={{ml:"7px"}}>{__('Available in Pro Version', 'bookify')}</Typography>
                                                        </Grid>
                                                        <Grid item>
                                                            <Button 
                                                                variant="contained" 
                                                                href={'https://wpbookify.com/pricing'}
                                                                component="a"
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                sx={{
                                                                    height:"25px",
                                                                    '&:hover': {
                                                                        backgroundColor: '#539ff5',
                                                                        color: '#FFFFFF',
                                                                    },
                                                                }}
                                                            >
                                                                    {__('Upgrade', 'bookify')}
                                                            </Button>
                                                        </Grid>
                                                    </Grid>
                                                </Box>
                                            </AccordionDetails>
                                        </Accordion>
                                    </Grid>
                                    <Grid item>
                                        <Accordion>
                                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{color:"#ffffff"}}/>} sx={{bgcolor:"#036666", borderRadius:"5px"}}>
                                                <Typography sx={{color:"#ffffff"}}>{__('Payment with Stripe', 'bookify')}</Typography>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <Box component="section" sx={{ p:"0px 10px", mt:"1rem", mb:"1rem", border:"1px dashed #1a84ee", bgcolor:"rgba(26,132,238,.05)"}}>
                                                    <FormControl fullWidth size="small" sx={{color:"#354052 !important"}} disabled>
                                                        <FormControlLabel 
                                                            control={
                                                                <Switch color="primary" 
                                                                    sx={{
                                                                        '& input': {
                                                                            border:'none', 
                                                                            height:'0px'
                                                                        },
                                                                    }}
                                                                />
                                                            } 
                                                            label={(
                                                                <Box sx={{display: "flex", alignItems: "center"}}>
                                                                    <Typography sx={{color:"#354052"}}>{__('Stripe', 'bookify')}</Typography>
                                                                </Box>
                                                            )}
                                                            labelPlacement="end" 
                                                            sx={{ml:"5px"}}
                                                        />
                                                    </FormControl>

                                                    <Divider/>

                                                    <Grid container direction="row" sx={{mt:"1em", mb:"1em", display:"flex", justifyContent:"space-between"}}>
                                                        <Grid item direction="row" sx={{display:"flex"}}>
                                                            <LockPersonIcon fontSize="small"/>
                                                            <Typography sx={{ml:"7px"}}>{__('Available in Pro Version', 'bookify')}</Typography>
                                                        </Grid>
                                                        <Grid item>
                                                            <Button 
                                                                variant="contained" 
                                                                href={'https://wpbookify.com/pricing'}
                                                                component="a"
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                sx={{
                                                                    height:"25px",
                                                                    '&:hover': {
                                                                        backgroundColor: '#539ff5',
                                                                        color: '#FFFFFF',
                                                                    },
                                                                }}
                                                            >
                                                                    {__('Upgrade', 'bookify')}
                                                            </Button>
                                                        </Grid>
                                                    </Grid>
                                                </Box>
                                            </AccordionDetails>
                                        </Accordion>
                                    </Grid>
                                    </>
                                }
                            </Grid>
                        </Box>
                    </DialogContent>
                    
                    <Divider variant="middle" />

                    <DialogActions sx={{ margin: 2 }}>
                        <LoadingButton variant="outlined" onClick={this.SavePaymentSettings} loading={loading}>
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

export default PaymentDetails;
