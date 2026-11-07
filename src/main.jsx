import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { VehicleProvider } from './context/VehicleContext';
import { ChatProvider } from './context/ChatContext';
import { LanguageProvider } from './context/LanguageContext';
import { ListingProvider } from './context/ListingContext';
import { RequestProvider } from './context/RequestContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <VehicleProvider>
          <ListingProvider>
            <RequestProvider>
              <ChatProvider>
                <LanguageProvider>
       <App />
     </LanguageProvider>
              </ChatProvider>
            </RequestProvider>
          </ListingProvider>
        </VehicleProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
