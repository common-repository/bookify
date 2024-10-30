import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { 
    Paper, Typography, Box
} from '@mui/material';
import ReactApexChart from 'react-apexcharts';

class CustomerStatus extends Component {

    render() {

        const { customerStatuses } = this.props;

        return (
            <Paper sx={{padding:"15px", boxShadow:"unset"}}>
                <Box component="div">
                    <Typography variant={"h6"}>{__('Customer Status', 'bookify')}</Typography>
                </Box>
                <Box component="div" sx={{ display: "flex", alignItems: "center", pt:"10px", pb:"10px"}}>
                    <Box component="span" sx={{width:"100%"}}>
                        <ReactApexChart
                            options={{
                                chart: {
                                    type: 'donut'
                                },
                                colors: ['#FEC600', '#00AEFF', '#48F1A7', '#FF0000',],
                                labels: Object.keys(customerStatuses).map(key => key),
                                dataLabels: {
                                    enabled: true,
                                    style: {
                                        colors: ['#000000'],
                                        fontWeight: '100',
                                    }
                                }
                            }}
                            series={Object.values(customerStatuses).map(value => value)}
                            type="donut"    
                            height={365}
                        />
                    </Box>
                </Box>
            </Paper>
        )
    }
}

export default CustomerStatus;