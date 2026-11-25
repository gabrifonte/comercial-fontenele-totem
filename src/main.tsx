import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SelfiePage } from './screens/SelfiePage.tsx';
import { AttractModeScreensaver } from './components/AttractModeScreensaver.tsx';
import { DEFAULT_MARKETING_CONFIG } from './config/marketing.ts';

const params = new URLSearchParams(window.location.search);

// Pré-visualização do modo descanso (somente em desenvolvimento): http://localhost:3000/?saver
const page = params.has('selfie') ? (
  <SelfiePage />
) : import.meta.env.DEV && params.has('saver') ? (
  <AttractModeScreensaver config={DEFAULT_MARKETING_CONFIG} onExit={() => {}} />
) : (
  <App />
);

createRoot(document.getElementById('root')!).render(page);
