import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, Divider,
    IconButton, Grid, FormControl, TextField, InputLabel,
    Select, MenuItem, Box, Typography, Badge, Avatar,
    InputAdornment, OutlinedInput, Chip, Autocomplete
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import {SnackbarNotice} from '../../functions';
import currencies from '../../currencies.json';
import LoadingButton from '@mui/lab/LoadingButton';

class AddService extends Component { 
    state = { 
        allLocations: [],
        snackbarOpen: false,
        snackbarMessage: '',
        snackbarType: 'success',
        loading: false,
        addFormData: {
            serviceName: '',
            price: '',
            category: 'None',
            location: [],
            image: '',
            note: '',
        },
        editFormData: {
            serviceName: '',
            price: '',
            category: '',
            location: [],
            image: '',
            note: '',
        },
        errors: { 
            serviceName: false,
            price: false,
            category: false,
        },
    };

    componentDidMount() {
        const ProLocation = window.ProLocation;

        if ( ProLocation ) {
            this.fetchLocationData();
        }
    }

    componentDidUpdate(prevProps) {
        if (this.props.serviceId && prevProps.serviceId !== this.props.serviceId) {
            this.loadServiceData(this.props.serviceId);
        }
    }

    handleClose = () => this.props.onClose && this.props.onClose();

