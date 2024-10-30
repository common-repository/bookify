import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { 
    Paper, Typography, Box
} from '@mui/material';
import ReactApexChart from 'react-apexcharts';

class StaffWiseTotalAppointments extends Component { 

    render() {

        const { staffWiseAppointmentsChart } = this.props;

        return ( 
            <Paper sx={{padding:"15px", boxShadow:"unset"}}>
                <Box component="div">
                    <Typography variant={"h6"}>{__('Staff Wise Total No. Of Appointments', 'bookify')}</Typography>
                </Box>
                <Box component="div" sx={{ display: "flex", alignItems: "center", width:"100%", pt:"15px", pb:"10px"}}>
                    <Box component="span" sx={{width:"100%"}}>
                        <ReactApexChart
                            options={{
                                chart: {
                                    id: 'staff-wise-total-appointment-chart',
                                    sparkline: {
                                        enabled: false
                                    },
                                    toolbar: {
                                        show: false
                                    },
                                    zoom: {
                                        enabled: false
                                    }
                                },
                                dataLabels: {
                                    enabled: false
                                },
                                stroke: {
                                    curve: 'smooth',
                                    width: 1
                                },
                                grid: {
                                    show: false
                                },
                                tooltip: {
                                    fixed: {
                                        enabled: false
                                    },
                                    x: {
                                        show: false
                                    },
                                    marker: {
                                        show: false
                                    }
                                },
                                xaxis: {
                                    categories: Object.keys(staffWiseAppointmentsChart).map(key => key)
                                },
                                yaxis: {
                                    title: {
                                        text: 'Appointment(s)'
                                    }
                                },
                                colors: ['#FF8548'],
                            }}
                            series={[{
                                name: 'Appointment(s)',
                                data: Object.values(staffWiseAppointmentsChart).map(value => value)
                            }]}
                            type="area"
                            height={350}
                        />
                    </Box>
                </Box>
            </Paper>
        )
    }
}

export default StaffWiseTotalAppointments;