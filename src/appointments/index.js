import { createRoot } from 'react-dom/client';
import AppointmentApp from './AppointmentApp';

const rootElement = document.getElementById('bookify-appointments');
const root = createRoot(rootElement);

root.render(
    <AppointmentApp/>
);