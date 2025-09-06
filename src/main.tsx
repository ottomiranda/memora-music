import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { StripeProvider } from './lib/StripeProvider'
import { Toaster } from 'sonner'

createRoot(document.getElementById("root")!).render(
  <StripeProvider>
    <App />
    <Toaster position="top-right" richColors />
  </StripeProvider>
);
