import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Stack, Typography, Button, Card, Divider, Paper } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import SortIcon from '@mui/icons-material/Sort';
import TuneIcon from '@mui/icons-material/Tune';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import PaymentIcon from '@mui/icons-material/Payment';
import SyncIcon from '@mui/icons-material/Sync';
import NotificationsIcon from '@mui/icons-material/Notifications';
import GeneralSettings from './GeneralSettings';
import CompanyDetails from './CompanyDetails';
import IntegrationSettings from './IntegrationSettings';
import PaymentDetails from './PaymentDetails';
import NotificationSettings from './NotificationSettings';
import GearIcon from '../../assets/gear.svg';
import CashBagIcon from '../../assets/cashbag.svg';
import CompanyIcon from '../../assets/company.svg';
import MailBoxIcon from '../../assets/mailbox.svg';
import IntegrationIcon from '../../assets/chain.svg';
import { 
    openDialog, closeDialog
} from '../../functions';

class Settings extends Component {
    state = {
        settings: [],
        GeneralOpen: false,
        CompanyOpen: false,
        PaymentOpen: false,
        IntegrationOpen: false,
        NotificationOpen: false,
        theme: createTheme({
            typography: {
                h2: {
                    fontSize: "2.5em",
                    textTransform: "capitalize",
                },
                h5: {
                    fontSize: "1.5em",
                    textTransform: "capitalize",
                    color: "#000000"
                },
            },
            components: {
                MuiPaper: {
                    variants: [
                        {
                            props: { variant: "bookify-variant" },
                            style: {
                                width: "4em", 
                                height: "4em", 
                                borderRadius: "20px", 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center",
                            },
                        },
                    ]
                }
            }
        }),
    };

