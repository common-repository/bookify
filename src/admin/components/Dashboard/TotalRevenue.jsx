import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { 
    Paper, Typography, Box,
    Chip, FormControl, Select, MenuItem
} from '@mui/material';
import ReactApexChart from 'react-apexcharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

class TotalRevenue extends Component {
    state = {
        totalRevenueDefault: 'today',
        RevenueData: {
            ChartData: [0,0],
            Text: '',
            Percentage: 0,
            Increase: true,
            totalRevenue: 0.00 
        }
    };

    componentDidUpdate(prevProps) {
        const { revenueSection } = this.props;
        if (revenueSection !== prevProps.revenueSection) {
            this.setState({
                RevenueData: {
                    ChartData: revenueSection.chart_data,
                    Text: revenueSection.text,
                    Percentage: revenueSection.percentage,
                    Increase: revenueSection.increase,
                    totalRevenue: revenueSection.total_revenue,
                }
            });
        }
    }

    handleRevenueChange = ( event ) => {
        const revenueHandler = event.target.value;
        const dataToSend = new FormData();
        dataToSend.append('reference', revenueHandler);
        fetch('/wp-json/bookify/v1/get-total-revenue', {
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
                    totalRevenueDefault: revenueHandler,
                    RevenueData: {
                        ChartData: response.revenue_section.chart_data,
                        Text: response.revenue_section.text,
                        Percentage: response.revenue_section.percentage,
                        Increase: response.revenue_section.increase,
                        totalRevenue: response.revenue_section.total_revenue,
                    }
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
        })
    }

    render() {

        const { dataHandler, matchedCurrency } = this.props;
        const { totalRevenueDefault, RevenueData } = this.state;

        return (
            <Paper sx={{padding:"15px", boxShadow:"unset"}}>
                <Box component="div" sx={{display:"flex", justifyContent:"space-between", pb:"0.5rem"}}>
                    <Box component="div">
                        <Typography variant={"h6"}>{__('Total Revenue', 'bookify')}</Typography>
                    </Box>
                    <Box component="div">
                        <FormControl>
                            <Select 
                                name="totalRevenueDefault" 
                                value={totalRevenueDefault} 
                                onChange={this.handleRevenueChange}
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
                        <Typography sx={{fontSize:"30px", fontWeight:"700"}}>{ matchedCurrency.symbol + RevenueData.totalRevenue}</Typography>
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
                                name: 'Payment(s)',
                                data: RevenueData.ChartData
                            }]}
                            type="area"
                            height={60}
                        />
                    </Box>
                </Box>
                <Box component="div" sx={{display:"flex", pt:"10px", pb:"10px"}}>
                    <Chip
                        variant="filled"
                        icon={RevenueData.Increase ? <TrendingUpIcon color={'success'}/> : <TrendingDownIcon color={'error'}/>}
                        label={`${RevenueData.Percentage}%`}
                        size="small"
                        sx={{color:RevenueData.Increase ? "#2E7D32" : "#D32F2F" , mr:"5px"}}
                    />
                    <Typography sx={{fontSize:"15px"}}>{RevenueData.Text}</Typography>
                </Box>
            </Paper>
        )
    }
}

export default TotalRevenue;