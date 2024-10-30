import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { 
    Box, Grid, Typography, Button, TextField,
    InputAdornment, FormControl, Chip, InputLabel,
    Select, MenuItem
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import currencies from '../../currencies.json';
import { SnackbarNotice, ConfirmationDialog } from '../../functions';
import LoadingButton from '@mui/lab/LoadingButton';

class PaymentDetails extends Component {

    state = {
        buttonDisable: false,
        showPaymentForm: false,
        allPayments: [],
        addFormData: {
            paymentPrice: 1,
            paymentPaid: '',
            paymentDue: '',
            paymentMethod: 'On Site',
            paymentStatus: 'Pending'
        },
        errors: {
            paymentPrice: false,
            paymentStatus: false
        },
        statuses: [
            "Pending",
            "Paid",
            "Partially Paid",
        ],
        confirmationDialogOpen: false,
        confirmationLoading: false,
        PaymentToDelete: null,
        loading: false,
    }

    componentDidMount() {
        this.fetchPaymentByAppointment();
    }

    fetchPaymentByAppointment = () => {
        const { editFormData } = this.props;

        fetch(`/wp-json/bookify/v1/appointment-payment?id=${editFormData.appointment_id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': wpApiSettings.nonce
            }
        })
        .then((response) => response.json())
        .then((data) => {

            const allPayments = data.data;
            const totalPaid = allPayments.reduce((sum, payment) => sum + parseFloat(payment.payment_paid), 0);
            const paymentTotal = editFormData.appointment_price > 0 ? parseFloat( editFormData.appointment_price ) : 0;
            const paymentDue = paymentTotal - totalPaid;
            let restrictAddPayment;
            if ( paymentDue != 0 ) {
                restrictAddPayment = false;
            } else {
                restrictAddPayment = true;
            }

            this.setState(prevState => ({
                addFormData: {
                    ...prevState.addFormData,
                    paymentPrice: paymentDue,
                    paymentDue: paymentDue
                },
                allPayments: allPayments,
                buttonDisable: restrictAddPayment
            }));
        })
        .catch(error => {
            console.error('Error:', error);
        })
    };

    handleInputChange = (event) => {
        const { name, value } = event.target;
        const { editFormData } = this.props;
        const { addFormData } = this.state;

        if ( name === 'paymentPrice' ) {
            const numericValue = parseFloat( value );
            const maxValue = addFormData.paymentDue ? parseFloat( addFormData.paymentDue ) : parseFloat( editFormData.appointment_price );
            if ( numericValue < 0 || numericValue > maxValue ) {
                return;
            }
        }

        this.setState(prevState => ({
            addFormData: {
                ...prevState.addFormData,
                [name]: value,
            },
            errors: { ...prevState.errors, [name]: false }
        }));
    };

    handleAddPayment = () => {
        this.setState({ 
            buttonDisable: true, 
            showPaymentForm: true 
        });
    };

    handlePaymentSave = () => {
        const { addFormData } = this.state;
        const { editFormData } = this.props;

        const errors = {
            paymentPrice: !addFormData.paymentPrice,
        };

        this.setState({ errors });

        if ( errors.paymentPrice ) {
            return;
        }

        this.setState({ loading: true });

        const paymentToBePaid = addFormData.paymentDue - addFormData.paymentPrice;

        const dataToSend = new FormData();
        dataToSend.append('appointment_id', editFormData.appointment_id);
        dataToSend.append('appointment_total', editFormData.appointment_price);
        dataToSend.append('payment_price', addFormData.paymentPrice);
        dataToSend.append('payment_due', paymentToBePaid);
        dataToSend.append('payment_method', addFormData.paymentMethod);
        dataToSend.append('payment_status', addFormData.paymentStatus);

        fetch('/wp-json/bookify/v1/add-payment', {
            method: 'POST',
            headers: {
                'X-WP-Nonce': wpApiSettings.nonce
            },
            body: dataToSend,
        })
        .then(response => response.json())
        .then(response => {
            if ( response.success ) {
                this.setState({ 
                    snackbarOpen: true,
                    snackbarMessage: response.message,
                    snackbarType: 'success',
                    loading: false,
                    showPaymentForm: false,
                    addFormData: {
                        paymentPrice: 1,
                        paymentMethod: 'On Site',
                        paymentStatus: 'Pending'
                    },
                });
                this.fetchPaymentByAppointment();
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
    }

    handleDeleteAddPayment = () => {
        this.setState(prevState => ({
            addFormData: {
                ...prevState.addFormData,
                paymentPrice: 1,
                paymentStatus: 'Pending'
            },
            buttonDisable: false, 
            showPaymentForm: false,
        }));
    }

    handlePaymentDelete = (payment) => {
        this.setState({ confirmationDialogOpen: true, PaymentToDelete: payment });
    };

    confirmationPaymentDelete = () => {
        const { PaymentToDelete } = this.state;
        this.setState({ confirmationLoading: true });
        
        const dataToSend = new FormData();
        dataToSend.append('payment_id', PaymentToDelete.id);
        dataToSend.append('total_amount', PaymentToDelete.payment_total);
        dataToSend.append('appointment_id', PaymentToDelete.appointment_id);

        fetch(`/wp-json/bookify/v1/delete-payment`, {
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
                    PaymentToDelete: null,
                    snackbarOpen: true,
                    snackbarMessage: response.message,
                    snackbarType: 'success',
                });
                this.fetchPaymentByAppointment();
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
            console.error('Error:', error);
            this.setState({ confirmationLoading: false });
        })
    }
    

    render() {
        const { currency, editFormData } = this.props;
        const { buttonDisable, showPaymentForm, allPayments, statuses, addFormData, errors, snackbarOpen, snackbarMessage, snackbarType, confirmationDialogOpen, confirmationLoading, loading } = this.state;
        const matchedCurrency = Object.values(currencies).find(eachCurrency => eachCurrency.code === currency);

        return(
            <>
                <Box component="form">
                    <Grid container spacing={3} direction="row" justifyContent="space-between" alignItems="center">
                        <Grid item xs={5}>
                            <Typography
                                variant='h6'
                                sx={{
                                    textTransform: 'capitalize',
                                }}
                            >
                                {__('Payments', 'bookify')}
                            </Typography>
                        </Grid>
                        <Grid item xs={5} sx={{display:"flex", flexDirection:"column", alignItems:"flex-end"}}>
                            <Button variant="contained" disabled={buttonDisable} onClick={this.handleAddPayment}
                                sx={{
                                    backgroundColor:"#ff6c22",
                                    '&:hover': {
                                        backgroundColor:"#db6e38",
                                    }
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: '13px',
                                        lineHeight: '24px',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    {__('Add Payment', 'bookify')}
                                </Typography>
                            </Button>
                        </Grid>
                    </Grid>
                    {allPayments.map((payment) => (
                        <Grid container spacing={2} direction="row" justifyContent="space-between" alignItems="flex-end"
                            sx={{
                                border: "1px solid #ffffff", 
                                backgroundColor: "#f9f9f9",
                                borderRadius: '5px',
                                padding: "15px", 
                                mt: "unset", 
                                ml: "unset",
                                mt: "2rem",
                                width: "100%"
                            }}
                        >
                            <Grid item md={6} sx={{pl:"unset !important", pt:"unset !important", display:"flex", justifyContent:"space-between"}}>
                                <Box component={'span'}>
                                    <Typography variant='subtitle2'sx={{textTransform:'capitalize', lineHeight:'24px'}}>
                                        {__('Payment Method: ', 'bookify')}
                                    </Typography>
                                    <Typography variant='subtitle2'sx={{textTransform:'capitalize', lineHeight:'24px'}}>
                                        {__('Payment Status: ', 'bookify')}
                                    </Typography>
                                    <Typography variant='subtitle2'sx={{textTransform:'capitalize', lineHeight:'24px'}}>
                                        {__('Paid: ', 'bookify')}
                                    </Typography>
                                    <Typography variant='subtitle2'sx={{textTransform:'capitalize', lineHeight:'24px'}}>
                                        {__('Due: ', 'bookify')}
                                    </Typography>
                                    <Typography variant='subtitle2'sx={{textTransform:'capitalize', lineHeight:'24px', fontWeight:'600'}}>
                                        {__('Total: ', 'bookify')}
                                    </Typography>
                                </Box>
                                <Box component={'span'} sx={{width:'5rem'}}>
                                    <Typography variant='body1' sx={{fontSize:'13px', lineHeight:'24px'}}>
                                        {payment.payment_method}
                                    </Typography>
                                    <Typography variant='body1' sx={{fontSize:'13px', lineHeight:'24px'}}>
                                        {payment.payment_status}
                                    </Typography>
                                    <Typography variant='body1' sx={{fontSize:'13px', lineHeight:'24px'}}>
                                        {`${matchedCurrency.symbol} ${payment.payment_paid}` }
                                    </Typography>
                                    <Typography variant='body1' sx={{fontSize:'13px', lineHeight:'24px'}}>
                                        {`${matchedCurrency.symbol} ${payment.payment_due}`}
                                    </Typography>
                                    <Typography variant='body1' sx={{fontSize:'13px', lineHeight:'24px', fontWeight:'600'}}>
                                        {`${matchedCurrency.symbol} ${payment.payment_total}`}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item md={4} sx={{pl:"unset !important", pt:"unset !important"}}>
                                    <Grid container spacing={3} direction="row" justifyContent="space-between" alignItems="center">
                                        <Grid item md={12} sx={{display:"flex", flexDirection:"column", alignItems:"flex-end"}}>
                                            <Chip
                                                label="Delete Payment"
                                                onClick={() => this.handlePaymentDelete( payment )}
                                                onDelete={() => this.handlePaymentDelete( payment )}
                                                deleteIcon={<DeleteIcon />}
                                                variant="outlined"
                                                color="error"
                                            />
                                        </Grid>
                                    </Grid>
                                </Grid>
                        </Grid>
                    ))}
                    {showPaymentForm && (
                        <Grid container spacing={3} direction="row" justifyContent="space-between" alignItems="flex-end" 
                            sx={{
                                border: "1px solid #036666", 
                                borderRadius: '5px',
                                padding: "15px", 
                                mt: "unset", 
                                ml: "unset",
                                mt: "2rem",
                                width: "100%"
                            }}
                        >
                            <Grid item md={4} sx={{pl:"unset !important", pt:"unset !important"}}>
                                <TextField
                                    fullWidth
                                    error={errors.paymentPrice}
                                    required
                                    type="number"
                                    name="paymentPrice"
                                    label={__('Price', 'bookify')}
                                    value={addFormData.paymentPrice}
                                    onChange={this.handleInputChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                {matchedCurrency.symbol}
                                            </InputAdornment>
                                        ),
                                    }}
                                    inputProps={{
                                        min: 0,
                                        max: addFormData.paymentDue ? addFormData.paymentDue : editFormData ? parseInt( editFormData.appointment_price ) : ''
                                    }}
                                    sx={{
                                        marginTop: "1rem",
                                        '& input[type=number]': {
                                            padding: '10px',
                                            fontSize: '15px'
                                        },
                                        '& input[type=number]::-webkit-outer-spin-button': {
                                            WebkitAppearance: 'none',
                                            margin: 0,
                                        },
                                        '& input[type=number]::-webkit-inner-spin-button': {
                                            WebkitAppearance: 'none',
                                            margin: 0,
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid item md={4} sx={{pl:"unset !important", pt:"unset !important"}}>
                                <FormControl fullWidth>
                                    <InputLabel id="payment-status" required error={errors.paymentStatus}>{__('Status', 'bookify')}</InputLabel>
                                    <Select
                                        error={errors.paymentStatus}
                                        required
                                        labelId="payment-status"
                                        label={__('Status', 'bookify')} 
                                        name="paymentStatus"
                                        value={addFormData.paymentStatus}
                                        onChange={this.handleInputChange}
                                        sx={{
                                            '& .MuiSelect-select': {
                                                padding: '10px 15px',
                                                fontSize: '15px'
                                            },
                                        }}
                                    >
                                        {statuses.map((value) => (
                                            <MenuItem key={value} value={value}>
                                                {value}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item md={3} sx={{pl:"unset !important", display:"flex", flexDirection:"column", alignItems:"stretch"}}>
                                <LoadingButton variant="outlined" sx={{float:"right", padding:"8px 15px"}} onClick={this.handlePaymentSave} loading={loading}>
                                    {__('Save', 'bookify')}
                                </LoadingButton>
                            </Grid>
                            <Grid item xs={12} mt={1}>
                                <Grid container spacing={3} direction="row" justifyContent="space-between" alignItems="center">
                                    <Grid item md={12} sx={{display:"flex", flexDirection:"column", alignItems:"flex-end"}}>
                                        <Chip
                                            label="Remove"
                                            onClick={() => this.handleDeleteAddPayment()}
                                            onDelete={() => this.handleDeleteAddPayment()}
                                            deleteIcon={<DeleteIcon />}
                                            variant="outlined"
                                            color="error"
                                        />
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    )}
                </Box>
                <SnackbarNotice
                    state={this.state}
                    setState={this.setState.bind(this)}
                    open={snackbarOpen}
                    message={snackbarMessage}
                    type={snackbarType}
                />
                <ConfirmationDialog
                    open={confirmationDialogOpen}
                    onClose={() => this.setState({ confirmationDialogOpen: false, PaymentToDelete: null })}
                    onConfirm={this.confirmationPaymentDelete}
                    loading={confirmationLoading}
                />
            </>
        )
    }
}

export default PaymentDetails;
