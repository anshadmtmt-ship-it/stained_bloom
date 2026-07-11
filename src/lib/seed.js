// seed.js — One-time default data seeder
// Runs at app boot and inserts defaults ONLY when all tables are completely empty.
// Never overwrites existing data.
import { supabase } from '../utils/supabase.js';
import { fetchSettings, fetchContact, fetchCategories, fetchServices } from './db.js';

const DEFAULT_SETTINGS = {
  website_name:       'Stained Blooms',
  hero_title:         'Beautiful\nMemories.',
  hero_subtitle:      'Bridal Mehendi artist creating elegant handcrafted designs for your most memorable celebrations.',
  primary_cta_text:   'Message on Instagram',
  primary_cta_url:    'https://instagram.com',
  secondary_cta_text: 'View Gallery',
  secondary_cta_url:  '#gallery',
  footer_text:        '© Stained Blooms by Anshidha Saleem. All rights reserved.',
  meta_title:         'Stained Blooms — Luxury Bridal Mehendi by Anshidha Saleem',
  meta_description:   'Stained Blooms by Anshidha Saleem — Luxury bridal Mehendi artist crafting timeless, intricate designs for weddings, festivals, and special celebrations.',
};

const DEFAULT_CONTACT = {
  instagram_url:   'https://instagram.com',
  whatsapp_number: '+911234567890',
  email_address:   'inquiry@stainedblooms.com',
  cta_button_text: 'DM on Instagram',
};

const DEFAULT_CATEGORIES = [
  { name: 'Bridal',   slug: 'bridal',   display_order: 0, visible: true },
  { name: 'Arabic',   slug: 'arabic',   display_order: 1, visible: true },
  { name: 'Minimal',  slug: 'minimal',  display_order: 2, visible: true },
  { name: 'Festival', slug: 'festival', display_order: 3, visible: true },
];

const DEFAULT_SERVICES = [
  {
    title:         'Simple Mehendi',
    icon:          'Feather',
    description:   'Delicate leaf trails, elegant Arabic strips, and clean minimal spacing. Perfect for guests and casual celebrations.',
    display_order: 0,
  },
  {
    title:         'Semi Bridal',
    icon:          'Flower',
    description:   'More detailed traditional elements extending up the wrists. Ideal for engagements and close family members.',
    display_order: 1,
  },
  {
    title:         'Bridal Mehendi',
    icon:          'Sparkles',
    description:   'Stunning premium high-density custom patterns incorporating traditional motifs, peacock art, and personalized silhouettes.',
    display_order: 2,
  },
  {
    title:         'Festival Designs',
    icon:          'Crown',
    description:   'Charming festive mandalas and full finger henna patterns. Designed for Eid, Diwali, Teej, and baby showers.',
    display_order: 3,
  },
];

/**
 * Seeds the database with default content — only if ALL tables are empty.
 * Safe to call on every app boot; it is a no-op when data already exists.
 * Returns true if seeding occurred, false otherwise.
 */
export async function seedIfEmpty() {
  try {
    const [settings, contact, categories, services] = await Promise.all([
      fetchSettings(),
      fetchContact(),
      fetchCategories(),
      fetchServices(),
    ]);

    const isEmpty =
      !settings &&
      !contact &&
      (categories?.length ?? 0) === 0 &&
      (services?.length  ?? 0) === 0;

    if (!isEmpty) return false;

    console.log('[Seed] Database is empty — inserting default data...');

    await Promise.all([
      supabase.from('website_settings').insert(DEFAULT_SETTINGS),
      supabase.from('contact').insert(DEFAULT_CONTACT),
      supabase.from('gallery_categories').insert(DEFAULT_CATEGORIES),
      supabase.from('services').insert(DEFAULT_SERVICES),
    ]);

    console.log('[Seed] Default data inserted successfully.');
    return true;
  } catch (err) {
    // Non-critical — app still works without defaults
    console.warn('[Seed] Could not seed defaults:', err.message);
    return false;
  }
}