    componentDidMount() {

        fetch('/wp-json/bookify/v1/settings', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': wpApiSettings.nonce
            }
        })
        .then(response => response.json())
        .then(settings => {
            this.setState({ settings });
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        })

        const title = window.wp.hooks.applyFilters('bookify_settings_title', 'Settings');
        this.setState({ title });

    }

    render() {

        const { settings, title, theme } = this.state;

        return (
            <ThemeProvider theme={theme}>
                <Stack spacing={2} mt={2} mb={2} direction="row" alignItems="center">
                    <SortIcon fontSize="large"/>
                    <Typography variant="h2">{title}</Typography>
                </Stack>
                
                <Divider variant="middle"/>

                <Grid container columns={14} spacing={4} mt={2} disableEqualOverflow>
                    <Grid item xs={4}>
                        <Card sx={{
                                boxShadow: "1px 1px 10px #b1afaf",
                                backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url(${GearIcon})`,
                                backgroundSize: "50%",
                                backgroundPosition: "right bottom",
                                backgroundRepeat: "no-repeat",
                                borderRadius: "20px",
                            }}>  
                            <Button fullWidth size="large" sx={{height:"18em"}} onClick={() => openDialog(this.state, this.setState.bind(this), 'GeneralOpen')}>
                                <Stack spacing={2} direction="row" alignItems="center">
                                    <Paper variant="bookify-variant" sx={{backgroundColor: "#f5b334"}}>
                                        <TuneIcon fontSize="large"/>
                                    </Paper>
                                    <Typography variant="h5">{ __('General Settings', 'bookify') }</Typography>
                                </Stack>
                            </Button>
                            <GeneralSettings
                                open={this.state.GeneralOpen}
                                onClose={() => closeDialog(this.state, this.setState.bind(this), 'GeneralOpen')}
                                savedGeneralSettings={settings.general}
                            />
                        </Card>
                    </Grid>
                    <Grid item xs={4}>
                        <Card sx={{
                                boxShadow: "1px 1px 10px #b1afaf",
                                backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url(${CompanyIcon})`,
                                backgroundSize: "50%",
                                backgroundPosition: "right bottom",
                                backgroundRepeat: "no-repeat",
                                borderRadius: "20px",
                            }}>  
                            <Button fullWidth size="large" sx={{height:"18em"}} onClick={() => openDialog(this.state, this.setState.bind(this), 'CompanyOpen')}>
                                <Stack spacing={2} direction="row" alignItems="center">
                                    <Paper variant="bookify-variant" sx={{backgroundColor: "#53d56c"}}>
                                        <BusinessCenterIcon fontSize="large"/>
                                    </Paper>
                                    <Typography variant="h5">{ __('Company Details', 'bookify') }</Typography>
                                </Stack>
                            </Button>
                            <CompanyDetails
                                open={this.state.CompanyOpen}
                                onClose={() => closeDialog(this.state, this.setState.bind(this), 'CompanyOpen')}
                                savedCompanyDetails={settings.company}
                            />
                        </Card>
                    </Grid>
                    <Grid item xs={4}>
                        <Card sx={{
                                boxShadow: "1px 1px 10px #b1afaf",
                                backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url(${CashBagIcon})`,
                                backgroundSize: "50%",
                                backgroundPosition: "right bottom",
                                backgroundRepeat: "no-repeat",
                                borderRadius: "20px",
                            }}>  
                            <Button fullWidth size="large" sx={{height:"18em"}} onClick={() => openDialog(this.state, this.setState.bind(this), 'PaymentOpen')}>
                                <Stack spacing={2} direction="row" alignItems="center">
                                    <Paper variant="bookify-variant" sx={{backgroundColor: "#26c0d6"}}>
                                        <PaymentIcon fontSize="large"/>
                                    </Paper>
                                    <Typography variant="h5">{ __('Payment Settings', 'bookify') }</Typography>
                                </Stack>
                            </Button>
                            <PaymentDetails
                                open={this.state.PaymentOpen}
                                onClose={() => closeDialog(this.state, this.setState.bind(this), 'PaymentOpen')}
                                savedPaymentDetails={settings.payment}
                            />
                        </Card>
                    </Grid>
                    {/* <Grid item xs={4}>
                        <Card sx={{
                                boxShadow: "1px 1px 10px #b1afaf",
                                backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url(${IntegrationIcon})`,
                                backgroundSize: "55%",
                                backgroundPosition: "17rem 4em",
                                backgroundRepeat: "no-repeat",
                                borderRadius: "20px",
                            }}>  
                            <Button fullWidth size="large" sx={{height:"18em"}} onClick={() => openDialog(this.state, this.setState.bind(this), 'IntegrationOpen')}>
                                <Stack spacing={2} direction="row" alignItems="center">
                                    <Paper variant="bookify-variant" sx={{backgroundColor: "#fc427b"}}>
                                        <SyncIcon fontSize="large"/>
                                    </Paper>
                                    <Typography variant="h5">{ __('Integration Settings', 'bookify') }</Typography>
                                </Stack>
                            </Button>
                            <IntegrationSettings
                                open={this.state.IntegrationOpen}
                                onClose={() => closeDialog(this.state, this.setState.bind(this), 'IntegrationOpen')}
                                savedIntegrationSettings={settings.integration}
                            />
                        </Card>
                    </Grid> */}
                    <Grid item xs={4}>
                        <Card sx={{
                                boxShadow: "1px 1px 10px #b1afaf",
                                backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url(${MailBoxIcon})`,
                                backgroundSize: "50%",
                                backgroundPosition: "right bottom",
                                backgroundRepeat: "no-repeat",
                                borderRadius: "20px",
                            }}>  
                            <Button fullWidth size="large" sx={{height:"18em"}} onClick={() => openDialog(this.state, this.setState.bind(this), 'NotificationOpen')}>
                                <Stack spacing={2} direction="row" alignItems="center">
                                    <Paper variant="bookify-variant" sx={{backgroundColor: "#95afc0"}}>
                                        <NotificationsIcon fontSize="large"/>
                                    </Paper>
                                    <Typography variant="h5">{ __('Notification Settings', 'bookify') }</Typography>
                                </Stack>
                            </Button>
                            <NotificationSettings
                                open={this.state.NotificationOpen}
                                onClose={() => closeDialog(this.state, this.setState.bind(this), 'NotificationOpen')}
                                savedNotificationSettings={settings.notification}
                            />
                        </Card>
                    </Grid>
                </Grid>
            </ThemeProvider>
        );
    }
}

export default Settings;
