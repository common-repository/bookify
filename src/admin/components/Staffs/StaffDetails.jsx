import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { 
    TextField, FormControl, Grid, Box, Typography, 
    Avatar, IconButton, Badge
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { MuiTelInput } from 'mui-tel-input';

class StaffDetailsForm extends Component {

    state = {
        frame: null
    }

    handleInputChange = (event) => {
        const { name, value } = event.target;
        this.props.onChange(name, value);
    };

    handlePhoneChange = (newPhone) => {
        this.props.onChange('phoneNumber', newPhone);
    };

    handleStaffImage = () => {
        if (this.state.frame) {
            this.state.frame.open();
            return;
        }

        const frame = wp.media({
            title: "Select or Upload Staff Photo",
            button: {
                text: "Upload",
            },
            multiple: false,
        });

        frame.on("select", () => {
            const attachment = frame.state().get("selection").first().toJSON();
            this.props.onChange('image', attachment.url);
        });

        frame.open();
        this.setState({ frame });
    };

    handleRemoveImage= () => {
        this.props.onChange('image', '');
    }

    render() {
        const { formData, errors, staffId } = this.props;

        return (
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Box mt={2} textAlign="-webkit-center">
                        {formData.image ? (
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
                                    src={formData.image} 
                                    onClick={this.handleStaffImage}
                                />
                            </Badge>
                        ) : (
                            <Box 
                                border="2px dashed #ccc" 
                                textAlign="center" 
                                sx={{
                                    width:'12rem', 
                                    height:'12rem', 
                                    borderRadius:'50%',
                                    display:'flex',
                                    alignItems:'center',
                                }}
                                onClick={this.handleStaffImage}
                            >
                                <Typography sx={{p:'30px'}}>{__('Click here to upload staff image', 'bookify')}</Typography>
                            </Box>
                        )}
                    </Box>
                </Grid>
                <Grid item xs={12} container spacing={2} justifyContent="space-between">
                    <Grid item sx={{width:"50%"}}>
                        <FormControl fullWidth>
                            <TextField 
                                error={errors.fullName}
                                required
                                type="text" 
                                label={__('Full Name', 'bookify')} 
                                name="fullName" 
                                value={formData.fullName}
                                onChange={this.handleInputChange} 
                            />
                        </FormControl>
                    </Grid>
                    <Grid item sx={{width:"50%"}}>
                        <FormControl fullWidth>
                            <MuiTelInput
                                error={errors.phoneNumber}
                                required
                                inputProps={{ pattern: '[0-9]*' }}
                                label={__('Phone Number', 'bookify')}
                                name="phoneNumber"
                                value={formData.phoneNumber}
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
                <Grid item xs={12} container spacing={2} justifyContent="space-between">
                    <Grid item sx={{width:"50%"}}>
                        <FormControl fullWidth>
                            <TextField
                                error={errors.email || errors.emailValidation}
                                helperText={errors.emailValidation ? __('Please enter a valid email', 'bookify') : ''}
                                required
                                type="email"
                                label={__('Email', 'bookify')}
                                name="email"
                                value={formData.email}
                                onChange={this.handleInputChange}
                                sx={{
                                    '.MuiFormHelperText-root': {
                                        ml:'0px',
                                    }
                                }}
                            />
                        </FormControl>
                    </Grid>
                    <Grid item sx={{width:"50%"}}>
                        <FormControl fullWidth>
                            <TextField
                                error={staffId ? false : errors.password}
                                required={staffId ? false : true}
                                type="password"
                                label={__('Password', 'bookify')}
                                name="password"
                                value={formData.password}
                                onChange={this.handleInputChange}
                            />
                        </FormControl>
                    </Grid>
                </Grid>
                <Grid item xs={12}>
                    <FormControl fullWidth>
                        <TextField 
                            type="text" 
                            label={__('Profession', 'bookify')} 
                            name="profession" 
                            value={formData.profession}
                            onChange={this.handleInputChange} 
                        />
                    </FormControl>
                </Grid>
                <Grid item xs={12}>
                    <FormControl fullWidth>
                        <TextField
                            multiline
                            rows={4}
                            label={__('Note', 'bookify')}
                            name="note"
                            value={formData.note}
                            onChange={this.handleInputChange}
                        />
                    </FormControl>
                </Grid>
            </Grid>
        );
    }
}

export default StaffDetailsForm;