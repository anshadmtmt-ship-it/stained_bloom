import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const envContent = fs.readFileSync('./.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { transport: ws }
});

async function inspect() {
  const tables = ['website_settings', 'categories', 'gallery', 'services', 'contact'];
  for (const table of tables) {
    console.log(`\n--- Inspecting table: ${table} ---`);
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.error(`Error querying ${table}:`, error.message);
    } else {
      console.log(`Success querying ${table}! Data length:`, data.length);
      if (data.length > 0) {
        console.log('First row columns:', Object.keys(data[0]));
      } else {
        console.log('Table is empty.');
      }
    }
  }
}

inspect().catch(err => console.error(err));
