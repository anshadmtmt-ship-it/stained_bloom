// db.js — All Supabase database CRUD operations for Stained Blooms CMS
// Includes data adapters that map DB column names to legacy UI property names
// so App.jsx and AdminDashboard.jsx JSX templates do not need to change.
import { supabase } from '../utils/supabase.js';

const GALLERY_IMAGE_LIMIT = 8;

/**
 * Verifies if the given user ID is in the admin_users table.
 * Used by AdminDashboard.jsx to reject non-admin authenticated users.
 */
export async function checkIsAdmin(userId) {
  if (!userId) {
    console.error('[checkIsAdmin] No userId provided to check.');
    return false;
  }
  
  try {
    console.log('[checkIsAdmin] Verifying admin access for auth.uid:', userId);
    
    // We use maybeSingle() because single() throws PGRST116 if no rows match,
    // which happens if the user isn't an admin.
    const { data, error } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    console.log('[checkIsAdmin] Supabase response -> data:', data, 'error:', error);

    if (error) {
      console.error('[checkIsAdmin] Database query error:', error.message);
      return false;
    }

    if (data && data.id === userId) {
      console.log('[checkIsAdmin] SUCCESS: User verified as admin. IDs match:', data.id);
      return true;
    }
    
    console.warn('[checkIsAdmin] FAILED: User is authenticated but NOT found in admin_users.');
    console.warn('-> Auth UUID:', userId);
    console.warn('-> DB UUID:', data?.id || 'null (No row returned)');
    
    return false;
  } catch (err) {
    console.error('[checkIsAdmin] Exception thrown:', err);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA ADAPTERS — Map new DB columns to existing UI property names
// ═══════════════════════════════════════════════════════════════════════════════

/** Maps a website_settings row to the shape used by App.jsx and AdminDashboard.jsx */
export function adaptSettings(row) {
  if (!row) return {};
  return {
    _id:             row.id,
    websiteName:     row.website_name   || '',
    logoText:        row.website_name   || '', // logoText was merged into websiteName
    logo:            row.logo_url       || '',
    favicon:         row.favicon_url    || '',
    footerText:      row.footer_text    || '',
    metaTitle:       row.meta_title     || '',
    metaDescription: row.meta_description || '',
  };
}

/** Maps a website_settings row to the hero shape used in UI */
export function adaptHero(row) {
  if (!row) return {};
  return {
    _id:                row.id,
    heading:            row.hero_title          || '',
    description:        row.hero_subtitle       || '',
    image:              row.hero_image_url      || '',
    buttonText:         row.primary_cta_text    || '',
    buttonUrl:          row.primary_cta_url     || '',
    secondaryButtonText: row.secondary_cta_text || '',
    secondaryButtonUrl:  row.secondary_cta_url  || '',
  };
}

/** Maps a contact row to the shape used in UI */
export function adaptContact(row) {
  if (!row) return {};
  return {
    _id:            row.id,
    instagramUrl:   row.instagram_url   || '',
    whatsappNumber: row.whatsapp_number || '',
    emailAddress:   row.email_address   || '',
    ctaText:        row.cta_button_text || 'DM on Instagram',
  };
}

/** Maps a gallery_categories row to the shape used in UI */
export function adaptCategory(row) {
  if (!row) return {};
  return {
    id:        row.id,
    name:      row.name,
    slug:      row.slug || '',
    isVisible: row.visible,
    order:     row.display_order,
  };
}

/**
 * Maps a gallery_images row to the shape used in UI.
 * Pass categoriesById map to resolve category name from UUID FK.
 */
export function adaptGalleryImage(row, categoriesById = {}) {
  if (!row) return {};
  return {
    id:          row.id,
    category_id: row.category_id,
    category:    categoriesById[row.category_id]?.name || '',
    title:       row.title       || '',
    image:       row.image_url   || '',
    thumbnail:   row.thumbnail_url || '',
    description: row.description || '',
    order:       row.display_order,
    visible:     row.visible,
  };
}

/** Maps a services row to the shape used in UI */
export function adaptService(row) {
  if (!row) return {};
  return {
    id:          row.id,
    name:        row.title       || '',
    icon:        row.icon        || 'Sparkles',
    description: row.description || '',
    details:     row.description || '', // alias: App.jsx uses service.details
    isFeatured:  false,                 // removed from schema; always false
    order:       row.display_order,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Signs in an admin user using their full email.
 */
export async function loginAdmin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.message === 'Invalid login credentials') {
      throw new Error('Invalid email or password.');
    }
    throw error;
  }
  
  console.log('[loginAdmin] Success. Auth User UUID:', data.user?.id);
  console.log('[loginAdmin] Success. Session UUID:', data.session?.user?.id);
  return data.user;
}

/** Signs out the current admin user. */
export async function logoutAdmin() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Returns the currently authenticated user from the server (network request). */
export async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}

