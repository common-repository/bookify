import React, { Component } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard/index';
import Calendar from './components/Calendar/index';
import Appointments from './components/Appointments/index';
import Location from './components/Location/index';
import Services from './components/Services/index';
import Staffs from './components/Staffs/index';
import Customers from './components/Customers/index';
import Notification from './components/Notification/index';
import Payment from './components/Payment/index';
import Settings from './components/Settings/index';
import NotFound from './components/NotFound/index';

class App extends Component {
  render() {

    const ProLocation = window.ProLocation;

    return (
        <HashRouter>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/location" element={ProLocation ? <ProLocation /> : < Location/>} />
                <Route path="/services" element={<Services />} />
                <Route path="/staffs" element={<Staffs />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/notification" element={<Notification />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </HashRouter>
    );
  }
}

export default App;
