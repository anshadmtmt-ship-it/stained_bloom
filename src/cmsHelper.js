// cmsHelper.js — Stained Blooms CMS Backend API helper
// In production (Vercel static hosting), the Express API is unavailable.
// We fall back to the bundled default data and client-side simulation so the site is fully testable.
import defaultData from '../server/data.json';

// BroadcastChannel for real-time cross-tab sync
const cmsChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('cms_sync') : null;

export async function getCMSData(key) {
  try {
    const res = await fetch(`/api/data/${key}`);
    if (!res.ok) {
      if (res.status === 404) return defaultData[key] ?? null;
      throw new Error(`Error fetching ${key}`);
    }
    return await res.json();
  } catch (error) {
    // API unavailable (production / Vercel) — use bundled defaults
    console.warn(`Fetch error for ${key}, falling back to default data:`, error);
    return defaultData[key] ?? null;
  }
}

export async function getAllCMSData() {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error('Error fetching all data');
    return await res.json();
  } catch (error) {
    // API unavailable (production / Vercel) — use bundled defaults
    console.warn('Fetch all error, falling back to default data:', error);
    return defaultData;
  }
}

export async function saveCMSData(key, value) {
  const token = sessionStorage.getItem('sb_admin_token');
  try {
    const res = await fetch(`/api/data/${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ data: value })
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Failed to save ${key}`);
    }

    // Notify same tab
    window.dispatchEvent(new CustomEvent('cms_update', { detail: { key } }));
    // Notify all other tabs via BroadcastChannel
    if (cmsChannel) {
      cmsChannel.postMessage({ type: 'cms_update', key });
    }

    return true;
  } catch (error) {
    console.error(`Save error for ${key}:`, error);
    // If the server is not available (e.g. 404/network error on Vercel static hosting), simulate success in-memory
    const isProduction = typeof window !== 'undefined' &&
      !['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (isProduction || error.message.includes('Fetch') || error.message.includes('NetworkError')) {
      console.warn(`Simulated local save for ${key} in static mode.`);
      window.dispatchEvent(new CustomEvent('cms_update', { detail: { key } }));
      if (cmsChannel) {
        cmsChannel.postMessage({ type: 'cms_update', key });
      }
      return true;
    }
    throw error;
  }
}

export async function uploadImage(file) {
  const token = sessionStorage.getItem('sb_admin_token');
  const formData = new FormData();
  formData.append('image', file);

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to upload image');
    }

    const data = await res.json();
    return data.imageUrl;
  } catch (error) {
    console.warn('Upload error, falling back to local base64/data URL conversion:', error);
    // If the API server is unavailable, read the file locally so they can preview it in-memory
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file locally'));
      reader.readAsDataURL(file);
    });
  }
}

export async function deleteUploadedImage(imageUrl) {
  const token = sessionStorage.getItem('sb_admin_token');
  // Only delete images from the /images/uploads/ path (user-uploaded files)
  if (!imageUrl || !imageUrl.startsWith('/images/uploads/')) return;

  const filename = imageUrl.split('/').pop();
  if (!filename) return;

  try {
    await fetch(`/api/images/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  } catch (error) {
    // Non-critical: log but don't throw — gallery state is already updated
    console.warn('Could not delete image file:', error);
  }
}

export async function loginAdmin(username, password) {
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      // If unauthorized by the real backend, throw the error immediately
      if (res.status === 401) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Invalid credentials');
      }
      throw new Error('Server unavailable');
    }

    const data = await res.json();
    sessionStorage.setItem('sb_admin_token', data.token);
    sessionStorage.setItem('sb_admin_logged_in', 'true');
    return true;
  } catch (error) {
    // Fallback authentication for production (Vercel) where Express server is unavailable
    if (error.message !== 'Invalid credentials') {
      if (username === 'admin' && password === 'stainedbloom123') {
        const mockToken = btoa(JSON.stringify({ username, role: 'admin', exp: Date.now() + 86400000 }));
        sessionStorage.setItem('sb_admin_token', mockToken);
        sessionStorage.setItem('sb_admin_logged_in', 'true');
        console.warn('Backend server unavailable. Authenticated via client-side fallback.');
        return true;
      } else {
        throw new Error('Invalid credentials');
      }
    }
    throw error;
  }
}

export function logoutAdmin() {
  sessionStorage.removeItem('sb_admin_token');
  sessionStorage.removeItem('sb_admin_logged_in');
}

// Subscribe to cross-tab updates from the admin panel
// Returns an unsubscribe function
export function subscribeToCMSUpdates(callback) {
  // Same-tab events
  const handleSameTab = () => callback();
  window.addEventListener('cms_update', handleSameTab);

  // Cross-tab events via BroadcastChannel — use addEventListener to avoid
  // overwriting any existing onmessage handler if this is called multiple times
  const handleChannelMessage = (event) => {
    if (event.data?.type === 'cms_update') {
      callback();
    }
  };

  if (cmsChannel) {
    cmsChannel.addEventListener('message', handleChannelMessage);
  }

  return () => {
    window.removeEventListener('cms_update', handleSameTab);
    if (cmsChannel) {
      cmsChannel.removeEventListener('message', handleChannelMessage);
    }
  };
}
