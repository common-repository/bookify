import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@mui/base/Button';
import { Grid, Typography, TextField } from '@mui/material';
import { MuiTelInput } from 'mui-tel-input';
import { FormContext } from '../context/FormContext';

class UserInfoTab extends Component {

	static contextType = FormContext;
	
	state = {
		customerId: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        note: '',
        errors: {
            firstName: false,
            lastName: false,
            email: false,
            phone: false
        },
        emailErrorMsg: 'Email is required'
    };

	componentDidMount() {

        if ( wpbApp.customerData.id ) {
            this.setState({
				customerId: wpbApp.customerData.id || '',
                firstName: wpbApp.customerData.fname || '',
                lastName: wpbApp.customerData.lname || '',
                email: wpbApp.customerData.email || '',
                phone: wpbApp.customerData.phone || ''
            });
        }

    }

	goToPreviousStep = () => {
        const StaffTab = window.StaffTab;
        this.props.setTab(StaffTab ? 3 : 1);
    };

	goToNextStep = () => {
        if (this.validateForm()) {
			const { updateInput } = this.context;
			const { customerId, firstName, lastName, email, phone, note } = this.state;

			updateInput( 'customerId', customerId );
			updateInput( 'firstName', firstName );
			updateInput( 'lastName', lastName );
			updateInput( 'email', email );
			updateInput( 'phone', phone );
            updateInput( 'note', note );

            const StaffTab = window.StaffTab;
            this.props.setTab(StaffTab ? 5 : 3);
        }
    };

	handlePhoneChange = (newPhone) => {
        this.setState({
            phone: newPhone,
            errors: { ...this.state.errors, phone: false }
        });
    };

	handleValueChange = (e, name) => {
        const value = e.target.value;
        this.setState(prevState => ({
            [name]: value,
            errors: { ...prevState.errors, [name]: false }
        }));
    };

	validateForm = () => {
        const { firstName, lastName, email, phone } = this.state;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        let hasErrors = false;
        const errors = {};

        if (firstName === '') {
            errors.firstName = true;
            hasErrors = true;
        }
        if (lastName === '') {
            errors.lastName = true;
            hasErrors = true;
        }
        if (!emailRegex.test(email)) {
            errors.email = true;
            this.setState({
                emailErrorMsg: email === '' ? 'Email is required' : 'Invalid email address'
            });
            hasErrors = true;
        }
        if (phone === '' || phone.length < 8) {
            errors.phone = true;
            hasErrors = true;
        }

        this.setState({ errors });

        return !hasErrors;
    };

    render() {

		const { firstName, lastName, email, phone, note, errors, emailErrorMsg } = this.state;

		return (
			<div className='bookify-tab-panel-wrapper'>
				<div className='bookify-tab-panel-inner-wrapper'>
					<div className='bookify-tab-panel-header'>{__('Your Information', 'bookify')}</div>
					<div className='bookify-tab-panel-body'>
						<Grid container spacing={2}>
							<Grid item xs={6}>
								<label htmlFor="bookify-user-fname" className="bookify-input-label">{__('First Name', 'bookify')}</label>
								<TextField
                                    id="bookify-user-fname"
                                    value={firstName}
                                    onChange={(e) => this.handleValueChange(e, 'firstName')}
                                    fullWidth
                                    error={errors.firstName}
									helperText={errors.firstName ? __('First Name is required', 'bookify') : ''}
									InputProps={{
										classes: {
											input: 'bookify-input-field',
										},
									}}
									sx={{
										'& .MuiFormHelperText-root': {
											ml: '0px'
										}
									}}
                                />
							</Grid>
							<Grid item xs={6}>
								<label htmlFor="bookify-user-lname" className="bookify-input-label">{__('Last Name', 'bookify')}</label>
								<TextField
                                    id="bookify-user-lname"
                                    value={lastName}
                                    onChange={(e) => this.handleValueChange(e, 'lastName')}
                                    fullWidth
                                    error={errors.lastName}
                                    helperText={errors.lastName ? __('Last Name is required', 'bookify') : ''}
									InputProps={{
										classes: {
											input: 'bookify-input-field',
										},
									}}
									sx={{
										'& .MuiFormHelperText-root': {
											ml: '0px'
										}
									}}
                                />
							</Grid>
							<Grid item xs={6}>
								<label htmlFor="bookify-user-email" className="bookify-input-label">{__('Email', 'bookify')}</label>
								<TextField
                                    id="bookify-user-email"
                                    value={email}
                                    onChange={(e) => this.handleValueChange(e, 'email')}
                                    fullWidth
                                    error={errors.email}
                                    helperText={errors.email ? emailErrorMsg : ''}
									InputProps={{
										classes: {
											input: 'bookify-input-field',
										},
									}}
									sx={{
										'& .MuiFormHelperText-root': {
											ml: '0px'
										}
									}}
                                />
							</Grid>
							<Grid item xs={6}>
								<label htmlFor="bookify-user-phone" className="bookify-input-label">{__('Phone', 'bookify')}</label>
								<MuiTelInput
                                    id="bookify-user-phone"
                                    value={phone}
                                    onChange={this.handlePhoneChange}
                                    defaultCountry="US"
                                    fullWidth
                                />
                                {errors.phone && (
                                    <Typography variant="h6" gutterBottom sx={{ color: '#d32f2f', fontSize: '12px', textTransform:'none', marginTop:'3px' }}>
                                        {__('Phone is required')}
                                    </Typography>
                                )}
							</Grid>
                            <Grid item xs={12}>
								<label htmlFor="bookify-note" className="bookify-input-label">{__('Note', 'bookify')}</label>
								<TextField
                                    id="bookify-note"
                                    value={note}
                                    onChange={(e) => this.handleValueChange(e, 'note')}
                                    fullWidth
                                    multiline
                                    rows={4}
                                    InputProps={{
										classes: {
											input: 'bookify-textarea-field',
										},
									}}
									sx={{
										'& .MuiFormHelperText-root': {
											ml: '0px'
										},
                                        '.MuiInputBase-root': {
                                            border: '1px solid #D9D9D9',
                                            p: '0px',
                                        },
                                        '.MuiOutlinedInput-notchedOutline': {
                                            zIndex: '-1'
                                        }
									}}
                                />
							</Grid>
						</Grid>
					</div>
				</div>
				<div className='bookify-tab-panel-footer'>
					<Button variant="contained" onClick={this.goToPreviousStep}  className='bookify-btn-secondary'>
						{__('Back', 'bookify')}
					</Button>
					<Button variant="contained" onClick={this.goToNextStep}  className='bookify-btn-primary'>
						{__('Next Step', 'bookify')}
					</Button>
				</div>
			</div>
		);
    }
}

export default UserInfoTab;
