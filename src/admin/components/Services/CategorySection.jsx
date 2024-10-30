import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import {
    Box, Grid, Typography, Stack, Button,
    Checkbox, IconButton, Chip, Skeleton
} from '@mui/material';
import PostAddIcon from '@mui/icons-material/PostAdd';
import ModeIcon from '@mui/icons-material/Mode';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCategory from './AddCategory';
import { openDialog, closeDialog } from '../../functions';
import { SnackbarNotice, ConfirmationDialog } from '../../functions';

class CategorySection extends Component {
    state = {
        selectedCategories: [],
        AddCategoryDialog: false,
        editDialogHandle: null,
        snackbarOpen: false,
        snackbarMessage: '',
        snackbarType: 'success',
        confirmationDialogOpen: false,
        confirmationLoading: false,
        categoryIdToDelete: null,
        CategoryDataLoading: true
    };

    componentDidMount() {
        this.fetchCategoryData();
    }

    handleCategorySelect = (categoryId) => {
        const { selectedCategories } = this.state;
        const index = selectedCategories.indexOf(categoryId);
        let newSelectedCategories = [...selectedCategories];

        if (index === -1) {
            newSelectedCategories.push(categoryId);
        } else {
            newSelectedCategories.splice(index, 1);
        }

        this.setState({ selectedCategories: newSelectedCategories });
        this.props.fetchServiceData(1, 10, newSelectedCategories);
    };

    fetchCategoryById = (categoryId) => {
        return this.props.CategoryData.find(category => category.id === categoryId);
    };

