import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@mui/base/Button';
import { Box, Typography } from '@mui/material';
import CelebrationIcon from '@mui/icons-material/Celebration';
import { FormContext } from '../context/FormContext';
import dayjs from 'dayjs';

class ConfirmationTab extends Component {

	static contextType = FormContext;

	backToNewAppointment = () => {
		window.location.reload()
	};

	capitalizeWords = (str) => {
		return str.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
	};

	formatDate = (date) => {
		return date ? dayjs(date).format('MMMM DD, YYYY') : '';
	};

    render() {

		const row = { display: 'flex', justifyContent: 'space-between', marginBottom: '5px' };
		const th = { fontSize: '12px' };
		const td = { fontSize: '12px', color: '#036666', fontWeight: '500' };
		const { data } = this.props;
		const { state } = this.context;

		return (
			<div className='bookify-tab-panel-wrapper'>
				<div className='bookify-tab-panel-inner-wrapper'>
					<div className='bookify-tab-panel-header'>{__('Confirmation', 'bookify')}</div>
					<div className='bookify-tab-panel-body'>
						<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px', gap: '5px' }}>		
							<CelebrationIcon sx={{ color: 'red' }} />					
							<Typography variant="subtitle2" sx={{ fontSize: '13px', color: '#036666', fontWeight: '600' }}>
								{__('Congratulations', 'bookify')}
							</Typography>
							<Typography sx={{fontSize: '12px'}}>{__('Appointment ID #', 'bookify')}{state.appointmentId}</Typography>
						</Box>
						<Box sx={{maxWidth: '420px', margin: 'auto', marginTop: '20px'}}>
							<Box sx={{ borderBottom: '1px solid #D9D9D9', marginBottom: '10px', paddingBottom: '10px' }}>
								<Box sx={row}>
									<Typography sx={th}>{__('Date:', 'bookify')}</Typography>
									<Typography sx={td}>{this.formatDate(state.date)}</Typography>
								</Box>
								<Box sx={row}>
									<Typography sx={th}>{__('Local Time:', 'bookify')}</Typography>
									<Typography sx={td}>{state.slot}</Typography>
								</Box>
								<Box sx={row}>
									<Typography sx={th}>{__('Service:', 'bookify')}</Typography>
									<Typography sx={td}>{state.serviceName}</Typography>
								</Box>
								<Box sx={row}>
									<Typography sx={th}>{__('Employee', 'bookify')}</Typography>
									<Typography sx={td}>{this.capitalizeWords(state.staffName)}</Typography>
								</Box>
								<Box sx={row}>
									<Typography sx={th}>{__('Payment', 'bookify')}</Typography>
									<Typography sx={td}>{ data.currencySymbol + state.total} {'- ' + this.capitalizeWords(state.gateway)}</Typography>
								</Box>
							</Box>
							<Box>
								<Box sx={row}>
									<Typography sx={th}>{__('Your Name:', 'bookify')}</Typography>
									<Typography sx={td}>{state.firstName + ' ' + state.lastName}</Typography>
								</Box>
								<Box sx={row}>
									<Typography sx={th}>{__('Email Address:', 'bookify')}</Typography>
									<Typography sx={td}>{state.email}</Typography>
								</Box>
								<Box sx={row}>
									<Typography sx={th}>{__('Phone Number:', 'bookify')}</Typography>
									<Typography sx={td}>{state.phone}</Typography>
								</Box>
							</Box>
						</Box>
					</div>
				</div>
				<div className='bookify-tab-panel-footer'>
					<Button variant="contained" onClick={this.backToNewAppointment} className='bookify-btn-primary'>
						{__('New Appointment', 'bookify')}
					</Button>
				</div>
			</div>
		);
    }
}

export default ConfirmationTab;
