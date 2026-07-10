// cmsHelper.js — Stained Blooms CMS Backend API helper

// BroadcastChannel for real-time cross-tab sync
const cmsChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('cms_sync') : null;

export async function getCMSData(key) {
  try {
    const res = await fetch(`/api/data/${key}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Error fetching ${key}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`Fetch error for ${key}:`, error);
    return null;
  }
}

export async function getAllCMSData() {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error('Error fetching all data');
    return await res.json();
  } catch (error) {
    console.error('Fetch all error:', error);
    return null;
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
    console.error('Upload error:', error);
    throw error;
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
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || 'Invalid credentials');
    }

    const data = await res.json();
    sessionStorage.setItem('sb_admin_token', data.token);
    sessionStorage.setItem('sb_admin_logged_in', 'true');
    return true;
  } catch (error) {
    console.error('Login error:', error);
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
