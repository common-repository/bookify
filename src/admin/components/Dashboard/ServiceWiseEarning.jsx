import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { 
    Paper, Typography, Box,
    FormControl, Select, MenuItem
} from '@mui/material';
import ReactApexChart from 'react-apexcharts';

class ServiceWiseEarning extends Component { 

    state = {
        serviceWiseEarning: 'none',
        serviceWiseEarningChart: {
            'Jan': 0,
            'Feb': 0,
            'Mar': 0,
            'Apr': 0,
            'May': 0,
            'Jun': 0,
            'Jul': 0,
            'Aug': 0,
            'Sep': 0,
            'Oct': 0,
            'Nov': 0,
            'Dec': 0,
        },
    }

    handleServiceChange = ( event ) => {
        const serviceId = event.target.value;

        const dataToSend = new FormData();
        dataToSend.append('service_id', serviceId);
        fetch('/wp-json/bookify/v1/service-earning', {
            method: 'POST',
            headers: {
                'X-WP-Nonce': wpApiSettings.nonce
            },
            body: dataToSend,
        })
        .then(response => response.json())
        .then(response => {
            this.setState({ 
                serviceWiseEarning: serviceId,
                serviceWiseEarningChart: response.service_earning_chart
            });
        })
        .catch(error => {
            console.error('Error:', error);
        })
    }
    
    render() {

        const { services } = this.props;
        const { serviceWiseEarning, serviceWiseEarningChart } = this.state;

        return (
            <Paper sx={{padding:"15px", boxShadow:"unset"}}>
                <Box component="div" sx={{display:"flex", justifyContent:"space-between"}}>
                    <Box component="div">
                        <Typography variant={"h6"}>{__('Service Wise Earning', 'bookify')}</Typography>
                    </Box>
                    <Box component="div">
                        <FormControl sx={{width:"10rem"}}>
                            <Select 
                                name="Services" 
                                value={serviceWiseEarning} 
                                onChange={this.handleServiceChange}
                                size={"small"}
                            >
                                <MenuItem key={"none"} value={"none"}>
                                    {__('Select Service', 'bookify')}
                                </MenuItem>
                                {services.map((value) => (
                                    <MenuItem key={value.id} value={value.id}>
                                        {value.service_name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </Box>
                <Box component="div" sx={{ display: "flex", alignItems: "center", pt:"10px", pb:"10px"}}>
                    <Box component="span" sx={{width:"100%"}}>
                        <ReactApexChart
                            options={{
                                chart: {
                                    id: 'service-wise-earning-chart',
                                    sparkline: {
                                        enabled: false  
                                    },
                                    toolbar: {
                                        show: false
                                    }
                                },
                                dataLabels: {
                                    enabled: false
                                },
                                stroke: {
                                    width: 0
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
                                    y: {
                                        show: false
                                    },
                                    marker: {
                                        show: false
                                    }
                                },
                                colors: ['#44A6E9'],
                                xaxis: {
                                    categories: Object.keys(serviceWiseEarningChart).map(key => key)
                                },
                                yaxis: {
                                    title: {
                                        text: 'Earning(s)'
                                    }
                                },
                            }}
                            series={[{
                                name: 'Cost',
                                data: Object.values(serviceWiseEarningChart).map(value => value)
                            }]}
                            type="bar"
                            height={350}
                        />
                    </Box>
                </Box>
            </Paper>
        )
    }

}

export default ServiceWiseEarning;