import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { DayCalendarSkeleton } from '@mui/x-date-pickers/DayCalendarSkeleton';
import { Button } from '@mui/base/Button';
import dayjs from 'dayjs';
import updateLocale from 'dayjs/plugin/updateLocale';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { FormContext } from '../context/FormContext';

class DateAndTimeTab extends Component {

	static contextType = FormContext;

	state= {
		divRef: React.createRef(),
		staffId: null,
        staffName: '',
        total: 0,
        staffsByServices: [],
        StaffByServiceStopRerendering: false,
        daysOpen: [],
        specialDate: [],
        holidays: [],
        DatesByStaffStopRerendering: false,
        DateLoading: true,
        slots: [],
        slot: null,
        date: null,
	};

    componentDidMount() {

		const StaffTab = window.StaffTab;

		if ( StaffTab ) {
			this.getDatesByStaff();
		} else {
			this.getStaffByService();
		}
    }

	componentDidUpdate(prevProps, prevState) {
		const { divRef, slots } = this.state;
	
		if (prevState.slots !== slots && slots.length > 0) {
			setTimeout(() => {
				divRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			}, 100);
		}
	}

    getStaffByService() {

		const { state } = this.context;
		const { StaffByServiceStopRerendering } = this.state;

		if ( ! StaffByServiceStopRerendering ) {

			let staff = {};

			const dataToSend = new FormData();
			dataToSend.append('service_id', state.serviceId);
		
			fetch('/wp-json/bookify/v1/staffs-by-service', {
				headers: {
					'X-WP-Nonce': wpbApp.nonce
				},
				method: 'POST',
				body: dataToSend,
			})
			.then(response => response.json())
			.then(data => {
				staff = data.staffs[0];
				if ( staff ) {
					this.setState({
						staffId: staff['staff_id'],
						staffName: staff['staff_name'],
						total: staff['service_price'],
						StaffByServiceStopRerendering: true,
					});
					this.getDatesByStaff( staff['staff_id'] );
				} else {
					this.setState({
						StaffByServiceStopRerendering: true,
						DateLoading: false,
					});
				}
			})
			.catch((error) => {
				console.error('Error fetching data:', error);
			})
		}
    }

	getDatesByStaff( staffId = false ) {

		const { state } = this.context;

		const { DatesByStaffStopRerendering } = this.state;

		if ( ! DatesByStaffStopRerendering ) {

			const staff = staffId ? staffId : state.staffId;

			const dataToSend = new FormData();
			dataToSend.append('staff_id', staff);

			fetch('/wp-json/bookify/v1/dates-by-staff', {
				headers: {
					'X-WP-Nonce': wpbApp.nonce
				},
				method: 'POST',
				body: dataToSend,
			})
			.then(response => response.json())
			.then(data => {
				this.setState({
					daysOpen: data.dates,
					specialDate: data.special,
					holidays: data.holidays,
					DatesByStaffStopRerendering: true,
					StaffByServiceStopRerendering: true,
					DateLoading: false,
				});

				if( state.date != null ) {
					this.handleDateChange( state.date );
				}
			})
			.catch((error) => {
				console.error('Error fetching data:', error);
			})
		}
	}

	shouldDisableDate = (date) => {
        const { daysOpen, holidays } = this.state;
        const day = date.day();
    
        if ( daysOpen.length <= 0 ) {
            return true;
        } else {
            const eachDay = Object.keys(daysOpen).map(day => parseInt(day));
            const isDayOpen = eachDay.includes(day);
			
            if ( holidays.length > 0 ) {
                const holidayObjects = JSON.parse(holidays);
                const holidayDates = Object.values(holidayObjects).map(holiday => holiday.dateFormated);
                const isHoliday = holidayDates.includes(date.format('YYYY-MM-DD'));
    
                return !isDayOpen || isHoliday;
            }
    
            return !isDayOpen;
        }
    }

	goToPreviousStep = () => {
		const StaffTab = window.StaffTab;
		const { updateInput } = this.context;
		this.props.setTab( StaffTab ? 2 : 0 );

		updateInput( 'staffId', null );
		updateInput( 'staffName', '' );
		updateInput( 'total', 0 );
		updateInput( 'date', null );
		updateInput( 'slot', null );
		updateInput( 'daysOpen', [] );
		updateInput( 'specialDate', [] );
		updateInput( 'holidays', [] );
		updateInput( 'slots', [] );
	};

	goToNextStep = () => {
		const StaffTab = window.StaffTab;
		const { state, updateInput } = this.context;
		const { staffId, staffName, total, date, slot, daysOpen, specialDate, holidays, slots } = this.state;

		if ( ! StaffTab ) {
			updateInput( 'staffId', staffId );
			updateInput( 'staffName', staffName );
			updateInput( 'total', total );
		}
		
		updateInput( 'date', date );
		updateInput( 'slot', slot );
		updateInput( 'daysOpen', daysOpen );
		updateInput( 'specialDate', specialDate );
		updateInput( 'holidays', holidays );
		updateInput( 'slots', slots );

		if( date != null && slot != null ) this.props.setTab( StaffTab ? 4 : 2 );
	};

