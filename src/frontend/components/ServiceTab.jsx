import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@mui/base/Button';
import { Box, Grid, Avatar, Typography, Paper } from '@mui/material';
import { FormContext } from '../context/FormContext';
import Skeleton from '@mui/material/Skeleton'; 

class ServiceTab extends Component {
	
	static contextType = FormContext;

	componentDidMount() {
		this.CategorizedServices();
	}

	goToNextStep = () => {
		const LocationTab = window.LocationTab;
		const { state } = this.context;
		if( state.serviceId != null ) this.props.setTab( LocationTab ? 2 : 1 );
	};

	goToPreviousStep = () => {
		const { updateInput } = this.context;
		this.props.setTab(0);
		updateInput( 'serviceId', null );
		updateInput( 'serviceName', '' );
		updateInput( 'categorizedServices', [] );
		updateInput( 'serviceStopRerendering', false );
		
	};

	handleServiceClick = (e) => {
		const serviceId = e.currentTarget.getAttribute('data-value');
		const serviceName = e.currentTarget.getAttribute('data-name');
		const { updateInput } = this.context;
		updateInput('serviceId', serviceId);
		updateInput('serviceName', serviceName);
	};
	
    CategorizedServices() {
		
		const LocationTab = window.LocationTab;
		const { state, updateInput } = this.context;

		if ( LocationTab ) {

			if ( ! state.serviceStopRerendering ) {
				
				const dataToSend = new FormData();
				dataToSend.append('location_id', state.locationId);
				updateInput( 'serviceByLocaionLoading', true );
				updateInput( 'serviceStopRerendering', true );
				
				fetch('/wp-json/bookify/frontend/v1/get-services-by-location', {
					headers: {
						'X-WP-Nonce': wpbApp.nonce
					},
					method: 'POST',
					body: dataToSend,
				})
				.then((response) => response.json())
				.then((data) => {

					const categorizedServices = data.services.map(category => ({
						name: category.category_name,
						services: category.services.map(service => ({
							id: service.id,
							service_name: service.service_name,
							service_category: category.id,
							service_price: service.service_price,
							service_img: service.service_img,
							service_note: service.service_note
						}))
					}));

					categorizedServices.sort((a, b) => parseInt(a.services[0]?.service_category || 0) - parseInt(b.services[0]?.service_category || 0));

					updateInput( 'categorizedServices', categorizedServices );
					updateInput( 'serviceByLocaionLoading', false );

				})
				.catch((error) => {
					console.error('Error fetching services:', error);
					updateInput( 'serviceByLocaionLoading', false );
				});
			}

		} else {

			if ( ! state.serviceStopRerendering ) {
				const { data } = this.props;

				const categories = data.categories;
				const services = data.services;

				let categorizedServices = [];

				if( categories.length > 0 && services.length > 0 ) {
					categorizedServices = categories.map(category => {
						return {
							name: category.category_name,
							services: services.filter(service => service.service_category === category.id)
						};
					});

					updateInput( 'categorizedServices', categorizedServices );
					updateInput( 'serviceStopRerendering', true );
				}
			}
		}
    }

	render() {

		const { state } = this.context;
		const LocationTab = window.LocationTab;
		const { data } = this.props;

		const loading = LocationTab ? state.serviceByLocaionLoading : data.dataLoading;

		return (
			<div className='bookify-tab-panel-wrapper'>
				<div className='bookify-tab-panel-inner-wrapper'>
					<div className='bookify-tab-panel-header'>{__('Service', 'bookify')}</div>
					<div className='bookify-tab-panel-body'>
						<div className='bookify-services-wrapper'>
						{loading ? (
							Array.from(new Array(2)).map((_, index) => (
								<Box key={index} sx={{ mb: '20px' }}>
									<Skeleton variant="text" animation="wave" width={150} />
									<Grid container spacing={2} sx={{ pt: 1 }}>
										<Grid item xs={6}>
											<Skeleton variant="rectangular" animation="wave" width="100%" height={50} />
										</Grid>
										<Grid item xs={6}>
											<Skeleton variant="rectangular" animation="wave" width="100%" height={50} />
										</Grid>
										<Grid item xs={6}>
											<Skeleton variant="rectangular" animation="wave" width="100%" height={50} />
										</Grid>
									</Grid>
								</Box>
							))
						) : state.categorizedServices.some(category => category.services.length > 0) ? (
							state.categorizedServices.map((category, index) => (
								category.services.length > 0 && (
									<Box key={index} sx={{ marginBottom: '20px' }}>
										<Typography variant="h6" gutterBottom sx={{ color: '#036666', fontSize: '16px', textTransform: 'none' }}>
											{category.name}
										</Typography>
										<Grid container spacing={2}>
											{category.services.map((service) => (
												<Grid item xs={6} key={service.id}>
													<Paper
														elevation={0}
														data-value={service.id}
														data-name={service.service_name}
														onClick={(e) => this.handleServiceClick(e)}
														sx={{
															display: 'flex',
															justifyContent: 'flex-start',
															alignItems: 'center',
															gap: '8px',
															padding: '8px',
															cursor: 'pointer',
															borderWidth: '1px',
															borderStyle: 'solid',
															borderColor: state.serviceId !== service.id ? 'background.paper' : '#036666',
														}}
													>
														<Avatar alt={service.service_name} src={service.service_img} />
														<Box>
															<Typography variant="h6" sx={{ fontSize: '14px', color: '#292D32', textTransform: 'none' }}>
																{service.service_name}
															</Typography>
														</Box>
													</Paper>
												</Grid>
											))}
										</Grid>
									</Box>
								)
							))
						) : (
							<Typography component="div">
								{__('No Category or Service were found!', 'bookify')}
							</Typography>
						)}
						</div>
					</div>
				</div>
				<div className='bookify-tab-panel-footer'>
					{LocationTab ? (
						<Button variant="contained" onClick={this.goToPreviousStep}  className='bookify-btn-secondary'>
							{__('Back', 'bookify')}
						</Button>
					) : (
						<div></div>
					)}
					<Button onClick={this.goToNextStep} className='bookify-btn-primary'>
						{__('Next Step', 'bookify')}
					</Button>
				</div>
			</div>
		);
    }
}

export default ServiceTab;
