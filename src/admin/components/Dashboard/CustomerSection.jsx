import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { 
    Paper, Typography, Box,
    Chip, FormControl, Select, MenuItem
} from '@mui/material';
import ReactApexChart from 'react-apexcharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

class CustomerSection extends Component {
    state = {
        customerDefault: 'today',
        CustomerData: {
            ChartData: [0,0],
            Text: '',
            Percentage: 0,
            Increase: true,
            totalCount: 0
        }
    };

    componentDidUpdate(prevProps) {
        const { customerSection } = this.props;
        if (customerSection !== prevProps.customerSection) {
            this.setState({
                CustomerData: {
                    ChartData: customerSection.chart_data,
                    Text: customerSection.text,
                    Percentage: customerSection.percentage,
                    Increase: customerSection.increase,
                    totalCount: customerSection.total_count,
                }
            });
        }
    }

    handleCustomerChange = ( event ) => {
        const customerHandler = event.target.value;
        const dataToSend = new FormData();
        dataToSend.append('reference', customerHandler);
        fetch('/wp-json/bookify/v1/get-total-customer', {
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
                    customerDefault: customerHandler,
                    CustomerData: {
                        ChartData: response.customer_section.chart_data,
                        Text: response.customer_section.text,
                        Percentage: response.customer_section.percentage,
                        Increase: response.customer_section.increase,
                        totalCount: response.customer_section.total_count,
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
        const { customerDefault, CustomerData } = this.state;

        return(
            <Paper sx={{padding:"15px", boxShadow:"unset"}}>
                <Box component="div" sx={{display:"flex", justifyContent:"space-between", pb:"0.5rem"}}>
                    <Box component="div">
                        <Typography variant={"h6"}>{__('New Customer', 'bookify')}</Typography>
                    </Box>
                    <Box component="div">
                        <FormControl>
                            <Select 
                                name="customerDefault" 
                                value={customerDefault} 
                                onChange={this.handleCustomerChange}
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
                        <Typography sx={{fontSize:"30px", fontWeight:"700"}}>{CustomerData.totalCount}</Typography>
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
                                name: 'Customer(s)',
                                data: CustomerData.ChartData
                            }]}
                            type="area"
                            height={60}
                        />
                    </Box>
                </Box>
                <Box component="div" sx={{display:"flex", pt:"10px", pb:"10px"}}>
                    <Chip
                        variant="filled"
                        icon={CustomerData.Increase ? <TrendingUpIcon color={'success'}/> : <TrendingDownIcon color={'error'}/>}
                        label={`${CustomerData.Percentage}%`}
                        size="small"
                        sx={{color:CustomerData.Increase ? "#2E7D32" : "#D32F2F", mr:"5px"}}
                    />
                    <Typography sx={{fontSize:"15px"}}>{CustomerData.Text}</Typography>
                </Box>
            </Paper>
        )
    }
}

export default CustomerSection;