// cmsHelper.js — Supabase Headless CMS API Client for Stained Blooms
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Make sure environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to map DB contact row to UI object
function mapContactRow(row) {
  if (!row) return {};
  return {
    whatsappNumber: row.whatsapp_number,
    instagramUrl: row.instagram_url,
    emailAddress: row.email_address,
    ctaText: row.cta_button_text,
    businessName: 'Stained Blooms', // hardcoded UI fallbacks
    businessAddress: 'Kerala, India'
  };
}

// Helper to map DB settings row to UI settings & hero objects
function mapSettingsRow(row) {
  if (!row) return { settings: {}, hero: {} };
  
  const settings = {
    websiteName: row.website_name,
    logoText: row.logo_text,
    footerText: row.footer_text,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    logo: row.logo,
    favicon: row.favicon,
    themeColorEmerald: '#0E3B2E',
    themeColorGold: '#B89A5A'
  };

  const hero = {
    heading: row.hero_title,
    description: row.hero_subtitle,
    image: row.hero_image,
    buttonText: row.primary_cta_text,
    buttonUrl: row.primary_cta_url,
    secondaryButtonText: row.secondary_cta_text,
    secondaryButtonUrl: row.secondary_cta_url
  };

  return { settings, hero };
}

// ─── READ OPERATIONS ──────────────────────────────────────────────────────────

export async function getAllCMSData() {
  try {
    const [
      { data: wsData, error: wsErr },
      { data: contactData, error: contactErr },
      { data: catsData, error: catsErr },
      { data: svcsData, error: svcsErr },
      { data: galleryData, error: galleryErr }
    ] = await Promise.all([
      supabase.from('website_settings').select('*').single(),
      supabase.from('contact').select('*').single(),
      supabase.from('categories').select('*').order('display_order', { ascending: true }),
      supabase.from('services').select('*').order('display_order', { ascending: true }),
      supabase.from('gallery').select('*').order('display_order', { ascending: true })
    ]);

    if (wsErr) throw wsErr;
    if (contactErr) throw contactErr;
    if (catsErr) throw catsErr;
    if (svcsErr) throw svcsErr;
    if (galleryErr) throw galleryErr;

    const { settings, hero } = mapSettingsRow(wsData);

    return {
      settings,
      hero,
      contact: mapContactRow(contactData),
      categories: (catsData || []).map(c => ({
        id: c.id,
        name: c.name,
        isVisible: c.visible,
        order: c.display_order
      })),
      services: (svcsData || []).map(s => ({
        id: s.id,
        name: s.title,
        icon: s.icon,
        description: s.description,
        details: s.description, // Mapped for safety to reuse UI components
        isFeatured: s.featured,
        order: s.display_order
      })),
      gallery: (galleryData || []).map(g => ({
        id: Number(g.id),
        category: g.category,
        title: g.title || '',
        image: g.image,
        description: g.description || '',
        order: g.display_order,
        visible: g.visible
      }))
    };
  } catch (error) {
    console.error('Error fetching all CMS data from Supabase:', error);
    throw new Error('Failed to retrieve website data.');
  }
}

export async function getCMSData(key) {
  try {
    if (key === 'settings') {
      const { data, error } = await supabase.from('website_settings').select('*').single();
      if (error) throw error;
      return mapSettingsRow(data).settings;
    }
    if (key === 'hero') {
      const { data, error } = await supabase.from('website_settings').select('*').single();
      if (error) throw error;
      return mapSettingsRow(data).hero;
    }
    if (key === 'contact') {
      const { data, error } = await supabase.from('contact').select('*').single();
      if (error) throw error;
      return mapContactRow(data);
    }
    if (key === 'categories') {
      const { data, error } = await supabase.from('categories').select('*').order('display_order', { ascending: true });
      if (error) throw error;
      return (data || []).map(c => ({ id: c.id, name: c.name, isVisible: c.visible, order: c.display_order }));
    }
    if (key === 'services') {
      const { data, error } = await supabase.from('services').select('*').order('display_order', { ascending: true });
      if (error) throw error;
      return (data || []).map(s => ({ id: s.id, name: s.title, icon: s.icon, description: s.description, details: s.description, isFeatured: s.featured, order: s.display_order }));
    }
    if (key === 'gallery') {
      const { data, error } = await supabase.from('gallery').select('*').order('display_order', { ascending: true });
      if (error) throw error;
      return (data || []).map(g => ({ id: Number(g.id), category: g.category, title: g.title || '', image: g.image, description: g.description || '', order: g.display_order, visible: g.visible }));
    }
    return null;
  } catch (error) {
    console.error(`Error loading key ${key} from Supabase:`, error);
    throw error;
  }
}

