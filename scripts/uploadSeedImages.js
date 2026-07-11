import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables manually from .env file
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('Error: .env file not found at project root. Please create it first.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    // Remove quotes if present
    if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
      value = value.substring(1, value.length - 1);
    }
    if (value.length > 0 && value.charAt(0) === "'" && value.charAt(value.length - 1) === "'") {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_SUPABASE') || supabaseAnonKey.includes('YOUR_SUPABASE')) {
  console.error('Error: Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file with valid credentials.');
  process.exit(1);
}

console.log('Connecting to Supabase at:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const IMAGES_TO_UPLOAD = [
  { local: 'logo.jpg', remote: 'defaults/logo.jpg' },
  { local: 'hero.jpg', remote: 'defaults/hero.jpg' },
  { local: 'cones.jpg', remote: 'defaults/cones.jpg' },
  { local: 'bridal_1.jpg', remote: 'defaults/bridal_1.jpg' },
  { local: 'arabic_1.jpg', remote: 'defaults/arabic_1.jpg' },
  { local: 'minimal_1.jpg', remote: 'defaults/minimal_1.jpg' },
  { local: 'feet_1.jpg', remote: 'defaults/feet_1.jpg' },
  { local: 'festival_1.jpg', remote: 'defaults/festival_1.jpg' }
];