    fetchLocationData = () => {
        fetch(`/wp-json/bookify/v1/get-locations`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': wpApiSettings.nonce
            }
        })
        .then((response) => response.json())
        .then((data) => {
            this.setState({
                allLocations: data.locations,
            });
        })
        .catch((error) => {
            console.error('Error fetching data:', error);
        });
    };

    handleInputChange = ({ target: { name, value } }) => {
        const formState = this.props.serviceId ? 'editFormData' : 'addFormData';
        this.setState(prevState => ({
            [formState]: { ...prevState[formState], [name]: value },
            errors: { ...prevState.errors, [name]: false }
        }));
    };

    handleLocationChange = (event, value) => {
        const formState = this.props.serviceId ? 'editFormData' : 'addFormData';
        this.setState(prevState => ({
            [formState]: { ...prevState[formState], location: value },
            errors: { ...prevState.errors, location: [] }
        })); 
    };

    loadServiceData = (serviceId) => {
        const service = this.props.fetchServiceById(serviceId);
        if (service) {
            const serviceLocationIds = service.service_location ? service.service_location : [];
            const selectedLocations = this.state.allLocations.filter(loc => serviceLocationIds.includes(loc.id));
    
            this.setState({ 
                editFormData: { 
                    serviceName: service.service_name, 
                    price: service.service_price,
                    category: service.service_category,
                    location: selectedLocations,
                    image: service.service_img,
                    note: service.service_note,
                } 
            });
        }
    };  

    handleServiceSubmit = () => {
        const { addFormData, editFormData } = this.state;
        const { serviceId, fetchServiceData } = this.props;
        const dataToSend = new FormData();

        const currentForm = serviceId ? editFormData : addFormData;

        const errors = {
            serviceName: !currentForm.serviceName,
            price: !currentForm.price,
            category: currentForm.category != "None" ? false : true,
        };

        this.setState({ errors });

        if (errors.serviceName || errors.price || errors.category) {
            return;
        }

        this.setState({ loading: true });

        const selectedLocationIds = currentForm.location.map(loc => loc.id);

        if (serviceId) {
            dataToSend.append('service_id', serviceId);
        }
        dataToSend.append('service_name', currentForm.serviceName);
        dataToSend.append('service_price', currentForm.price);
        dataToSend.append('service_category', currentForm.category);
        dataToSend.append('service_location', JSON.stringify( selectedLocationIds ));
        dataToSend.append('service_img', currentForm.image);
        dataToSend.append('note', currentForm.note);

        const endpoint = this.props.serviceId ? `/wp-json/bookify/v1/update-service` : '/wp-json/bookify/v1/add-service';
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
                        serviceName: '', 
                        price: '', 
                        category: 'None',
                        location: [],
                        image: '',
                        note: '',
                    },
                    errors: { serviceName: false, price: false, category: false },
                    snackbarOpen: true,
                    snackbarMessage: response.message,
                    snackbarType: 'success',
                    loading: false,
                });
                this.handleClose();
                fetchServiceData();
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
    }

    handleRemoveImage = () => {
        this.setState(prevState => ({
            [this.props.serviceId ? 'editFormData' : 'addFormData']: {
                ...prevState[this.props.serviceId ? 'editFormData' : 'addFormData'],
                image: '',
            }
        }));
    };

    handleServiceImage = () => {
        if (this.state.frame) {
            this.state.frame.open();
            return;
        }

        const frame = wp.media({
            title: "Select or Upload Service Photo",
            button: {
                text: "Upload",
            },
            multiple: false,
        });

        frame.on("select", () => {
            const attachment = frame.state().get("selection").first().toJSON();
            this.setState(prevState => ({
                [this.props.serviceId ? 'editFormData' : 'addFormData']: {
                    ...prevState[this.props.serviceId ? 'editFormData' : 'addFormData'],
                    image: attachment.url,
                }
            }));
        });

        frame.open();
        this.setState({ frame });
    }

    render() { 
        const { open, AllCategories, serviceId, currency } = this.props;
        const { addFormData, editFormData, errors, snackbarOpen, snackbarMessage, snackbarType, allLocations, loading } = this.state;
        const currentForm = serviceId ? editFormData : addFormData;
        const matchedCurrency = Object.values(currencies).find(eachCurrency => eachCurrency.code === currency);

        const ProLocation = window.ProLocation;

        return (
            <>
                <Dialog onClose={this.handleClose} open={open} fullWidth={true} sx={{ '& .MuiDialog-paper': { maxWidth: '42rem' } }}>
                    <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
                        {serviceId ? __('Edit Service', 'bookify') : __('Add Service', 'bookify')}
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
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
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
                                                    onClick={this.handleServiceImage}
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
                                                onClick={this.handleServiceImage}
                                            >
                                                <Typography sx={{p:'30px'}}>{__('Click here to upload service image', 'bookify')}</Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <TextField
                                        error={errors.serviceName}
                                        required
                                        type="text"
                                        label={__('Service Name', 'bookify')}
                                        name="serviceName"
                                        value={currentForm.serviceName}
                                        onChange={this.handleInputChange}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <TextField
                                        error={errors.price}
                                        required
                                        type="number"
                                        label={__('Price', 'bookify')}
                                        name="price"
                                        value={currentForm.price}
                                        onChange={this.handleInputChange}
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
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel 
                                        error={errors.category} 
                                        required 
                                        id="bookify-all-categories"
                                    >
                                        {__('Category', 'bookify')}
                                    </InputLabel>
                                    <Select
                                        error={errors.category}
                                        required 
                                        labelId="bookify-all-categories" 
                                        name="category" 
                                        value={currentForm.category} 
                                        label={__('Category', 'bookify')} 
                                        onChange={this.handleInputChange}
                                    >
                                        <MenuItem value={'None'}>
                                                {__('Select Category', 'bookify')}
                                        </MenuItem>
                                        {AllCategories.map((category, index) => (
                                            <MenuItem key={index} value={category.id}>
                                                {category.category_name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            {ProLocation && (
                                <Grid item xs={12}>
                                    <Autocomplete
                                        fullWidth
                                        multiple
                                        name="location"
                                        options={allLocations}
                                        getOptionLabel={(location) => location.location_name}
                                        value={currentForm.location}
                                        filterSelectedOptions
                                        onChange={this.handleLocationChange}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label={__('Locations', 'bookify')}
                                            />
                                        )}
                                        renderTags={(tagValue, getTagProps) =>
                                            tagValue.map((option, index) => (
                                                <Chip key={option.id} label={option.location_name} {...getTagProps({ index })} />
                                            ))
                                        }
                                    />
                                </Grid>
                            )}
                            <Grid item xs={12}>
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
                    
                    </DialogContent>
                    
                    <Divider variant="middle" />

                    <DialogActions sx={{ margin: 2 }}>
                        <LoadingButton variant="outlined" onClick={this.handleServiceSubmit} loading={loading}>
                            {serviceId ? __('Update', 'bookify') : __('Save', 'bookify')}
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

export default AddService;
