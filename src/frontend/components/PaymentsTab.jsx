import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@mui/base/Button';
import { Box, Typography, Paper } from '@mui/material';
import { FormContext } from '../context/FormContext';
import Alert from '@mui/material/Alert';
import LoadingButton from '@mui/lab/LoadingButton';

class PaymentsTab extends Component {

	static contextType = FormContext;

	state = {
		error: false,
		errorMsg: '',
		isRequestPending: false
	};

	goToPreviousStep = () => {
		const StaffTab = window.StaffTab;
		this.props.setTab(StaffTab ? 4 : 2);
	};

	submitBooking = ( event, paidAmount = false ) => {
		if (event) {
			event.preventDefault();
		}

		this.setState({ isRequestPending: true });
		const { state, updateInput } = this.context;

		const dataToSend = {
			'location_id': state.locationId,
			'service_id': state.serviceId,
			'staff_id': state.staffId,
			'date': state.date,
			'slot': state.slot,
			'first_name': state.firstName,
			'last_name': state.lastName,
			'email': state.email,
			'phone': state.phone,
			'note': state.note,
			'gateway': state.gateway,
			'customer_id': state.customerId,
			'total': state.total,
		};

		if ( paidAmount != false ) {
			dataToSend['paidAmount'] = paidAmount;
		}

        fetch(`${wpbApp.root}bookify/frontend/v1/add-appointment`, {
            method: 'POST',
            headers: {
                'X-WP-Nonce': wpbApp.nonce,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify( dataToSend )
        })
        .then(response => response.json())
        .then(response => {
            if ( response.success ) {
				const appointmentId = response.appointment_id;

				updateInput('appointmentId', appointmentId);
				const StaffTab = window.StaffTab;
				this.props.setTab( StaffTab ? 6 : 4 );
            } 
			else {
				this.setState({ error: true, errorMsg: response.message });	
				this.setState({ isRequestPending: false });
            }
        })
	};

	renderAlert = (msg) => {
		return (
			<Alert severity="error" sx={{ marginBottom: '15px' }}>{msg}</Alert>
		);
	};

    render() {

		const { data, paymentSettings } = this.props;
		const { state, updateInput } = this.context;
		const { error, errorMsg, isRequestPending } = this.state;

		const PaymentGateways = window.PaymentGateways;

		return (
			<div className='bookify-tab-panel-wrapper'>
				<div className='bookify-tab-panel-inner-wrapper'>
					<div className='bookify-tab-panel-header'>{__('Payment', 'bookify')}</div>
					<div className='bookify-tab-panel-body'>
						{ error ? this.renderAlert( errorMsg ) : '' }
						<Typography variant="h6" gutterBottom sx={{ color: '#036666', fontSize: '14px', textTransform:'none' }}>{__('Summery', 'bookify')}</Typography>
						<Paper 
							elevation={0}
							sx={{
								display: 'flex',
								justifyContent: 'flex-start',
								alignItems: 'center',
								justifyContent: 'space-between',
								padding: '15px'
							}}
						>
							<Box>							
								<Typography variant="subtitle2" sx={{ fontSize: '12px', color: '#036666', fontWeight: '600', textTransform:'none' }}>{__('Service', 'bookify')}</Typography>
								<Typography variant="h6" sx={{ fontSize: '14px', color: '#292D32', textTransform:'none' }}>
									{state.serviceName + ' (' + state.date + ' - ' + state.slot + ')' }
								</Typography>
							</Box>
							<Box sx={{ background: '#ECEFF2', width: 'fit-content', borderRadius: '4px', padding: '6px 10px' }}>
								<Typography sx={{ fontSize: '12px', fontWeight: '600', padding: '12px', textTransform:'none' }}>
									{data.currencySymbol + state.total}
								</Typography>
							</Box>	
						</Paper>
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'flex-start',
								alignItems: 'center',
								justifyContent: 'space-between',
								padding: '15px'
							}}
						>
							<Typography sx={{ fontSize: '14px', color: '#036666', fontWeight: '600', textTransform:'none'}}>{__('Subtotal', 'bookify')}</Typography>
							<Typography sx={{ fontSize: '14px', fontWeight: '600', textTransform:'none'}}>{data.currencySymbol + state.total}</Typography>
						</Box>
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'flex-start',
								alignItems: 'center',
								justifyContent: 'space-between',
								padding: '15px'
							}}
						>
							<Typography sx={{ fontSize: '14px', color: '#036666', fontWeight: '600', textTransform:'none'}}>{__('Total Amount', 'bookify')}</Typography>
							<Typography sx={{ fontSize: '14px', fontWeight: '600', textTransform:'none'}}>{data.currencySymbol + state.total}</Typography>
						</Box>
						{PaymentGateways && (
							<Box sx={{p:"10px 0px 0px 15px"}}>
								<PaymentGateways
									paymentSettings={paymentSettings}
									currencyCode={data.currencyCode}
									submitBooking={this.submitBooking}
									contextState={state}
									updateContextInput={updateInput}
									setState={this.setState.bind(this)}
								/>
							</Box>
						)}
					</div>
				</div>
				<div className='bookify-tab-panel-footer'>
					<Button variant="contained" onClick={this.goToPreviousStep}  className='bookify-btn-secondary'>
						{__('Back', 'bookify')}
					</Button>
					{state.gateway == "on-site" && (
						<LoadingButton loading={isRequestPending} variant="contained" onClick={() => this.submitBooking()}  className='bookify-btn-primary'>
							{__('Submit', 'bookify')}
						</LoadingButton>
					)}
				</div>
			</div>
		);
    }
}

export default PaymentsTab;