async function main() {
  console.log('Checking storage uploads...');
  const uploadedUrls = {};

  for (const item of IMAGES_TO_UPLOAD) {
    const localFilePath = path.join(__dirname, '../public/images', item.local);
    if (!fs.existsSync(localFilePath)) {
      console.warn(`Warning: Local file ${localFilePath} not found, skipping.`);
      continue;
    }

    const fileBuffer = fs.readFileSync(localFilePath);
    const contentType = item.local.endsWith('.png') ? 'image/png' : item.local.endsWith('.webp') ? 'image/webp' : 'image/jpeg';

    console.log(`Uploading ${item.local} to storage images bucket as ${item.remote}...`);
    
    // Upload image
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(item.remote, fileBuffer, {
        contentType,
        upsert: true
      });

    if (uploadError) {
      console.error(`Error uploading ${item.local}:`, uploadError.message);
      console.log('Make sure you have created a public bucket named "images" in your Supabase project.');
      process.exit(1);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(item.remote);

    uploadedUrls[item.local] = publicUrl;
    console.log(`Uploaded successfully! Public URL: ${publicUrl}`);
  }

  // Fallbacks if files weren't found/uploaded
  const logoUrl = uploadedUrls['logo.jpg'] || '/images/logo.jpg';
  const heroImageUrl = uploadedUrls['hero.jpg'] || '/images/hero.jpg';
  const bridalUrl = uploadedUrls['bridal_1.jpg'] || '/images/bridal_1.jpg';
  const arabicUrl = uploadedUrls['arabic_1.jpg'] || '/images/arabic_1.jpg';
  const minimalUrl = uploadedUrls['minimal_1.jpg'] || '/images/minimal_1.jpg';
  const feetUrl = uploadedUrls['feet_1.jpg'] || '/images/feet_1.jpg';
  const festivalUrl = uploadedUrls['festival_1.jpg'] || '/images/festival_1.jpg';

  console.log('\nSeeding database tables...');

  // 1. Seed website_settings
  console.log('Seeding website_settings...');
  const { error: settingsError } = await supabase
    .from('website_settings')
    .upsert({
      id: 1,
      website_name: 'Stained Blooms',
      logo: logoUrl,
      favicon: logoUrl, // Using logo as favicon initially
      footer_text: '© Stained Blooms by Anshidha Saleem. All rights reserved.',
      meta_title: 'Stained Blooms — Luxury Bridal Mehendi by Anshidha Saleem',
      meta_description: 'Stained Blooms by Anshidha Saleem — Luxury bridal Mehendi artist crafting timeless, intricate designs for weddings, festivals, and special celebrations.',
      hero_image: heroImageUrl,
      hero_title: 'Beautiful\nMemories.',
      hero_subtitle: 'Bridal Mehendi artist creating elegant handcrafted designs for your most memorable celebrations. Specializing in intricate custom storytelling patterns.',
      primary_cta_text: 'Message on Instagram',
      primary_cta_url: 'https://instagram.com',
      secondary_cta_text: 'View Gallery',
      secondary_cta_url: '#gallery'
    });

  if (settingsError) {
    console.error('Error seeding website_settings:', settingsError.message);
  }

  // 2. Seed contact
  console.log('Seeding contact...');
  const { error: contactError } = await supabase
    .from('contact')
    .upsert({
      id: 1,
      instagram_url: 'https://instagram.com',
      whatsapp_number: '+911234567890',
      email_address: 'inquiry@stainedblooms.com',
      cta_button_text: 'DM on Instagram'
    });

  if (contactError) {
    console.error('Error seeding contact:', contactError.message);
  }

  // 3. Seed categories
  console.log('Seeding categories...');
  const categories = [
    { id: 'cat-all', name: 'All', visible: true, display_order: 0 },
    { id: 'cat-bridal', name: 'Bridal', visible: true, display_order: 1 },
    { id: 'cat-arabic', name: 'Arabic', visible: true, display_order: 2 },
    { id: 'cat-minimal', name: 'Minimal', visible: true, display_order: 3 },
    { id: 'cat-feet', name: 'Feet', visible: true, display_order: 4 },
    { id: 'cat-festival', name: 'Festival', visible: true, display_order: 5 }
  ];

  for (const cat of categories) {
    const { error: catError } = await supabase
      .from('categories')
      .upsert(cat);
    if (catError) {
      console.error(`Error seeding category ${cat.name}:`, catError.message);
    }
  }

  // 4. Seed services
  console.log('Seeding services...');
  const services = [
    {
      id: 'svc-1',
      title: 'Simple Mehendi',
      icon: 'Feather',
      description: 'Delicate leaf trails, elegant Arabic strips, and clean minimal spacing. Perfect for guests and casual celebrations.',
      featured: false,
      display_order: 0
    },
    {
      id: 'svc-2',
      title: 'Semi Bridal',
      icon: 'Flower',
      description: 'More detailed traditional elements extending up the wrists. Ideal for engagements and close family members.',
      featured: false,
      display_order: 1
    },
    {
      id: 'svc-3',
      title: 'Bridal Mehendi',
      icon: 'Sparkles',
      description: 'Stunning premium high-density custom patterns. Incorporates traditional motifs, peacock art, and personalized silhouettes.',
      featured: true,
      display_order: 2
    },
    {
      id: 'svc-4',
      title: 'Festival Designs',
      icon: 'Crown',
      description: 'Charming festive mandalas and full finger henna patterns. Designed for Eid, Diwali, Teej, and baby showers.',
      featured: false,
      display_order: 3
    }
  ];

  for (const svc of services) {
    const { error: svcError } = await supabase
      .from('services')
      .upsert(svc);
    if (svcError) {
      console.error(`Error seeding service ${svc.title}:`, svcError.message);
    }
  }

  // 5. Seed gallery
  console.log('Seeding gallery...');
  // Delete any existing gallery data to insert fresh urls cleanly
  await supabase.from('gallery').delete().neq('id', 0);

  const galleryItems = [
    { category: 'Bridal', title: 'Royal Indian Bridal Palms', image: bridalUrl, description: 'Intricate traditional motifs with elephants, flowers, and checkerboards extending past the wrists.', display_order: 0 },
    { category: 'Arabic', title: 'Sleek Vine & Paisley Flow', image: arabicUrl, description: 'Flowing diagonal trail tracing the back of the hand with bold lines and elegant blank spacing.', display_order: 1 },
    { category: 'Minimal', title: 'Modern Delicate Wrist Vine', image: minimalUrl, description: 'Delicate leaf-trail outlining the fingers and wrist, perfect for contemporary wedding guests.', display_order: 2 },
    { category: 'Feet', title: 'Premium Peacock Handtrail', image: feetUrl, description: 'Stunning peacock henna detailing reflecting traditional craftsmanship on the bride\'s forearm.', display_order: 3 },
    { category: 'Festival', title: 'Festival Mandala Patterns', image: festivalUrl, description: 'Vibrant festive mandalas with bold geometric patterns perfect for Eid, Diwali and celebrations.', display_order: 4 }
  ];

  const { error: galleryError } = await supabase
    .from('gallery')
    .insert(galleryItems);

  if (galleryError) {
    console.error('Error seeding gallery:', galleryError.message);
  }

  console.log('\nSeeding completed successfully!');
}

main().catch(err => {
  console.error('Fatal error in seed script:', err);
  process.exit(1);
});
