import { createRoot } from 'react-dom/client';
import FrontendApp from './FrontendApp';
import './style/index.css';
import { FormProvider } from './context/FormContext';

const rootElement = document.getElementById('bookify-frontend');
const role = rootElement.getAttribute('data-role');
const root = createRoot(rootElement);

root.render(
    <FormProvider>
        <FrontendApp role={role} />
    </FormProvider>
);