    fetchCategoryData = () => {
        this.setState({ CategoryDataLoading: true });

        fetch(`/wp-json/bookify/v1/categories`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': wpApiSettings.nonce
            }
        })
        .then(response => response.json())
        .then(data => {
            this.props.setState(prevState => ({
                ...prevState,
                CategoryData: data.categoryData,
            }));
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        })
        .finally(() => {
            this.setState({ CategoryDataLoading: false });
        });
    };

    handleDeleteCategory = (categoryId) => {
        this.setState({ confirmationDialogOpen: true, categoryIdToDelete: categoryId });
    };

    confirmCategoryDelete = () => {
        const { categoryIdToDelete } = this.state;
        this.setState({ confirmationLoading: true });

        const dataToSend = new FormData();
        dataToSend.append('category_id', categoryIdToDelete);

        fetch(`/wp-json/bookify/v1/delete-category`, {
            method: 'POST',
            headers: {
                'X-WP-Nonce': wpApiSettings.nonce
            },
            body: dataToSend
        })
        .then(response => response.json())
        .then(response => {
            if ( response.success ) {
                this.setState(prevState => {
                    const newSelectedCategories = prevState.selectedCategories.filter(id => id !== categoryId);
                    return {
                        selectedCategories: newSelectedCategories,
                        confirmationDialogOpen: false,
                        confirmationLoading: false,
                        categoryIdToDelete: null,
                        snackbarOpen: true,
                        snackbarMessage: response.message,
                        snackbarType: 'success',
                    };
                });
                this.fetchCategoryData();
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
            console.error('Error deleting category:', error);
            this.setState({ confirmationLoading: false });
        })
    };

    render() {
        const { selectedCategories, AddCategoryDialog, snackbarOpen, snackbarMessage, snackbarType, editDialogHandle, confirmationDialogOpen, confirmationLoading, CategoryDataLoading } = this.state;
        const { CategoryData } = this.props;

        return (
            <Box
                component="section"
                sx={{
                    ml: '1em',
                    mr: '2em',
                    mb: '2em',
                    mt: '2em',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#FFFFFF',
                    p: '23px',
                    borderRadius: '5px',
                    height: '63.25em',
                    borderColor: '#000000'
                }}
            >
                <Grid container direction="column" rowSpacing={5}>
                    <Grid item>
                        <Typography variant="h5" component="div">
                            {__('Selected Categories', 'bookify')}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: "2em", pb: "1em", alignContent: "flex-start", height: "10em", overflow: "auto" }}>
                            {selectedCategories.length > 0 ? (
                                selectedCategories.map(categoryId => {
                                    const category = CategoryData.find(cat => cat.id === categoryId);
                                    return (
                                        <Chip key={categoryId} label={category ? category.category_name : 'Unknown'} onDelete={() => this.handleCategorySelect(categoryId)} />
                                    );
                                })
                            ) : (
                                <Typography component="div">
                                    {__('No Categories were selected!', 'bookify')}
                                </Typography>
                            )}
                        </Stack>
                    </Grid>

                    <Grid item>
                        <Typography variant="h5" component="div">
                            {__('All Categories', 'bookify')}
                        </Typography>
                        <Stack direction="column" sx={{ mt: "2em", pb: "1em", height: "26em", overflow: "auto" }}>
                            {CategoryDataLoading ? (
                                Array.from(new Array(5)).map((_, index) => (
                                    <Stack key={index} direction="row" alignItems="center" justifyContent="space-between" sx={{ pb: 2 }}>
                                        <Box sx={{ display: "flex", alignItems: "center" }}>
                                            <Skeleton variant="rectangular" animation="wave" width={20} height={20} />
                                            <Skeleton variant="text" animation="wave" width={150} sx={{ ml: 2 }} />
                                        </Box>
                                        <Box sx={{ display:"flex" }}>
                                            <Skeleton variant="circular" animation="wave" width={25} height={25} />
                                            <Skeleton variant="circular" animation="wave" width={25} height={25} sx={{ ml: 1 }} />
                                        </Box>
                                    </Stack>
                                ))
                            ) : (
                                CategoryData.length > 0 ? (
                                    CategoryData.map(category => (
                                        <Stack key={category.id} direction="row" alignItems="center" justifyContent="space-between">
                                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                                <Checkbox
                                                    checked={selectedCategories.includes(category.id)}
                                                    onChange={() => this.handleCategorySelect(category.id)}
                                                />
                                                <Typography sx={{ overflow: 'hidden', width: '12em', textOverflow: 'ellipsis' }}>{category.category_name}</Typography>
                                            </Box>
                                            <Box sx={{ pr: "1em" }}>
                                                <IconButton color="primary" onClick={() => openDialog(this.state, this.setState.bind(this), 'AddCategoryDialog', category.id)}>
                                                    <ModeIcon />
                                                </IconButton>
                                                <IconButton color="error" onClick={() => this.handleDeleteCategory(category.id)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                        </Stack>
                                    ))
                                ) : (
                                    <Typography component="div">
                                        {__('No Categories were found!', 'bookify')}
                                    </Typography>
                                )
                            )}
                        </Stack>
                    </Grid>

                    <Grid item sx={{ textAlign: "center" }}>
                        <Button
                            variant="outlined"
                            startIcon={<PostAddIcon />}
                            sx={{
                                borderColor: '#ff6c22',
                                backgroundColor: '#ff6c22',
                                color: '#ffffff',
                                textTransform: 'capitalize',
                                padding: "14px 21px",
                                '&:hover': {
                                    color: '#036666',
                                },
                            }}
                            onClick={() => openDialog(this.state, this.setState.bind(this), 'AddCategoryDialog', null)}
                        >
                            {__('Add Category', 'bookify')}
                        </Button>
                        <AddCategory
                            open={AddCategoryDialog}
                            onClose={() => closeDialog(this.state, this.setState.bind(this), 'AddCategoryDialog')}
                            fetchCategoryData={this.fetchCategoryData}
                            fetchCategoryById={this.fetchCategoryById}
                            categoryID={editDialogHandle}
                        />
                    </Grid>
                </Grid>
                <SnackbarNotice
                    state={this.state}
                    setState={this.setState.bind(this)}
                    open={snackbarOpen}
                    message={snackbarMessage}
                    type={snackbarType}
                />
                <ConfirmationDialog
                    open={confirmationDialogOpen}
                    onClose={() => this.setState({ confirmationDialogOpen: false, categoryIdToDelete: null })}
                    onConfirm={this.confirmCategoryDelete}
                    loading={confirmationLoading}
                />
            </Box>
        );
    }
}

export default CategorySection;