// ─── WRITE MUTATIONS (IMMEDIATE PERSISTENCE) ──────────────────────────────────

export async function saveWebsiteSettings(settingsObj, heroObj) {
  try {
    const payload = {};
    if (settingsObj) {
      if (settingsObj.websiteName !== undefined) payload.website_name = settingsObj.websiteName;
      if (settingsObj.logo !== undefined) payload.logo = settingsObj.logo;
      if (settingsObj.favicon !== undefined) payload.favicon = settingsObj.favicon;
      if (settingsObj.footerText !== undefined) payload.footer_text = settingsObj.footerText;
      if (settingsObj.metaTitle !== undefined) payload.meta_title = settingsObj.metaTitle;
      if (settingsObj.metaDescription !== undefined) payload.meta_description = settingsObj.metaDescription;
      if (settingsObj.logoText !== undefined) payload.logo_text = settingsObj.logoText;
    }
    if (heroObj) {
      if (heroObj.heading !== undefined) payload.hero_title = heroObj.heading;
      if (heroObj.description !== undefined) payload.hero_subtitle = heroObj.description;
      if (heroObj.image !== undefined) payload.hero_image = heroObj.image;
      if (heroObj.buttonText !== undefined) payload.primary_cta_text = heroObj.buttonText;
      if (heroObj.buttonUrl !== undefined) payload.primary_cta_url = heroObj.buttonUrl;
      if (heroObj.secondaryButtonText !== undefined) payload.secondary_cta_text = heroObj.secondaryButtonText;
      if (heroObj.secondaryButtonUrl !== undefined) payload.secondary_cta_url = heroObj.secondaryButtonUrl;
    }

    const { error } = await supabase
      .from('website_settings')
      .update(payload)
      .eq('id', 1);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving website settings to Supabase:', error);
    throw new Error('Failed to save website settings.');
  }
}

export async function saveContact(contactObj) {
  try {
    const payload = {
      instagram_url: contactObj.instagramUrl,
      whatsapp_number: contactObj.whatsappNumber,
      email_address: contactObj.emailAddress,
      cta_button_text: contactObj.ctaText
    };

    const { error } = await supabase
      .from('contact')
      .update(payload)
      .eq('id', 1);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving contact to Supabase:', error);
    throw new Error('Failed to save contact information.');
  }
}

export async function saveCategory(cat) {
  try {
    const payload = {
      name: cat.name,
      visible: cat.isVisible !== undefined ? cat.isVisible : true,
      display_order: cat.order || 0
    };
    if (cat.id && !cat.id.startsWith('cat-new-')) {
      payload.id = cat.id;
    }
    const { data, error } = await supabase
      .from('categories')
      .upsert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving category to Supabase:', error);
    throw error;
  }
}

export async function deleteCategory(catId) {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', catId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting category from Supabase:', error);
    throw error;
  }
}

export async function saveCategoriesList(categoriesList) {
  try {
    const payloads = categoriesList.map((c, index) => ({
      id: c.id,
      name: c.name,
      visible: c.isVisible !== undefined ? c.isVisible : true,
      display_order: index
    }));

    const { error } = await supabase
      .from('categories')
      .upsert(payloads);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving categories reorder to Supabase:', error);
    throw error;
  }
}

export async function saveService(svc) {
  try {
    const payload = {
      title: svc.name,
      description: svc.description,
      icon: svc.icon || 'Sparkles',
      featured: svc.isFeatured || false,
      display_order: svc.order || 0
    };
    
    // If it's an existing service and not a client-generated temp ID
    if (svc.id && !svc.id.startsWith('svc-')) {
      payload.id = svc.id;
    }

    const { data, error } = await supabase
      .from('services')
      .upsert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving service to Supabase:', error);
    throw error;
  }
}

