import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import AdminDashboard from './AdminDashboard.jsx'

// Single shared QueryClient for TanStack Query caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,    // 60 seconds — data stays fresh
      gcTime:    5 * 60 * 1000, // 5 minutes — cache retention
      retry: 2,
    },
  },
});

// Client-side routing check
const pathname = window.location.pathname.toLowerCase();
const isAdminRoute =
  pathname === '/admin' ||
  pathname === '/admin/' ||
  pathname === '/stainedbloomsadmin' ||
  pathname === '/stainedbloomsadmin/';

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
    <QueryClientProvider client={queryClient}>
      {isAdminRoute ? <AdminDashboard /> : <App />}
    </QueryClientProvider>
  </StrictMode>,
)
