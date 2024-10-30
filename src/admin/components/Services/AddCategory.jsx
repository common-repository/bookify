import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Box, 
    Divider, IconButton, Grid, FormControl, TextField
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {SnackbarNotice} from '../../functions';
import LoadingButton from '@mui/lab/LoadingButton';

class AddCategory extends Component { 
    state = { 
        addFormData: { categoryName: '', categorySlug: '' },
        editFormData: { categoryName: '', categorySlug: '' },
        errors: { categoryName: false, categorySlug: false },
        snackbarOpen: false,
        snackbarMessage: '',
        snackbarType: 'success',
        loading: false
    };

    handleClose = () => this.props.onClose && this.props.onClose();

    componentDidUpdate(prevProps) {
        if (this.props.categoryID && prevProps.categoryID !== this.props.categoryID) {
            this.loadCategoryData(this.props.categoryID);
        }
    }

    handleInputChange = ({ target: { name, value } }) => {
        const formState = this.props.categoryID ? 'editFormData' : 'addFormData';
        this.setState(prevState => ({
            [formState]: { ...prevState[formState], [name]: value },
            errors: { ...prevState.errors, [name]: false }
        }));
    };

    loadCategoryData = (categoryId) => {
        const category = this.props.fetchCategoryById(categoryId);
        if (category) {
            this.setState({ 
                editFormData: { categoryName: category.category_name, categorySlug: category.category_slug } 
            });
        }
    };

    handleCategorySubmit = () => {
        const { addFormData, editFormData } = this.state;
        const { categoryID, fetchCategoryData } = this.props;
        const dataToSend = new FormData();
        
        const currentForm = categoryID ? editFormData : addFormData;
        
        const errors = {
            categoryName: !currentForm.categoryName,
            categorySlug: !currentForm.categorySlug
        };

        this.setState({ errors });

        if (errors.categoryName || errors.categorySlug) {
            return;
        }

        this.setState({ loading: true });

        if (categoryID) {
            dataToSend.append('category_id', categoryID);
            dataToSend.append('category_name', editFormData.categoryName); 
            dataToSend.append('category_slug', editFormData.categorySlug.toLowerCase().replace(/ /g, '-'));
        } else {
            dataToSend.append('category_name', addFormData.categoryName); 
            dataToSend.append('category_slug', addFormData.categorySlug.toLowerCase().replace(/ /g, '-'));
        }

        const endpoint = categoryID ? '/wp-json/bookify/v1/update-category' : '/wp-json/bookify/v1/add-category';
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
                        categoryName: '', 
                        categorySlug: '' 
                    },
                    errors: { categoryName: false, categorySlug: false },
                    snackbarOpen: true,
                    snackbarMessage: response.message,
                    snackbarType: 'success',
                    loading: false
                });
                this.handleClose()
                fetchCategoryData();
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
        const { open, categoryID } = this.props;
        const { addFormData, editFormData, errors, snackbarOpen, snackbarMessage, snackbarType, loading } = this.state;
        const currentForm = categoryID ? editFormData : addFormData;

        return (
            <>
                <Dialog onClose={this.handleClose} open={open} fullWidth maxWidth="sm">
                    <DialogTitle>
                        {categoryID ? __('Edit Category', 'bookify') : __('Add Category', 'bookify')}
                        <IconButton onClick={this.handleClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
                            <CloseIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                    </DialogTitle>
                    <Divider variant="middle" />
                    <DialogContent>
                        <Box component="form">
                            <Grid container spacing={4} direction="column">
                                <Grid item>
                                    <FormControl fullWidth>
                                        <TextField 
                                            label={__('Category Name', 'bookify')} 
                                            name="categoryName" 
                                            value={currentForm.categoryName}
                                            onChange={this.handleInputChange} 
                                            required
                                            error={errors.categoryName}
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid item>
                                    <FormControl fullWidth>
                                        <TextField 
                                            label={__('Category Slug', 'bookify')} 
                                            name="categorySlug" 
                                            value={currentForm.categorySlug}
                                            onChange={this.handleInputChange} 
                                            required
                                            error={errors.categorySlug}
                                        />
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Box>
                    </DialogContent>
                    <Divider variant="middle" />
                    <DialogActions sx={{ margin: 2 }}>
                        <LoadingButton variant="outlined" onClick={this.handleCategorySubmit} loading={loading}>
                            {categoryID ? __('Update', 'bookify') : __('Save', 'bookify')}
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

export default AddCategory;