	handleDateChange = (date) => {

		date = dayjs(date);
		const { state } = this.context;

        const weekDay = date.day();
        const selectedDate = dayjs(date).format('YYYY-MM-DD');
		const { daysOpen, specialDate, staffId } = this.state;

		const staffID = staffId ? staffId : state.staffId;

        let timeSlots = [];

        let isSpecialDate = false;
        for (let key in specialDate) {
            if (specialDate[key].date === selectedDate) {
                timeSlots = specialDate[key].slots;
                isSpecialDate = true;
                break;
            }
        }

        if ( ! isSpecialDate ) {
            for (let key in daysOpen) {
                if (daysOpen[weekDay]) {
                    timeSlots = daysOpen[weekDay].slots;
                    break;
                }
            }
        }

        const dataToSend = new FormData();
        dataToSend.append('date', selectedDate);
        dataToSend.append('slots', JSON.stringify( timeSlots ) );
        dataToSend.append('staff_id', staffID);
        
        fetch('/wp-json/bookify/v1/available-slots', {
			headers: {
                'X-WP-Nonce': wpbApp.nonce
            },
            method: 'POST',
            body: dataToSend,
        })
        .then(response => response.json())
        .then(data => {
			this.setState({ 
				date: selectedDate,
				slots: data.available_slots,
			});
        })
		.catch(error => {
            console.error('Error:', error);
        })
    };

	handleSlotClick = (event) => {
		const slot = event.currentTarget.getAttribute('data-slot');
		this.setState({ 
			slot: slot,
		});
	};

	renderSlots = ( slots ) => {

		const { slot } = this.state;
        
		return (
			<div>
				<Typography variant="h6" gutterBottom sx={{ color: '#036666', fontSize: '16px', marginTop: '15px', textTransform:'none' }}>{__('Time', 'bookify')}</Typography>
				<Paper elevation={0} sx={{ padding: '20px', borderRadius: '8px', marginTop: '10px' }}>	
					<Grid container spacing={1}>
						<Grid item sx={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flexDirection: 'row' }}>
							{
								slots.map((eachSlot) => (
									<Box
										sx={{
											background: '#ECEFF2',
											width: 'fit-content',
											borderRadius: '4px',
											padding: '7px 11px',
											cursor: 'pointer',
											borderWidth: '1px',
											borderStyle: 'solid',
											borderColor: slot != eachSlot ? '#ECEFF2' : '#036666'
										}}
										data-slot={eachSlot}
										onClick={this.handleSlotClick}
									>
										<Typography sx={{ fontSize: '12px', fontWeight: '600' }}>{eachSlot}</Typography>
									</Box>	
								))
							}							
						</Grid>
					</Grid>
				</Paper>
			</div>
		)
    };

    render() {

		const { data } = this.props;
		const { divRef, slots, DateLoading, date } = this.state;

		dayjs.extend(updateLocale);

		const weekDays = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };

		dayjs.updateLocale('en', {
			weekStart: weekDays[data.weekStartsOn]
		});

		let maxDate = dayjs().add(50, 'year');
        if ( data.toggleLimitedBooking == "Enable" ) {
            maxDate = dayjs().add(parseInt(data.limitedBookingMonths), 'month');
        }

		return (
			<div className='bookify-tab-panel-wrapper'>
				<div className='bookify-tab-panel-inner-wrapper'>
					<div className='bookify-tab-panel-header'>{__('Date & Time', 'bookify')}</div>
					<div className='bookify-tab-panel-body'>
						<Box>
							<Typography variant="h6" gutterBottom sx={{ color: '#036666', fontSize: '16px', textTransform:'none' }}>{__('Date', 'bookify')}</Typography>
							<Paper elevation={0} sx={{ padding: '0', borderRadius: '8px' }}>
								<LocalizationProvider dateAdapter={AdapterDayjs}>
									<DateCalendar 
										loading={DateLoading}
										renderLoading={() => <DayCalendarSkeleton />}
										disablePast={true}
										maxDate={maxDate}
										shouldDisableDate={this.shouldDisableDate}
										onChange={this.handleDateChange}
										views={['year', 'month', 'day']}
										value={date ? dayjs(date) : null}
										dayOfWeekFormatter={(weekday) => `${weekday.format('ddd').toUpperCase()}`}
										sx={{
											'.MuiDayCalendar-loadingContainer': {
												display:'block'
											},
											'.MuiDayCalendarSkeleton-week': {
												justifyContent: 'space-between',
											}
										}}
									/>
								</LocalizationProvider>
							</Paper>
							<div ref={divRef} tabIndex="0" className='wpbfOutlineNone'>
								{
									slots.length > 0 ? this.renderSlots( slots ) : ''
								}
							</div>
						</Box>
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

export default DateAndTimeTab;
