# Stained Blooms CMS — Production Backup & Recovery Strategy

This document outlines the backup and recovery procedures for the Stained Blooms cloud-powered CMS hosted on Supabase.

---

## 1. Database Backup Procedure

Supabase automatically takes daily backups of your project's database. However, for major deployments or manual backups, follow these instructions:

### Automated Daily Backups
- Supabase performs automatic nightly backups for all projects.
- Backups are retained for 7 days (Free tier) or 30 days (Pro tier).
- Accessible via your Supabase Dashboard: **Project Settings > Backups**.

### Manual Database Export (via CLI)
If you need an immediate backup before making major schema changes, you can dump the database using the Supabase CLI or standard `pg_dump`:

```bash
# Export the entire database (schema + data) to a local SQL file
pg_dump -h db.your-project-ref.supabase.co -U postgres -d postgres > database_backup_$(date +%F).sql
```
*Note: You can find your database connection details under **Project Settings > Database**.*

---

## 2. Media Storage Backup Procedure

Supabase Storage files (uploaded images) are stored in your project's S3-compatible buckets. They are not included in daily database dumps.

### Automated Backups
- For Pro projects, bucket backups can be configured directly through AWS S3 replication or Supabase backups.

### Manual Media Download
To create a local backup of your gallery and branding images:
1. Log in to the **Supabase Dashboard**.
2. Go to **Storage > Buckets > images**.
3. Select the folder or files you wish to backup and click **Download** to save them locally.

---

## 3. Disaster Recovery Steps

If data corruption occurs or you need to restore the system to a clean state:

### Restoring Database to a Daily Backup Point
1. In the Supabase Dashboard, go to **Project Settings > Backups**.
2. Select the backup point from the list.
3. Click **Restore** to revert the database state.

### Re-initializing Database & Seeding (Clean Slate)
If you want to completely rebuild the database schema from scratch:
1. Open the Supabase **SQL Editor**.
2. Run the table creation commands listed in the [Implementation Plan](.agents/skills/antigravity_guide/../../implementation_plan.md) (or run migrations).
3. Set your environment variables in `.env`.
4. Run the automated seed script to upload default assets to Storage and seed database rows:
   ```bash
   node scripts/uploadSeedImages.js
   ```
5. Confirm that the default categories, images, settings, and services are restored in the preview.
