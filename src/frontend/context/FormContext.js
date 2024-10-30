import React, { createContext, Component } from 'react';

const FormContext = createContext();

class FormProvider extends Component {
    state = {
        locationId: null,
        locationName: '',
        serviceId: null,
        serviceName: '',
        categorizedServices: [],
        serviceStopRerendering: false,
        serviceByLocaionLoading: true,
        staffId: null,
        staffName: '',
        total: 0,
        staffsByServices: [],
        staffStopRerendering: false,
        staffsByServiceLoading: true,
        daysOpen: [],
        specialDate: [],
        holidays: [],
        DateLoading: true,
        slots: [],
        InfoStopRerendering: false,
        slot: null,
        date: null,
        firstName: '',
        lastName: '',
        email: '',
        phone: '+1',
        note: '',
        appointmentId: null,
        gateway: 'on-site',
        customerId: null,
    };

    updateInput = (field, value) => {
        this.setState({ [field]: value });
    };

    render() {
        return (
            <FormContext.Provider value={{
                state: this.state,
                updateInput: this.updateInput
            }}>
                {this.props.children}
            </FormContext.Provider>
        );
    }
}

const FormConsumer = FormContext.Consumer;

export { FormProvider, FormConsumer, FormContext };
