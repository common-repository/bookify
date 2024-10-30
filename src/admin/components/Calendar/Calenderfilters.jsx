import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import {
  FormControl, Select, MenuItem, Grid
} from '@mui/material';

class CalendarFilters extends Component {
    state = {
      selectedStaff: ' ',
      selectedService: ' ',
    };

  handleStaffChange = (event) => {
    const { selectedService } = this.state;
    const { fetchData } = this.props;
    const value = event.target.value;
    this.setState({ selectedStaff: value });
    fetchData(1, 10, value, selectedService);
  };

  handleServiceChange = (event) => {
    const { selectedStaff } = this.state;
    const { fetchData } = this.props;
    const value = event.target.value;
    this.setState({ selectedService: value });
    fetchData(1, 10, selectedStaff, value);
  };

  render() {
    const { selectedStaff, selectedService } = this.state;
    const { staffs, services } = this.props;

    return (
      <Grid container spacing={2}>
        
      </Grid>
    );
  }
}

export default CalendarFilters;
