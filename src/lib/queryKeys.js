// Query keys for TanStack Query — keeps cache keys consistent across the app
export const QUERY_KEYS = {
  settings:      ['website_settings'],
  contact:       ['contact'],
  categories:    ['gallery_categories'],
  allImages:     ['gallery_images'],
  images:        (categoryId) => ['gallery_images', categoryId ?? 'all'],
  services:      ['services'],
};