export async function deleteService(svcId) {
  try {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', svcId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting service from Supabase:', error);
    throw error;
  }
}

export async function saveServicesList(servicesList) {
  try {
    const payloads = servicesList.map((s, index) => ({
      id: s.id,
      title: s.name,
      description: s.description,
      icon: s.icon,
      featured: s.isFeatured,
      display_order: index
    }));

    const { error } = await supabase
      .from('services')
      .upsert(payloads);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving services reorder to Supabase:', error);
    throw error;
  }
}

export async function saveGalleryItem(item) {
  try {
    const payload = {
      category: item.category,
      image: item.image,
      title: item.title || '',
      description: item.description || '',
      display_order: item.order || 0,
      visible: item.visible !== undefined ? item.visible : true
    };
    
    // Check if item has a valid numeric ID (existing item)
    // Client generated temp timestamps are numbers but usually large (>10 digits)
    if (item.id && String(item.id).length < 12) {
      payload.id = Number(item.id);
    }

    const { data, error } = await supabase
      .from('gallery')
      .upsert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving gallery item to Supabase:', error);
    throw error;
  }
}

export async function deleteGalleryItem(itemId) {
  try {
    const { error } = await supabase
      .from('gallery')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting gallery item from Supabase:', error);
    throw error;
  }
}

export async function saveGalleryList(galleryList) {
  try {
    const payloads = galleryList.map((g, index) => {
      const payload = {
        category: g.category,
        image: g.image,
        title: g.title,
        description: g.description,
        display_order: index,
        visible: g.visible !== undefined ? g.visible : true
      };
      if (g.id && String(g.id).length < 12) {
        payload.id = Number(g.id);
      }
      return payload;
    });

    const { error } = await supabase
      .from('gallery')
      .upsert(payloads);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving gallery list reorder to Supabase:', error);
    throw error;
  }
}

// ─── STORAGE OPERATIONS ────────────────────────────────────────────────────────

export async function uploadImage(file) {
  // Validate type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    throw new Error('Only JPG, JPEG, PNG, and WebP images are allowed.');
  }

  // Validate size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image size must be under 10MB.');
  }

  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `uploads/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Image upload failed:', error);
    throw new Error(error.message || 'Failed to upload image to Storage.');
  }
}

export async function deleteUploadedImage(imageUrl) {
  if (!imageUrl) return;
  // Verify that it is a URL from our Supabase project storage
  if (!imageUrl.includes('.supabase.co/storage/v1/object/public/images/')) return;

  try {
    // Extract file path after "images/"
    const pathParts = imageUrl.split('/public/images/');
    if (pathParts.length < 2) return;
    const filepath = decodeURIComponent(pathParts[1]);

    const { error } = await supabase.storage
      .from('images')
      .remove([filepath]);

    if (error) throw error;
  } catch (error) {
    // Non-critical log, don't crash
    console.warn('Could not delete storage file:', error.message);
  }
}

// ─── AUTHENTICATION ────────────────────────────────────────────────────────────

export async function loginAdmin(usernameOrEmail, password) {
  try {
    // Standardize to email
    let email = usernameOrEmail;
    if (!usernameOrEmail.includes('@')) {
      email = `${usernameOrEmail}@stainedblooms.com`;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      if (error.message === 'Invalid login credentials') {
        throw new Error('Invalid credentials');
      }
      throw error;
    }

    return data.user;
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
}

export async function logoutAdmin() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Logout failed:', error);
  }
}

// ─── REALTIME SYNC ─────────────────────────────────────────────────────────────

export function subscribeToCMSUpdates(callback) {
  // Subscribe to changes on all content tables
  const channel = supabase
    .channel('cms-all-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'website_settings' }, () => callback())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'contact' }, () => callback())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => callback())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => callback())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery' }, () => callback())
    .subscribe();

  // Return unsubscribe cleanup handler
  return () => {
    supabase.removeChannel(channel);
  };
}
