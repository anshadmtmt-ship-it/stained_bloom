// seed.js — Automated Default Data & Image Seeder
import { supabase } from '../utils/supabase.js';
import { fetchSettings, fetchContact, fetchCategories, fetchServices } from './db.js';
import { uploadLogoImage, uploadHeroImage, uploadGalleryImage } from './storage.js';

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

async function getLocalFile(path, filename) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error('Not found');
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
  } catch (err) {
    console.warn(`[Seed] Could not load local image ${path}`);
    return null;
  }
}

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

    console.log('[Seed] Database is empty — starting full automated seed...');

    // 1. Upload Logo & Hero
    const logoFile = await getLocalFile('/images/logo.jpg', 'logo.jpg');
    const heroFile = await getLocalFile('/images/hero.jpg', 'hero.jpg');
    
    let logo_url = '', hero_image_url = '';
    if (logoFile) logo_url = await uploadLogoImage(logoFile);
    if (heroFile) hero_image_url = await uploadHeroImage(heroFile);

    // 2. Insert Settings & Contact & Services
    await Promise.all([
      supabase.from('website_settings').insert({ ...DEFAULT_SETTINGS, logo_url, hero_image_url }),
      supabase.from('contact').insert(DEFAULT_CONTACT),
      supabase.from('services').insert(DEFAULT_SERVICES),
    ]);

    // 3. Insert Categories and get their inserted IDs
    const { data: insertedCategories, error: catError } = await supabase
      .from('gallery_categories')
      .insert(DEFAULT_CATEGORIES)
      .select();

    if (catError || !insertedCategories) throw new Error('Failed to insert categories');

    const catMap = {};
    insertedCategories.forEach(c => { catMap[c.slug] = c.id; });

    // 4. Upload Gallery Images
    const galleryMapping = [
      { slug: 'minimal',  file: '/images/minimal_1.jpg', title: 'Minimal Design' },
      { slug: 'arabic',   file: '/images/arabic_1.jpg',  title: 'Arabic Trails' },
      { slug: 'bridal',   file: '/images/bridal_1.jpg',  title: 'Full Bridal' },
      { slug: 'festival', file: '/images/festival_1.jpg',title: 'Festival Mandala' },
      { slug: 'bridal',   file: '/images/couple_1.jpg',  title: 'Couple Portraits' },
      { slug: 'bridal',   file: '/images/feet_1.jpg',    title: 'Bridal Feet' },
      { slug: 'minimal',  file: '/images/cones.jpg',     title: 'Organic Cones' }
    ];

    let order = 0;
    for (const item of galleryMapping) {
      if (!catMap[item.slug]) continue;
      
      const file = await getLocalFile(item.file, item.file.split('/').pop());
      if (!file) continue;

      const uploadResult = await uploadGalleryImage(file);
      if (!uploadResult) continue;

      await supabase.from('gallery_images').insert({
        category_id: catMap[item.slug],
        title: item.title,
        image_url: uploadResult.imageUrl,
        thumbnail_url: uploadResult.thumbnailUrl,
        display_order: order++,
        visible: true
      });
    }

    console.log('[Seed] Full default data and images seeded successfully.');
    return true;
  } catch (err) {
    console.error('[Seed] Critical failure during seeding:', err);
    return false;
  }
}
