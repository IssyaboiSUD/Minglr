
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { LocationProvider } from './contexts/LocationContext';
import { NotificationsProvider } from './contexts/NotificationsContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <LocationProvider>
        <NotificationsProvider>
          <App />
        </NotificationsProvider>
      </LocationProvider>
    </AuthProvider>
  </React.StrictMode>
);
