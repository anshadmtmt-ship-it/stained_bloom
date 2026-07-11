-- ═══════════════════════════════════════════════════════════════════════════════
-- STAINED BLOOMS — COMPLETE PRODUCTION DATABASE SCHEMA
-- Run this in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Admin Roles & Permissions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own admin status" ON public.admin_users;
CREATE POLICY "Users can read own admin status"
  ON public.admin_users FOR SELECT USING (auth.uid() = id);

-- Secure function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Auto-promote the very first registered user to admin so the owner isn't locked out
CREATE OR REPLACE FUNCTION public.auto_promote_first_user()
RETURNS trigger AS $$
DECLARE
  admin_count integer;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM public.admin_users;
  IF admin_count = 0 THEN
    INSERT INTO public.admin_users (id) VALUES (NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.auto_promote_first_user();
  END IF;
END $$;


-- ─── 1. website_settings ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_settings (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  website_name        text,
  logo_url            text,
  favicon_url         text,
  hero_image_url      text,
  hero_title          text,
  hero_subtitle       text,
  primary_cta_text    text,
  primary_cta_url     text,
  secondary_cta_text  text,
  secondary_cta_url   text,
  footer_text         text,
  meta_title          text,
  meta_description    text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- ─── 2. contact ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  instagram_url   text,
  whatsapp_number text,
  email_address   text,
  cta_button_text text DEFAULT 'DM on Instagram',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ─── 3. gallery_categories ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gallery_categories (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL UNIQUE,
  slug          text        NOT NULL UNIQUE,
  display_order integer     DEFAULT 0,
  visible       boolean     DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- ─── 4. gallery_images ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gallery_images (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   uuid        NOT NULL REFERENCES public.gallery_categories(id) ON DELETE CASCADE,
  title         text,
  description   text,
  image_url     text        NOT NULL,
  thumbnail_url text,
  display_order integer     DEFAULT 0,
  visible       boolean     DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gallery_images_category_id    ON public.gallery_images(category_id);
CREATE INDEX IF NOT EXISTS idx_gallery_images_display_order  ON public.gallery_images(display_order);

-- ─── 5. services ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.services (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text        NOT NULL,
  description   text,
  icon          text        DEFAULT 'Sparkles',
  display_order integer     DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- ─── updated_at auto-trigger ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['website_settings','contact','gallery_categories','gallery_images','services']
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON public.%I
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
    ', t, t);
  END LOOP;
END $$;

-- ─── Gallery 8-image limit trigger ───────────────────────────────────────────
-- Enforces the business rule at the database level (backend enforcement)
CREATE OR REPLACE FUNCTION public.enforce_gallery_image_limit()
RETURNS TRIGGER AS $$
DECLARE
  existing_count integer;
BEGIN
  SELECT COUNT(*) INTO existing_count
  FROM public.gallery_images
  WHERE category_id = NEW.category_id;

  IF existing_count >= 8 THEN
    RAISE EXCEPTION 'Gallery limit reached: maximum 8 images are allowed per category. Delete an existing image first.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_gallery_limit ON public.gallery_images;
CREATE TRIGGER enforce_gallery_limit
  BEFORE INSERT ON public.gallery_images
  FOR EACH ROW EXECUTE FUNCTION public.enforce_gallery_image_limit();

-- ─── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE public.website_settings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services           ENABLE ROW LEVEL SECURITY;

-- Public read-only (anonymous / public website)
DROP POLICY IF EXISTS "Public read website_settings" ON public.website_settings;
CREATE POLICY "Public read website_settings"
  ON public.website_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read contact" ON public.contact;
CREATE POLICY "Public read contact"
  ON public.contact FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read gallery_categories" ON public.gallery_categories;
CREATE POLICY "Public read gallery_categories"
  ON public.gallery_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read gallery_images" ON public.gallery_images;
CREATE POLICY "Public read gallery_images"
  ON public.gallery_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read services" ON public.services;
CREATE POLICY "Public read services"
  ON public.services FOR SELECT USING (true);

-- Authenticated admin full CRUD (RLS ensures only designated admins can write)
DROP POLICY IF EXISTS "Auth full website_settings" ON public.website_settings;
CREATE POLICY "Auth full website_settings"
  ON public.website_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Auth full contact" ON public.contact;
CREATE POLICY "Auth full contact"
  ON public.contact FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Auth full gallery_categories" ON public.gallery_categories;
CREATE POLICY "Auth full gallery_categories"
  ON public.gallery_categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Auth full gallery_images" ON public.gallery_images;
CREATE POLICY "Auth full gallery_images"
  ON public.gallery_images FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Auth full services" ON public.services;
CREATE POLICY "Auth full services"
  ON public.services FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ─── Storage Buckets ──────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('gallery',     'gallery',     true, 10485760, ARRAY['image/jpeg','image/jpg','image/png','image/webp']),
  ('logo',        'logo',        true,  5242880, ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/svg+xml']),
  ('hero',        'hero',        true, 10485760, ARRAY['image/jpeg','image/jpg','image/png','image/webp']),
  ('backgrounds', 'backgrounds', true, 10485760, ARRAY['image/jpeg','image/jpg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
DROP POLICY IF EXISTS "Public read gallery" ON storage.objects;
CREATE POLICY "Public read gallery"
  ON storage.objects FOR SELECT USING (bucket_id = 'gallery');

DROP POLICY IF EXISTS "Auth upload gallery" ON storage.objects;
CREATE POLICY "Auth upload gallery"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'gallery' AND public.is_admin());

DROP POLICY IF EXISTS "Auth delete gallery" ON storage.objects;
CREATE POLICY "Auth delete gallery"
  ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'gallery' AND public.is_admin());

DROP POLICY IF EXISTS "Auth update gallery" ON storage.objects;
CREATE POLICY "Auth update gallery"
  ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'gallery' AND public.is_admin());

DROP POLICY IF EXISTS "Public read logo" ON storage.objects;
CREATE POLICY "Public read logo"
  ON storage.objects FOR SELECT USING (bucket_id = 'logo');

DROP POLICY IF EXISTS "Auth upload logo" ON storage.objects;
CREATE POLICY "Auth upload logo"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'logo' AND public.is_admin());

DROP POLICY IF EXISTS "Auth delete logo" ON storage.objects;
CREATE POLICY "Auth delete logo"
  ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'logo' AND public.is_admin());

DROP POLICY IF EXISTS "Public read hero" ON storage.objects;
CREATE POLICY "Public read hero"
  ON storage.objects FOR SELECT USING (bucket_id = 'hero');

DROP POLICY IF EXISTS "Auth upload hero" ON storage.objects;
CREATE POLICY "Auth upload hero"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'hero' AND public.is_admin());

DROP POLICY IF EXISTS "Auth delete hero" ON storage.objects;
CREATE POLICY "Auth delete hero"
  ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'hero' AND public.is_admin());

DROP POLICY IF EXISTS "Public read backgrounds" ON storage.objects;
CREATE POLICY "Public read backgrounds"
  ON storage.objects FOR SELECT USING (bucket_id = 'backgrounds');

DROP POLICY IF EXISTS "Auth upload backgrounds" ON storage.objects;
CREATE POLICY "Auth upload backgrounds"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'backgrounds' AND public.is_admin());

DROP POLICY IF EXISTS "Auth delete backgrounds" ON storage.objects;
CREATE POLICY "Auth delete backgrounds"
  ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'backgrounds' AND public.is_admin());

-- ─── Enable Realtime ──────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.website_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery_images;
ALTER PUBLICATION supabase_realtime ADD TABLE public.services;

-- ─── Done ─────────────────────────────────────────────────────────────────────
-- Run this script once. All tables, triggers, RLS policies, and storage buckets
-- are now created.
