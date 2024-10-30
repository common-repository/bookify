import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { 
    Paper, Typography, Box,
    Chip, FormControl, Select, MenuItem
} from '@mui/material';
import ReactApexChart from 'react-apexcharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

class ApprovedAppointment extends Component {
    state = {
        appointmentDefault: 'today',
        AppointmentData: {
            ChartData: [0,0],
            Text: '',
            Percentage: 0,
            Increase: true,
            totalCount: 0
        }
    };

    componentDidUpdate(prevProps) {
        const { approvedAppointment } = this.props;
        if (approvedAppointment !== prevProps.approvedAppointment) {
            this.setState({
                AppointmentData: {
                    ChartData: approvedAppointment.chart_data,
                    Text: approvedAppointment.text,
                    Percentage: approvedAppointment.percentage,
                    Increase: approvedAppointment.increase,
                    totalCount: approvedAppointment.total_count,
                }
            });
        }
    }

    handleAppointmentChange = ( event ) => {
        const appointmentHandler = event.target.value;
        const dataToSend = new FormData();
        dataToSend.append('reference', appointmentHandler);
        fetch('/wp-json/bookify/v1/get-approved-appointment', {
            method: 'POST',
            headers: {
                'X-WP-Nonce': wpApiSettings.nonce
            },
            body: dataToSend,
        })
        .then(response => response.json())
        .then(response => {
            if ( response.success ) {
                this.setState({ 
                    appointmentDefault: appointmentHandler,
                    AppointmentData: {
                        ChartData: response.approved_appointment.chart_data,
                        Text: response.approved_appointment.text,
                        Percentage: response.approved_appointment.percentage,
                        Increase: response.approved_appointment.increase,
                        totalCount: response.approved_appointment.total_count,
                    }
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
        })
    }

    render() {

        const { dataHandler } = this.props;
        const { appointmentDefault, AppointmentData } = this.state;

        return (
            <Paper sx={{padding:"15px", boxShadow:"unset"}}>
                <Box component="div" sx={{display:"flex", justifyContent:"space-between", pb:"0.5rem"}}>
                    <Box component="div">
                        <Typography variant={"h6"}>{__('Approved Appointments', 'bookify')}</Typography>
                    </Box>
                    <Box component="div">
                        <FormControl>
                            <Select 
                                name="appointmentDefault" 
                                value={appointmentDefault} 
                                onChange={this.handleAppointmentChange}
                                size={"small"}
                            >
                                {Object.entries(dataHandler).map(([key, value]) => (
                                    <MenuItem key={key} value={key}>
                                        {value}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </Box>
                <Box component="div" sx={{ display: "flex", alignItems: "center", width:"100%", pt:"10px", pb:"10px"}}>
                    <Box component="span" sx={{width:"50%"}}>
                        <Typography sx={{fontSize:"30px", fontWeight:"700"}}>{AppointmentData.totalCount}</Typography>
                    </Box>
                    <Box component="span" sx={{width:"50%"}}>
                        <ReactApexChart
                            options={{
                                chart: {
                                    id: 'support-chart',
                                    sparkline: {
                                        enabled: true
                                    }
                                },
                                dataLabels: {
                                    enabled: false
                                },
                                stroke: {
                                    curve: 'smooth',
                                    width: 1
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
                                colors: ['#15CAB8']
                            }}
                            series={[{
                                name: 'Appointment(s)',
                                data: AppointmentData.ChartData
                            }]}
                            type="area"
                            height={60}
                        />
                    </Box>
                </Box>
                <Box component="div" sx={{display:"flex", pt:"10px", pb:"10px"}}>
                    <Chip
                        variant="filled"
                        icon={AppointmentData.Increase ? <TrendingUpIcon color={'success'}/> : <TrendingDownIcon color={'error'}/>}
                        label={`${AppointmentData.Percentage}%`}
                        size="small"
                        sx={{color:AppointmentData.Increase ? "#2E7D32" : "#D32F2F", mr:"5px"}}
                    />
                    <Typography sx={{fontSize:"15px"}}>{AppointmentData.Text}</Typography>
                </Box>
            </Paper>
        )
    }

}

export default ApprovedAppointment;