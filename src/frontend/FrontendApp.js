import React, { Component } from 'react';
import { styled } from '@mui/system';
import { Tabs as BaseTabs } from '@mui/base/Tabs';
import { TabsList as BaseTabsList } from '@mui/base/TabsList';
import { TabPanel as BaseTabPanel } from '@mui/base/TabPanel';
import { Tab as BaseTab, tabClasses } from '@mui/base/Tab';
import { 
    CalendarMonthOutlined, 
    PersonOutlineOutlined, 
    PaymentOutlined, 
    SettingsOutlined, 
    DoneOutlined, 
    LocationOnOutlined,
    PersonOutlined
} from '@mui/icons-material';
import { __ } from '@wordpress/i18n';
import DateAndTimeTab from './components/DateAndTimeTab';
import ServiceTab from './components/ServiceTab';
import UserInfoTab from './components/UserInfoTab';
import PaymentsTab from './components/PaymentsTab';
import ConfirmationTab from './components/ConfirmationTab';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import currencies from './currencies.json';
import { FormContext } from './context/FormContext';

const theme = createTheme({
    components: {
        MuiButtonBase: {
            defaultProps: {
                disableRipple: true // Disable ripple for all components inheriting from ButtonBase
            },
        },
    },
});

class FrontendApp extends Component {

    static contextType = FormContext;

    state = {
        categories: [],
        services: [],
        locations: [],
        weekStartsOn: 0, // 0 = Sunday
        toggleLimitedBooking: 'Disable',
        limitedBookingMonths: 0,
        currencySymbol: '',
        currencyCode: 'USD',
        currentTab: 0,
        paymentSettings: '',
        dataLoading: true,
    };

    handleChange = (event, newValue) => {
        this.setState({ currentTab: newValue });
    };

    setTab = (newValue) => {
        this.setState({ currentTab: newValue });
    };

    componentDidMount() {
        const LocationTab = window.LocationTab;
    
        this.setState({ dataLoading: true });
    
        const promises = [this.fetchSettings()];
    
        if ( LocationTab ) {
            promises.push( this.fetchLocations() );
        } else {
            promises.push( this.fetchCategories(), this.fetchServices() );
        }
    
        Promise.all( promises )
            .then(() => {
                this.setState({ dataLoading: false });
            })
            .catch((error) => {
                console.error( 'Error fetching data:', error );
                this.setState({ dataLoading: false });
            });
    }

    fetchSettings() {
        return fetch(`${wpbApp.root}bookify/frontend/v1/settings`, {
            method: 'GET',
            headers: {
                'X-WP-Nonce': wpbApp.nonce,
                'Content-Type': 'application/json',
            }
        })
        .then((response) => response.json())
        .then((data) => {
            const matchedCurrency = Object.values(currencies).find(eachCurrency => eachCurrency.code === data.general.DefaultGeneralCurrencies);

            this.setState({ 
                currencySymbol: matchedCurrency.symbol, 
                currencyCode: matchedCurrency.code,
                weekStartsOn: data.general.DefaultWeekStartOn, 
                toggleLimitedBooking: data.general.DefaultPriorToBooking, 
                limitedBookingMonths: data.general.PriorTimeToBooking,
                paymentSettings: data.payment,
            });
        })
        .catch((error) => {
            console.error('Error fetching settings:', error);
        });
    
    }

    fetchCategories() {
        return fetch(`${wpbApp.root}bookify/frontend/v1/get-categories`, {
            method: 'GET',
            headers: {
                'X-WP-Nonce': wpbApp.nonce,
                'Content-Type': 'application/json',
            }
        })
        .then((response) => response.json())
        .then((data) => {
            this.setState({ categories: data.categories });
        })
        .catch((error) => {
            console.error('Error fetching categories:', error);
        });
    }

    fetchServices() {
        return fetch(`${wpbApp.root}bookify/frontend/v1/get-services`, {
            method: 'GET',
            headers: {
                'X-WP-Nonce': wpbApp.nonce,
                'Content-Type': 'application/json',
            }
        })
        .then((response) => response.json())
        .then((data) => {
            this.setState({ services: data.services });
        })
        .catch((error) => {
            console.error('Error fetching services:', error);
        });
    }

    fetchLocations() {
        return fetch(`${wpbApp.root}bookify/v1/get-locations`, {
            method: 'GET',
            headers: {
                'X-WP-Nonce': wpbApp.nonce,
                'Content-Type': 'application/json',
            }
        })
        .then((response) => response.json())
        .then((data) => {
            this.setState({ locations: data.locations });
        })
        .catch((error) => {
            console.error('Error fetching services:', error);
        });
    }

