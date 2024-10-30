import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import {
    Box, Grid, Accordion, AccordionSummary, Typography,
    AccordionDetails, Checkbox, TextField, FormControlLabel,
    InputAdornment
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import currencies from '../../currencies.json';

class ServiceDetailsForm extends Component {
    state = {
        serviceData: {}
    }

    componentDidMount() {
        const { formData } = this.props;
        if ( formData ) {
            this.setState({ serviceData: this.props.formData });
        }
    }

    handleCheckboxChange = (serviceId, servicePrice, event) => {
        const { checked } = event.target;
        this.setState(prevState => {
            const updatedServiceData = { ...prevState.serviceData };
            if (!updatedServiceData[serviceId]) {
                updatedServiceData[serviceId] = {};
            }
            if (!updatedServiceData[serviceId].price || updatedServiceData[serviceId].price.length === 0) {
                updatedServiceData[serviceId].price = servicePrice;
            }
            updatedServiceData[serviceId].checked = checked;
            this.props.handleServiceData(updatedServiceData);
            return { serviceData: updatedServiceData };
        });
    }

    handleInputChange = (serviceId, servicePrice, event) => {
        const { value } = event.target;
        this.setState(prevState => {
            const updatedServiceData = { ...prevState.serviceData };
            if (!updatedServiceData[serviceId]) {
                updatedServiceData[serviceId] = {};
            }
            if (!updatedServiceData[serviceId].checked || updatedServiceData[serviceId].checked.length === 0) {
                updatedServiceData[serviceId].checked = false;
            }
            updatedServiceData[serviceId].price = Math.abs(value) || servicePrice;
            this.props.handleServiceData(updatedServiceData);
            return { serviceData: updatedServiceData };
        });
    }

    render() {
        const { services, currency } = this.props;
        const { serviceData } = this.state;
        const matchedCurrency = Object.values(currencies).find(eachCurrency => eachCurrency.code === currency);

        return (
            <Box component="form">
                <Grid container spacing={3} direction="column">
                    {services.length === 0 ? (
                        <Grid item>
                            <Typography>{__('No service(s) to select!', 'bookify')}</Typography>
                        </Grid>
                    ) : (
                        services.map((category) => (
                            <Grid item key={category.id}>
                                <Accordion defaultExpanded>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#ffffff" }} />} sx={{ bgcolor: "#036666", borderRadius: "5px" }}>
                                        <Typography sx={{ color: "#ffffff" }}>{category.category_name}</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Grid container spacing={3}>
                                            {category.services.map((service) => (
                                                <Grid item direction="column" key={service.id}>
                                                    <Box
                                                        sx={{
                                                            border: '1px solid #036666',
                                                            padding: 2,
                                                            borderRadius: 2,
                                                            width: "13rem",
                                                        }}
                                                    >
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    checked={serviceData[service.id]?.checked || false}
                                                                    onChange={this.handleCheckboxChange.bind(this, service.id, service.service_price)}
                                                                />
                                                            }
                                                            label={<Typography sx={{ width: '11rem', textWrap: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{service.service_name}</Typography>}
                                                        />
                                                        <TextField
                                                            type="number"
                                                            name="staffServicePrice"
                                                            label={__('Price', 'bookify')}
                                                            value={serviceData[service.id]?.price || service.service_price}
                                                            onChange={this.handleInputChange.bind(this, service.id, service.service_price)}
                                                            InputProps={{
                                                                startAdornment: (
                                                                    <InputAdornment position="start">
                                                                        {matchedCurrency.symbol}
                                                                    </InputAdornment>
                                                                )
                                                            }}
                                                            inputProps={{
                                                                min: 0
                                                            }}
                                                            sx={{
                                                                marginTop: "1rem",
                                                                '& input[type=number]::-webkit-outer-spin-button': {
                                                                    WebkitAppearance: 'none',
                                                                    margin: 0,
                                                                },
                                                                '& input[type=number]::-webkit-inner-spin-button': {
                                                                    WebkitAppearance: 'none',
                                                                    margin: 0,
                                                                },
                                                                '.MuiInputBase-input': {
                                                                    p: '10px 10px 10px 0px',
                                                                }
                                                            }}
                                                        />
                                                    </Box>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </AccordionDetails>
                                </Accordion>
                            </Grid>
                        ))
                    )}
                </Grid>
            </Box>
        );
    }
}

export default ServiceDetailsForm;
