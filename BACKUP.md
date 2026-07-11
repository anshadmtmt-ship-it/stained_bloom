# Stained Blooms — Backup & Recovery Guide

> This document covers backup procedures and disaster-recovery workflows.
> **No automatic backups are configured.** Run these manually as needed.

---

## Database Backup

### Supabase Point-in-Time Recovery (Built-in)
Supabase Pro/Team plans include automatic daily backups with 7-day retention (Pro) or 30-day (Team).

Check your plan at: **Supabase Dashboard → Project → Database → Backups**

### Manual Export via Supabase Dashboard
1. Go to **Supabase Dashboard → Database → Backups**
2. Click **"Download"** on any snapshot
3. Store the `.dump` file in a secure location (not in this repo)

### Manual Export via pg_dump (requires DB connection string)
```bash
# Get connection string from: Supabase Dashboard → Project Settings → Database → Connection string
pg_dump "postgresql://..." \
  --format=custom \
  --file="stained_blooms_$(date +%Y%m%d).dump" \
  --no-acl \
  --no-owner
```

---

## Storage Backup

### Manual Download via Supabase Dashboard
1. Go to **Supabase Dashboard → Storage**
2. Open each bucket: `gallery`, `logo`, `hero`, `backgrounds`
3. Download files as needed
4. Store locally or in a separate cloud location

---

## Recovery Workflow

### Scenario: Accidentally deleted a gallery image
1. If the deletion happened recently, check if Supabase has a Point-in-Time Recovery snapshot
2. In Supabase Dashboard → Database → Restore → choose a timestamp before the deletion
3. After DB restore, re-upload the image via the Admin Panel to regenerate storage

### Scenario: All data lost (nuclear recovery)
1. Restore the database from a `.dump` backup:
   ```bash
   pg_restore "postgresql://..." \
     --no-acl --no-owner \
     stained_blooms_YYYYMMDD.dump
   ```
2. Manually re-upload any images via the Admin Panel
3. Verify all public URLs in the `gallery_images` table point to valid storage files

### Scenario: Wrong content published
1. Log into the Admin Panel at `/stainedbloomsadmin`
2. Make corrections directly — changes are live immediately with no redeployment needed

---

## Data Integrity Checks

Run these SQL queries in **Supabase SQL Editor** as needed:

```sql
-- Find gallery images with invalid storage URLs
SELECT id, category_id, image_url
FROM gallery_images
WHERE image_url IS NULL OR image_url = '' OR image_url NOT LIKE 'https://%';

-- Find categories with more than 8 images
SELECT category_id, COUNT(*) AS image_count
FROM gallery_images
GROUP BY category_id
HAVING COUNT(*) > 8;

-- Check for orphaned gallery_images (no parent category)
SELECT gi.*
FROM gallery_images gi
LEFT JOIN gallery_categories gc ON gi.category_id = gc.id
WHERE gc.id IS NULL;
```

---

## Deployment Checklist

| Environment | Status |
|---|---|
| Local (`npm run dev`) | reads `.env.local` |
| GitHub | `.env.local` is gitignored |
| Vercel | Set env vars in Vercel Dashboard → Project → Settings → Environment Variables |
| Supabase | All data lives here — no deployment needed |

Set these two variables in Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

---

*Last updated: July 2026*