    render() {
        const { role } = this.props;
        const { currentTab, paymentSettings } = this.state;
        const LocationTab = window.LocationTab;
        const StaffTab = window.StaffTab;

        const Tab = styled(BaseTab)`
            font-family: 'IBM Plex Sans', sans-serif;
            color: white;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: bold;
            background-color: transparent;
            width: 100%;
            padding: 12px;
            border: none;
            border-radius: 7px;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            gap: 5px;
            outline: none;

            & > svg {
                padding: 6px;
                background: #4D545A;
                color: #fff;
                border-radius: 100%;
            }

            &.${tabClasses.selected} > svg {
                background: #fff;
                color: #292d32;
            }
        `;

        const TabPanel = styled(BaseTabPanel)`
            width: 100%;
        `;

        const Tabs = styled(BaseTabs)`
            display: flex;
            gap: 12px;
            width: 720px;
        `;

        const TabsList = styled(BaseTabsList)`
            min-width: 200px;
            height: 561px;
            background-color: #292d32;
            border-radius: 16px;
            display: flex;
            padding: 6px;
            gap: 12px;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            align-content: space-between;
        `;

        const tabTitleStyle = {
            marginLeft: "5px", 
            lineHeight: "23px"
        };

        return (
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Tabs orientation="vertical" value={currentTab} onChange={this.handleChange}>
                    <TabsList>
                        {LocationTab && ( 
                            <Tab disabled><LocationOnOutlined fontSize="large" /><span style={tabTitleStyle}>{__('Location', 'bookify')}</span></Tab> 
                        )}
                        <Tab disabled><SettingsOutlined fontSize="large" /><span style={tabTitleStyle}>{__('Service', 'bookify')}</span></Tab>
                        {StaffTab && ( 
                            <Tab disabled><PersonOutlined fontSize="large" /><span style={tabTitleStyle}>{__('Staff', 'bookify')}</span></Tab> 
                        )}
                        <Tab disabled><CalendarMonthOutlined fontSize="large" /><span style={tabTitleStyle}>{__('Date & Time', 'bookify')}</span></Tab>
                        <Tab disabled><PersonOutlineOutlined fontSize="large" /><span style={tabTitleStyle}>{__('Your Information', 'bookify')}</span></Tab>
                        <Tab disabled><PaymentOutlined fontSize="large" /><span style={tabTitleStyle}>{__('Payments', 'bookify')}</span></Tab>
                        <Tab disabled><DoneOutlined fontSize="large" /><span style={tabTitleStyle}>{__('Confirmation', 'bookify')}</span></Tab>
                    </TabsList>
                    {( LocationTab && StaffTab ) ? ( 
                        <>
                            <TabPanel value={0}><LocationTab setTab={this.setTab} data={this.state} context={this.context}/></TabPanel> 
                            <TabPanel value={1}><ServiceTab setTab={this.setTab} data={this.state}/></TabPanel>
                            <TabPanel value={2}><StaffTab setTab={this.setTab} data={this.state} context={this.context}/></TabPanel>
                            <TabPanel value={3}><DateAndTimeTab setTab={this.setTab} data={this.state} /></TabPanel>
                            <TabPanel value={4}><UserInfoTab setTab={this.setTab} /></TabPanel>
                            <TabPanel value={5}><PaymentsTab setTab={this.setTab} data={this.state} paymentSettings={paymentSettings} /></TabPanel>
                            <TabPanel value={6}><ConfirmationTab setTab={this.setTab} data={this.state} /></TabPanel>
                        </>
                    ) : (
                        <>
                            <TabPanel value={0}><ServiceTab setTab={this.setTab} data={this.state} /></TabPanel>
                            <TabPanel value={1}><DateAndTimeTab setTab={this.setTab} data={this.state} /></TabPanel>
                            <TabPanel value={2}><UserInfoTab setTab={this.setTab} /></TabPanel>
                            <TabPanel value={3}><PaymentsTab setTab={this.setTab} data={this.state} /></TabPanel>
                            <TabPanel value={4}><ConfirmationTab setTab={this.setTab} data={this.state} /></TabPanel>
                        </>
                    )}
                </Tabs>
            </ThemeProvider>
        );
    }
}

export default FrontendApp;
