import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AdminDashboard from './AdminDashboard.jsx'

// Client-side routing check
const pathname = window.location.pathname.toLowerCase();
const isAdminRoute = pathname === '/admin' || pathname === '/admin/' || pathname === '/stainedbloomsadmin' || pathname === '/stainedbloomsadmin/';

// Dynamic SEO security: inject robots noindex/nofollow on admin paths
if (isAdminRoute) {
  let meta = document.querySelector('meta[name="robots"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'robots';
    document.head.appendChild(meta);
  }
  meta.content = 'noindex, nofollow';
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAdminRoute ? <AdminDashboard /> : <App />}
  </StrictMode>,
)
