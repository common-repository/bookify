import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import {
  FormControl, Select, MenuItem, InputLabel, Grid
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

class PaymentFilters extends Component {
    state = {
        paymentStatus: [
            'Pending',
            'Paid',
            'Partially Paid',
        ]
    };

  handleDateChange = ( date ) => {
    const { setState, fetchPaymentData, filterStaff, filterService, filterCustomer, filterStatus } = this.props;
    const value = dayjs( date ).format( 'YYYY-MM-DD' );
    setState({ filterDate: value });
    fetchPaymentData(1, 10, value, filterStaff, filterService, filterCustomer, filterStatus);
  };

  handleStaffChange = ( event ) => {
    const { setState, fetchPaymentData, filterDate, filterService, filterCustomer, filterStatus } = this.props;
    const { value } = event.target;
    if ( value && 'none' != value ) {
        setState({ filterStaff: value });
        fetchPaymentData(1, 10, filterDate, value, filterService, filterCustomer, filterStatus);
    }
  };
  
  handleServiceChange = ( event ) => {
    const { setState, fetchPaymentData, filterDate, filterStaff, filterCustomer, filterStatus } = this.props;
    const { value } = event.target;
    if ( value && 'none' != value ) {
        setState({ filterService: value });
        fetchPaymentData(1, 10, filterDate, filterStaff, value, filterCustomer, filterStatus);
    }
  };

  handleCustomerChange = ( event ) => {
    const { setState, fetchPaymentData, filterDate, filterStaff, filterService, filterStatus } = this.props;
    const { value } = event.target;
    if ( value && 'none' != value ) {
        setState({ filterCustomer: value });
        fetchPaymentData(1, 10, filterDate, filterStaff, filterService, value, filterStatus);
    }
  };

  handleStatusChange = ( event ) => {
    const { setState, fetchPaymentData, filterDate, filterStaff, filterService, filterCustomer } = this.props;
    const { value } = event.target;
    if ( value && 'none' != value ) {
        setState({ filterStatus: value });
        fetchPaymentData(1, 10, filterDate, filterStaff, filterService, filterCustomer, value);
    }
  };

  render() {

    const { paymentStatus } = this.state;
    const { staffs, services, customers, filterStaff, filterService, filterCustomer, filterStatus, filterDate } = this.props;

    return (
        <Grid container spacing={5}>
            <Grid item>
                <InputLabel sx={{fontWeight:600, mb:1}}>{__('Date', 'bookify')}</InputLabel>
                <FormControl sx={{backgroundColor:'#ffffff'}} size="medium">
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            onChange={this.handleDateChange}
                            sx={{width:225}}
                        />
                    </LocalizationProvider>
                </FormControl>
            </Grid>
            <Grid item>
                <InputLabel sx={{fontWeight:600, mb:1}}>{__('Staffs', 'bookify')}</InputLabel>
                <FormControl sx={{minWidth:225, backgroundColor:'#ffffff'}}>
                    <Select
                    name="BookifyPaymentStaffFilter"
                    value={filterStaff}
                    onChange={this.handleStaffChange}
                    MenuProps={{
                        PaperProps: {
                            style: {
                                maxHeight: 300,
                            },
                        },
                    }}
                    >
                    <MenuItem key="filterStaff" value="none">
                        {__('Select Staff', 'bookify')}
                    </MenuItem>
                    {staffs.map((value) => (
                        <MenuItem key={value.id} value={value.id}>
                            {value.staff_name}
                        </MenuItem>
                    ))}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item>
                <InputLabel sx={{fontWeight:600, mb:1}}>{__('Services', 'bookify')}</InputLabel> 
                <FormControl sx={{minWidth:225, backgroundColor:'#ffffff'}}>
                    <Select
                    name="BookifyPaymentServiceFilter"
                    value={filterService}
                    onChange={this.handleServiceChange}
                    MenuProps={{
                        PaperProps: {
                            style: {
                                maxHeight: 300,
                            },
                        },
                    }}
                    >
                    <MenuItem key="filterService" value="none">
                        {__('Select Service', 'bookify')}
                    </MenuItem>
                    {services.map((value) => (
                        <MenuItem key={value.id} value={value.id}>
                            {value.service_name}
                        </MenuItem>
                    ))}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item>
                <InputLabel sx={{fontWeight:600, mb:1}}>{__('Customer', 'bookify')}</InputLabel>
                <FormControl sx={{minWidth:225, backgroundColor:'#ffffff'}}>
                    <Select
                    name="BookifyPaymentCustomerFilter"
                    value={filterCustomer}
                    onChange={this.handleCustomerChange}
                    MenuProps={{
                        PaperProps: {
                            style: {
                                maxHeight: 300,
                            },
                        },
                    }}
                    >
                    <MenuItem key="filterCustomer" value="none">
                        {__('Select Customer', 'bookify')}
                    </MenuItem>
                    {customers.map((value) => (
                        <MenuItem key={value.id} value={value.id}>
                            {value.customer_name}
                        </MenuItem>
                    ))}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item>
                <InputLabel sx={{fontWeight:600, mb:1}}>{__('Statuses', 'bookify')}</InputLabel>
                <FormControl sx={{minWidth:225, backgroundColor:'#ffffff'}}>
                    
                    <Select
                    name="BookifyPaymentStatusFilter"
                    value={filterStatus}
                    onChange={this.handleStatusChange}
                    MenuProps={{
                        PaperProps: {
                            style: {
                                maxHeight: 300,
                            },
                        },
                    }}
                    >
                    <MenuItem key="filterStatus" value="none">
                        {__('Select Status', 'bookify')}
                    </MenuItem>
                    {paymentStatus.map((value) => (
                        <MenuItem key={value} value={value}>
                            {value}
                        </MenuItem>
                    ))}
                    </Select>
                </FormControl>
            </Grid>
        </Grid>
    );
  }
}

export default PaymentFilters;