/** Returns the current active Supabase session (local cache). */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEBSITE SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════

/** Fetches the single website_settings row (or null if not yet seeded). */
export async function fetchSettings() {
  const { data, error } = await supabase
    .from('website_settings')
    .select('*')
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Upserts (create or update) the website_settings row.
 * Accepts DB column names (snake_case). Returns the saved row.
 */
export async function upsertSettings(payload) {
  const existing = await fetchSettings();
  if (existing) {
    const { data, error } = await supabase
      .from('website_settings')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('website_settings')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTACT
// ═══════════════════════════════════════════════════════════════════════════════

/** Fetches the single contact row (or null). */
export async function fetchContact() {
  const { data, error } = await supabase
    .from('contact')
    .select('*')
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Upserts the contact row. Accepts DB column names. Returns the saved row. */
export async function upsertContact(payload) {
  const existing = await fetchContact();
  if (existing) {
    const { data, error } = await supabase
      .from('contact')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('contact')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GALLERY CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

/** Returns all categories sorted by display_order. */
export async function fetchCategories() {
  const { data, error } = await supabase
    .from('gallery_categories')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Inserts a new category after checking for duplicates.
 * Returns the created row.
 */
export async function insertCategory(name, displayOrder = 0) {
  const slug = slugify(name);

  // Duplicate name check
  const { data: dup } = await supabase
    .from('gallery_categories')
    .select('id')
    .ilike('name', name.trim())
    .maybeSingle();
  if (dup) throw new Error(`A category named "${name}" already exists.`);

  const { data, error } = await supabase
    .from('gallery_categories')
    .insert({ name: name.trim(), slug, display_order: displayOrder, visible: true })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Updates a category's name, slug, visible, and/or display_order. Returns updated row. */
export async function updateCategory(id, fields) {
  const payload = {};
  if (fields.name !== undefined) {
    payload.name = fields.name.trim();
    payload.slug = slugify(fields.name);
  }
  if (fields.visible !== undefined)        payload.visible = fields.visible;
  if (fields.display_order !== undefined)  payload.display_order = fields.display_order;

  const { data, error } = await supabase
    .from('gallery_categories')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Deletes a category by ID.
 * gallery_images are cascade-deleted automatically via FK constraint.
 */
export async function deleteCategory(id) {
  const { error } = await supabase
    .from('gallery_categories')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/** Bulk updates display_order for an array of category UUIDs in sorted order. */
export async function reorderCategories(orderedIds) {
  const updates = orderedIds.map((id, index) =>
    supabase
      .from('gallery_categories')
      .update({ display_order: index, updated_at: new Date().toISOString() })
      .eq('id', id)
  );
  const results = await Promise.all(updates);
  for (const r of results) {
    if (r.error) throw r.error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GALLERY IMAGES
// ═══════════════════════════════════════════════════════════════════════════════

/** Returns all gallery images (optionally filtered by categoryId), sorted by display_order. */
export async function fetchGalleryImages(categoryId = null) {
  let q = supabase
    .from('gallery_images')
    .select('*')
    .order('display_order', { ascending: true });
  if (categoryId) q = q.eq('category_id', categoryId);

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

/** Returns lightweight rows (id + URLs) for a category — used for storage cleanup. */
export async function fetchGalleryImageUrlsForCategory(categoryId) {
  const { data, error } = await supabase
    .from('gallery_images')
    .select('id, image_url, thumbnail_url')
    .eq('category_id', categoryId);
  if (error) throw error;
  return data ?? [];
}

/** Returns the count of images in a category. Used to enforce the 8-image limit. */
export async function countImagesInCategory(categoryId) {
  const { count, error } = await supabase
    .from('gallery_images')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', categoryId);
  if (error) throw error;
  return count ?? 0;
}

/**
 * Inserts a gallery image record.
 * Enforces 8-image limit PER CATEGORY before inserting.
 * Also validates imageUrl is a real HTTP URL before writing.
 */
export async function insertGalleryImage({
  category_id,
  image_url,
  thumbnail_url = null,
  title         = '',
  description   = '',
  display_order = 0,
}) {
  // Backend limit enforcement (in addition to the DB trigger)
  const count = await countImagesInCategory(category_id);
  if (count >= GALLERY_IMAGE_LIMIT) {
    throw new Error(
      `Gallery limit reached. A maximum of ${GALLERY_IMAGE_LIMIT} images are allowed per category. Delete an existing image to upload a new one.`
    );
  }

  // Validate URL before writing
  if (!image_url?.startsWith('http')) {
    throw new Error('Invalid image URL. The upload may have failed. Please try again.');
  }

  const { data, error } = await supabase
    .from('gallery_images')
    .insert({ category_id, image_url, thumbnail_url, title, description, display_order, visible: true })
    .select()
    .single();

  if (error) {
    // DB trigger error message passthrough
    if (error.message?.includes('limit') || error.message?.includes('maximum')) {
      throw new Error(error.message);
    }
    throw error;
  }
  return data;
}

/** Updates editable fields on a gallery image. Returns the updated row. */
export async function updateGalleryImage(id, fields) {
  const payload = {};
  if (fields.title       !== undefined) payload.title       = fields.title;
  if (fields.description !== undefined) payload.description = fields.description;
  if (fields.visible     !== undefined) payload.visible     = fields.visible;
  if (fields.display_order !== undefined) payload.display_order = fields.display_order;

  if (fields.image_url !== undefined) {
    if (!fields.image_url?.startsWith('http')) throw new Error('Invalid image URL.');
    payload.image_url = fields.image_url;
  }
  if (fields.thumbnail_url !== undefined) payload.thumbnail_url = fields.thumbnail_url;

  const { data, error } = await supabase
    .from('gallery_images')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Deletes a gallery image DB record. Storage cleanup must be done separately. */
export async function deleteGalleryImage(id) {
  const { error } = await supabase
    .from('gallery_images')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/** Bulk updates display_order for an array of image UUIDs in sorted order. */
export async function reorderGalleryImages(categoryId, orderedIds) {
  const updates = orderedIds.map((id, index) =>
    supabase
      .from('gallery_images')
      .update({ display_order: index, updated_at: new Date().toISOString() })
      .eq('id', id)
  );
  const results = await Promise.all(updates);
  for (const r of results) {
    if (r.error) throw r.error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICES
// ═══════════════════════════════════════════════════════════════════════════════

/** Returns all services sorted by display_order. */
export async function fetchServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Inserts a new service. Returns the created row. */
export async function insertService({ title, description, icon = 'Sparkles', display_order = 0 }) {
  const { data, error } = await supabase
    .from('services')
    .insert({ title, description, icon, display_order })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Updates editable fields on a service. Returns the updated row. */
export async function updateService(id, fields) {
  const payload = {};
  if (fields.title        !== undefined) payload.title        = fields.title;
  if (fields.description  !== undefined) payload.description  = fields.description;
  if (fields.icon         !== undefined) payload.icon         = fields.icon;
  if (fields.display_order !== undefined) payload.display_order = fields.display_order;

  const { data, error } = await supabase
    .from('services')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Deletes a service by ID. */
export async function deleteService(id) {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/** Bulk updates display_order for an array of service UUIDs in sorted order. */
export async function reorderServices(orderedIds) {
  const updates = orderedIds.map((id, index) =>
    supabase
      .from('services')
      .update({ display_order: index, updated_at: new Date().toISOString() })
      .eq('id', id)
  );
  const results = await Promise.all(updates);
  for (const r of results) {
    if (r.error) throw r.error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC DATA FETCH — Used by App.jsx (public site)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetches all CMS data needed by the public site in one parallel request set.
 * Returns a flat object with the legacy property shapes used by App.jsx.
 */
export async function fetchAllPublicData() {
  const [settingsRow, contactRow, categoriesRows, servicesRows, allImages] = await Promise.all([
    fetchSettings(),
    fetchContact(),
    fetchCategories(),
    fetchServices(),
    fetchGalleryImages(),
  ]);

  // Build lookup map for category name resolution
  const categoriesById = {};
  (categoriesRows ?? []).forEach((c) => { categoriesById[c.id] = c; });

  // Build adapted categories list — 'All' virtual category is prepended at UI level
  const adaptedCategories = [
    { id: 'all', name: 'All', isVisible: true, order: -1 },
    ...(categoriesRows ?? []).map(adaptCategory),
  ];

  return {
    settings:   adaptSettings(settingsRow),
    hero:       adaptHero(settingsRow),
    contact:    adaptContact(contactRow),
    categories: adaptedCategories,
    services:   (servicesRows ?? []).map(adaptService),
    gallery:    (allImages ?? []).map((img) => adaptGalleryImage(img, categoriesById)),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// REALTIME SUBSCRIPTION — Used by App.jsx to keep public site current
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Subscribes to Postgres changes on all CMS tables.
 * Calls `callback` on any change event.
 * Returns an unsubscribe function.
 */
export function subscribeCMSUpdates(callback) {
  const channel = supabase
    .channel('cms-realtime-public')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'website_settings' },  callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'contact' },           callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery_categories' }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery_images' },    callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'services' },          callback)
    .subscribe();

  return () => supabase.removeChannel(channel);
}
