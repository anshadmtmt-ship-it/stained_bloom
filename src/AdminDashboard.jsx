// AdminDashboard.jsx — Stained Blooms Admin Panel (Supabase Integration)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Feather, Flower, Sparkles, Crown, Image as ImageIcon,
  LogOut, Trash2, Edit, Plus, X, ArrowLeft,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  MessageSquare, Mail, Home, Loader2, Settings as SettingsIcon,
  AlertTriangle
} from 'lucide-react';
import {
  getCMSData,
  saveWebsiteSettings,
  saveContact,
  saveCategory,
  deleteCategory,
  saveCategoriesList,
  saveService,
  deleteService,
  saveServicesList,
  saveGalleryItem,
  deleteGalleryItem,
  saveGalleryList,
  uploadImage,
  deleteUploadedImage,
  loginAdmin,
  logoutAdmin,
  supabase
} from './cmsHelper';

const ICONS_MAP = {
  Sparkles: Sparkles,
  Crown: Crown,
  Flower: Flower,
  Feather: Feather,
  MessageSquare: MessageSquare,
  Mail: Mail,
  Home: Home
};

// ─── Focus Trap Hook ───────────────────────────────────────────────────────────
function useFocusTrap(isActive, containerRef) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const focusable = containerRef.current.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (first) first.focus();

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      if (focusable.length === 0) { e.preventDefault(); return; }

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, containerRef]);
}

const Logo = ({ settings, className }) => {
  const [error, setError] = useState(false);
  const logoUrl = settings?.logo;
  const logoText = settings?.logoText || "Stained Blooms";

  if (error || !logoUrl) {
    return (
      <span className="font-serif text-base tracking-widest uppercase font-semibold text-[#B89A5A] whitespace-nowrap">
        {logoText}
      </span>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={logoText}
      className={className}
      onError={(e) => {
        console.error("Logo image failed to load:", e);
        setError(true);
      }}
    />
  );
};

function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('gallery');
  const [notification, setNotification] = useState({ msg: '', type: 'success' });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // CMS state values
  const [services, setServices] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [categories, setCategories] = useState([]);
  const [contact, setContact] = useState(null);
  const [settings, setSettings] = useState(null);
  const [hero, setHero] = useState(null);

  // Selected category in gallery tab
  const [selectedCatName, setSelectedCatName] = useState('');

  // Category inline edit states
  const [renamingCatId, setRenamingCatId] = useState(null);
  const [renameVal, setRenameVal] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatVal, setNewCatVal] = useState('');

  // Modals editing states
  const [editingImage, setEditingImage] = useState(null);
  const [editingSvc, setEditingSvc] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isAlert: false,
    onConfirm: null
  });

  // Refs for focus traps
  const editImageModalRef = useRef(null);
  const editSvcModalRef = useRef(null);
  const confirmModalRef = useRef(null);

  useFocusTrap(!!editingImage, editImageModalRef);
  useFocusTrap(!!editingSvc, editSvcModalRef);
  useFocusTrap(confirmModal.isOpen, confirmModalRef);

  const showConfirm = useCallback((title, message, onConfirm, confirmText = 'Delete', cancelText = 'Cancel') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      isAlert: false,
      onConfirm
    });
  }, []);

  const showAlert = useCallback((title, message) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText: 'OK',
      cancelText: '',
      isAlert: true,
      onConfirm: null
    });
  }, []);

  // Toast helper
  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification({ msg: '', type: 'success' }), 3000);
  };

  // Check Auth & load settings
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsAuthenticated(true);
          await loadData();
        } else {
          // Just fetch branding settings for the login page
          const loadedSettings = await getCMSData('settings');
          setSettings(loadedSettings || {});
          setIsLoading(false);
        }
      } catch (e) {
        console.warn("Failed session check:", e);
        setIsLoading(false);
      }
    };
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update document title and favicon dynamically in admin too
  useEffect(() => {
    if (settings) {
      if (settings.metaTitle) document.title = `Admin | ${settings.metaTitle}`;
      if (settings.favicon) {
        const link = document.querySelector("link[rel*='icon']");
        if (link) link.href = settings.favicon;
      }
    }
  }, [settings]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [
        loadedCategories,
        loadedServices,
        loadedGallery,
        loadedContact,
        loadedSettings,
        loadedHero
      ] = await Promise.all([
        getCMSData('categories'),
        getCMSData('services'),
        getCMSData('gallery'),
        getCMSData('contact'),
        getCMSData('settings'),
        getCMSData('hero')
      ]);

      const validCategories = loadedCategories || [];
      setCategories(validCategories);

      // Default select the first non-'All' category
      const firstCat = validCategories.find(c => c.name !== 'All');
      if (firstCat) {
        setSelectedCatName(firstCat.name);
      }

      setServices(loadedServices || []);
      setGallery(loadedGallery || []);
      setContact(loadedContact || {});
      setSettings(loadedSettings || {});
      setHero(loadedHero || {});
    } catch (e) {
      console.error(e);
      showAlert('Error', 'Failed to retrieve cloud CMS data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await loginAdmin(username, password);
      setIsAuthenticated(true);
      setLoginError('');
      await loadData();
    } catch (err) {
      setLoginError(err.message || 'Invalid username or password.');
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    showConfirm(
      'Logout?',
      'Are you sure you want to log out of the admin panel?',
      async () => {
        await logoutAdmin();
        setIsAuthenticated(false);
        setUsername('');
        setPassword('');
      },
      'Logout'
    );
  };

  // ─── IMAGE UPLOAD HANDLING ───────────────────────────────────────────────────
  const handleImageSelect = async (e, callback) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsSaving(true);
    showNotification('Uploading image to cloud storage...', 'info');

    try {
      const imageUrl = await uploadImage(file);
      await callback(imageUrl);
    } catch (err) {
      showAlert('Upload Failed', err.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsSaving(false);
    }
    e.target.value = '';
  };

  // ─── CATEGORY MUTATIONS (IMMEDIATE AUTO-SAVE) ─────────────────────────────────
  const handleAddCategorySubmit = async () => {
    if (!newCatVal.trim()) {
      setIsAddingCat(false);
      return;
    }
    const cleanName = newCatVal.trim();
    if (categories.find(c => c.name.toLowerCase() === cleanName.toLowerCase())) {
      showAlert('Duplicate Category', 'A category with that name already exists.');
      setIsAddingCat(false);
      setNewCatVal('');
      return;
    }

    setIsSaving(true);
    try {
      const newCat = {
        name: cleanName,
        isVisible: true,
        order: categories.length
      };
      await saveCategory(newCat);
      await loadData();
      setSelectedCatName(cleanName);
      setNewCatVal('');
      setIsAddingCat(false);
      showNotification('✓ Category created successfully.');
    } catch (e) {
      showAlert('Save Failed', 'Could not save category: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const saveCategoryRename = async (catId) => {
    if (!renameVal.trim()) {
      setRenamingCatId(null);
      return;
    }
    const cleanName = renameVal.trim();
    const originalCat = categories.find(c => c.id === catId);
    if (!originalCat) return;

    if (categories.find(c => c.id !== catId && c.name.toLowerCase() === cleanName.toLowerCase())) {
      showAlert('Duplicate Category', 'A category with that name already exists.');
      setRenamingCatId(null);
      return;
    }

    setIsSaving(true);
    try {
      await saveCategory({ ...originalCat, name: cleanName });
      
      // Update items inside this category immediately
      const itemsToUpdate = gallery.filter(g => g.category === originalCat.name);
      for (const item of itemsToUpdate) {
        await saveGalleryItem({ ...item, category: cleanName });
      }

      await loadData();
      if (selectedCatName === originalCat.name) {
        setSelectedCatName(cleanName);
      }
      setRenamingCatId(null);
      showNotification('✓ Category renamed successfully.');
    } catch (e) {
      showAlert('Save Failed', 'Could not rename category: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCategoryCustom = (catId, catName) => {
    showConfirm(
      'Delete Category?',
      `Are you sure you want to delete category "${catName}"? All images inside it will also be deleted from storage and database.`,
      async () => {
        setIsSaving(true);
        try {
          // Clean up files in storage
          const imagesToDelete = gallery.filter(g => g.category === catName);
          for (const item of imagesToDelete) {
            await deleteUploadedImage(item.image);
          }
          await deleteCategory(catId);
          await loadData();
          showNotification('✓ Category deleted successfully.');
        } catch (e) {
          showAlert('Delete Failed', 'Failed to delete category: ' + e.message);
        } finally {
          setIsSaving(false);
        }
      }
    );
  };

  const moveCategoryInline = async (editableIndex, direction) => {
    const actualIndex = editableIndex + 1; // skip 'All' at index 0
    const newCats = [...categories];
    const editableCatCount = categories.filter(c => c.name !== 'All').length;

    if (direction === 'left' && editableIndex > 0) {
      const targetIndex = actualIndex - 1;
      [newCats[actualIndex], newCats[targetIndex]] = [newCats[targetIndex], newCats[actualIndex]];
    } else if (direction === 'right' && editableIndex < editableCatCount - 1) {
      const targetIndex = actualIndex + 1;
      [newCats[actualIndex], newCats[targetIndex]] = [newCats[targetIndex], newCats[actualIndex]];
    }

    setIsSaving(true);
    try {
      await saveCategoriesList(newCats);
      await loadData();
      showNotification('✓ Categories reordered.');
    } catch (e) {
      showAlert('Save Failed', 'Reorder failed: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── GALLERY MUTATIONS (IMMEDIATE AUTO-SAVE) ───────────────────────────────────
  const handleAddImage = async (imageUrl) => {
    const currentImages = gallery.filter(g => g.category === selectedCatName);
    if (currentImages.length >= 8) {
      showAlert('Limit Reached', 'Maximum 8 images are allowed in each category.');
      return;
    }

    setIsSaving(true);
    try {
      const newItem = {
        category: selectedCatName,
        image: imageUrl,
        title: '',
        description: '',
        order: currentImages.length,
        visible: true
      };
      await saveGalleryItem(newItem);
      await loadData();
      showNotification('✓ Image saved successfully.');
    } catch (e) {
      showAlert('Save Failed', 'Failed to save image record: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveImageDetails = async () => {
    setIsSaving(true);
    try {
      await saveGalleryItem(editingImage);
      await loadData();
      setEditingImage(null);
      showNotification('✓ Image details updated.');
    } catch (e) {
      showAlert('Save Failed', 'Failed to update image details: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteImage = (item) => {
    showConfirm(
      'Delete Image?',
      'Are you sure you want to delete this gallery image from the database and storage?',
      async () => {
        setIsSaving(true);
        try {
          await deleteUploadedImage(item.image);
          await deleteGalleryItem(item.id);
          await loadData();
          showNotification('✓ Image deleted.');
        } catch (e) {
          showAlert('Delete Failed', 'Failed to delete image: ' + e.message);
        } finally {
          setIsSaving(false);
        }
      }
    );
  };

  // ─── HTML5 DRAG & DROP FOR GALLERY IMAGES ──────────────────────────────────────
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetIndex, currentImagesList) => {
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    const newImages = [...currentImagesList];
    const [removed] = newImages.splice(sourceIndex, 1);
    newImages.splice(targetIndex, 0, removed);

    setIsSaving(true);
    try {
      // Map other images back to the main list with their new display orders
      const updatedList = gallery.map(item => {
        if (item.category === selectedCatName) {
          const newIdx = newImages.findIndex(img => img.id === item.id);
          return { ...item, order: newIdx };
        }
        return item;
      });

      // Sort the list properly before sending
      updatedList.sort((a, b) => a.order - b.order);

      await saveGalleryList(updatedList);
      await loadData();
      showNotification('✓ Image order updated.');
    } catch (err) {
      showAlert('Reorder Failed', 'Failed to save image order: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── SERVICES MUTATIONS (IMMEDIATE AUTO-SAVE) ──────────────────────────────────
  const handleAddService = async () => {
    setIsSaving(true);
    try {
      const newSvc = {
        name: 'New Package',
        description: 'Bespoke Mehendi package tailored for your celebration.',
        icon: 'Sparkles',
        isFeatured: false,
        order: services.length
      };
      const created = await saveService(newSvc);
      await loadData();
      
      // Auto-open modal for the new service
      if (created) {
        setEditingSvc({
          id: created.id,
          name: created.title,
          description: created.description,
          icon: created.icon,
          isFeatured: created.featured,
          order: created.display_order
        });
      }
      showNotification('✓ Service package added.');
    } catch (e) {
      showAlert('Save Failed', 'Failed to add service: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveServiceDetails = async () => {
    setIsSaving(true);
    try {
      await saveService(editingSvc);
      await loadData();
      setEditingSvc(null);
      showNotification('✓ Service package updated.');
    } catch (e) {
      showAlert('Save Failed', 'Failed to save package: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteService = (svcId) => {
    showConfirm(
      'Delete Package?',
      'Are you sure you want to delete this service package?',
      async () => {
        setIsSaving(true);
        try {
          await deleteService(svcId);
          await loadData();
          showNotification('✓ Service package deleted.');
        } catch (e) {
          showAlert('Delete Failed', 'Failed to delete service: ' + e.message);
        } finally {
          setIsSaving(false);
        }
      }
    );
  };

  const moveServiceInline = async (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === services.length - 1) return;

    const newSvcs = [...services];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    [newSvcs[index], newSvcs[targetIdx]] = [newSvcs[targetIdx], newSvcs[index]];

    setIsSaving(true);
    try {
      await saveServicesList(newSvcs);
      await loadData();
      showNotification('✓ Services reordered.');
    } catch (e) {
      showAlert('Save Failed', 'Failed to save order: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── CONTACT AUTO-SAVE ───────────────────────────────────────────────────────
  const triggerContactAutoSave = async (updatedContact) => {
    setIsSaving(true);
    try {
      await saveContact(updatedContact);
      setContact(updatedContact);
      showNotification('✓ Contact details saved successfully.');
    } catch (e) {
      showNotification('✕ Save failed: ' + e.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── SETTINGS AUTO-SAVE ──────────────────────────────────────────────────────
  const triggerSettingsAutoSave = async (updatedSettings, updatedHero) => {
    setIsSaving(true);
    try {
      await saveWebsiteSettings(updatedSettings, updatedHero);
      if (updatedSettings) setSettings(updatedSettings);
      if (updatedHero) setHero(updatedHero);
      showNotification('✓ Branding settings saved successfully.');
    } catch (e) {
      showNotification('✕ Save failed: ' + e.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  /* ─── RENDER: Login Screen ───────────────────────────────────────────────── */
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center p-6 text-sans select-none relative">
        <div className="w-full max-w-md bg-[#FAF6F0] border border-[#E7DCCF] rounded-[24px] p-8 shadow-luxury text-center relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-[#0E3B2E] rounded-full flex items-center justify-center mb-4" aria-hidden="true">
              <Flower className="w-7 h-7 text-[#B89A5A]" />
            </div>
            <h1 className="text-serif text-3xl font-light text-[#4A3528]">Stained Blooms</h1>
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#B89A5A] font-semibold mt-1">Management Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 text-left" noValidate>
            <div>
              <label htmlFor="admin-username" className="text-xs uppercase tracking-wider text-[#6B6258] block mb-2 font-semibold">
                Username / Email
              </label>
              <input
                id="admin-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-[18px] border border-[#E7DCCF] bg-[#FAF6F0] p-3.5 text-sm focus:outline-none focus:border-[#B89A5A] text-[#4A3528]"
                placeholder="admin"
                disabled={isLoading}
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="text-xs uppercase tracking-wider text-[#6B6258] block mb-2 font-semibold">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[18px] border border-[#E7DCCF] bg-[#FAF6F0] p-3.5 text-sm focus:outline-none focus:border-[#B89A5A] text-[#4A3528]"
                placeholder="••••••••••••••"
                disabled={isLoading}
                required
                autoComplete="current-password"
              />
            </div>

            {loginError && (
              <p className="text-xs text-red-700 mt-2 font-light" role="alert">✕ {loginError}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-4 rounded-full mt-4 font-semibold text-xs tracking-wider flex justify-center items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin text-[#B89A5A]" />}
              <span>{isLoading ? 'Authenticating...' : 'Log In to Portal'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Safety check for loading values
  if (isLoading && !contact) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center text-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#E7DCCF] border-t-[#B89A5A] rounded-full animate-spin" role="status" aria-label="Loading CMS data"></div>
          <p className="text-xs uppercase tracking-widest text-[#B89A5A]">Loading CMS Data…</p>
        </div>
      </div>
    );
  }

  const currentImages = gallery.filter(g => g.category === selectedCatName);
  const isGalleryLimitReached = currentImages.length >= 8;

  const TABS = [
    { id: 'gallery', label: 'Gallery', icon: ImageIcon },
    { id: 'services', label: 'Services', icon: Crown },
    { id: 'contact', label: 'Contact', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-sans flex flex-col md:flex-row relative text-[#6B6258] selection:bg-[#B89A5A]/20">

      {/* Toast Notification */}
      {notification.msg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-10 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-6 bg-[#0E3B2E] border border-[#B89A5A]/30 text-[#FAF6F0] px-5 py-3.5 rounded-[18px] shadow-luxury z-50 flex items-center gap-3 text-xs tracking-wide animate-zoom-in whitespace-nowrap"
        >
          <span>{notification.msg}</span>
        </div>
      )}

      {/* ── MOBILE HEADER BAR ────────────────────── */}
      <div className="md:hidden flex items-center justify-between px-5 py-4 border-b border-[#E7DCCF] bg-[#FAF6F0] sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <Logo
            settings={settings}
            className="w-8 h-8 object-contain rounded-md"
          />
          <span className="text-serif text-base font-light text-[#4A3528]">
            {settings?.logoText || "Stained Blooms"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/"
            className="text-[#0E3B2E] border border-[#E7DCCF] rounded-full p-2 bg-white/60"
            aria-label="View public site"
          >
            <ArrowLeft className="w-4 h-4" />
          </a>
          <button
            onClick={handleLogout}
            className="text-red-700 border border-red-100 rounded-full p-2 bg-white/60"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── DESKTOP SIDEBAR ─────────────────────── */}
      <aside className="hidden md:flex w-64 border-r border-[#E7DCCF] shrink-0 bg-[#FAF6F0] flex-col justify-between p-6 min-h-screen sticky top-0" aria-label="Admin navigation">
        <div>
          {/* Brand */}
          <div className="flex items-center gap-3 pb-8 mb-8 border-b border-[#E7DCCF]">
            <Logo
              settings={settings}
              className="w-10 h-10 object-contain rounded-md"
            />
            <div className="text-left leading-none">
              <h2 className="text-serif text-lg font-light text-[#4A3528]">
                {settings?.logoText || "Stained Blooms"}
              </h2>
            </div>
          </div>

          {/* Sidebar Menu */}
          <nav className="space-y-2">
            {TABS.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-[18px] text-xs uppercase tracking-wider font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#0E3B2E] text-[#FAF6F0] shadow-sm'
                      : 'hover:bg-[#E7DCCF]/20 text-[#6B6258]'
                  }`}
                >
                  <TabIcon className="w-4 h-4 text-[#B89A5A]" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar footer */}
        <div className="pt-6 border-t border-[#E7DCCF] space-y-3">
          <a
            href="/"
            className="w-full flex items-center justify-center gap-2 border border-[#E7DCCF] hover:bg-[#0E3B2E]/5 text-[#0E3B2E] py-3 rounded-full text-xs uppercase tracking-wider font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>View Public Site</span>
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 border border-red-700/20 hover:bg-red-700/5 text-red-800 py-3 rounded-full text-xs uppercase tracking-wider font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CMS WORKSPACE */}
      <main className="flex-grow flex flex-col min-h-screen overflow-y-auto pb-24 md:pb-8">
        {/* Desktop header */}
        <header className="hidden md:flex border-b border-[#E7DCCF] py-5 px-8 items-center justify-between">
          <h1 className="text-serif text-2xl lg:text-3xl font-light text-[#4A3528] capitalize">
            {activeTab === 'services' ? 'Services & Packages' : activeTab === 'gallery' ? 'Gallery Manager' : activeTab === 'contact' ? 'Contact Details' : 'Website Settings'}
          </h1>
          {isSaving && (
            <span className="text-[10px] text-[#B89A5A] uppercase tracking-wider font-semibold animate-pulse flex items-center gap-1.5" aria-live="polite">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving changes...</span>
            </span>
          )}
        </header>

        {/* Mobile page title */}
        <div className="md:hidden px-5 py-4 flex items-center justify-between">
          <h1 className="text-serif text-xl font-light text-[#4A3528] capitalize">
            {activeTab === 'services' ? 'Services & Packages' : activeTab === 'gallery' ? 'Gallery' : activeTab === 'contact' ? 'Contact' : 'Settings'}
          </h1>
          {isSaving && (
            <span className="text-[10px] text-[#B89A5A] uppercase tracking-wider font-semibold flex items-center gap-1" aria-live="polite">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Saving...</span>
            </span>
          )}
        </div>

        <div className="p-4 sm:p-6 md:p-8 lg:p-10 max-w-5xl w-full">

          {/* TAB: GALLERY */}
          {activeTab === 'gallery' && (
            <div className="space-y-8 text-left">

              {/* Category Cards */}
              <div className="space-y-4">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#B89A5A]">Categories</span>

                <div className="flex flex-wrap gap-4">
                  {categories.filter(c => c.name !== 'All').map((cat, idx) => (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedCatName(cat.name)}
                      role="button"
                      tabIndex={0}
                      aria-pressed={selectedCatName === cat.name}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedCatName(cat.name); }}
                      className={`relative px-5 py-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between min-w-[150px] h-[110px] ${
                        selectedCatName === cat.name
                          ? 'border-[#B89A5A] bg-[#0E3B2E]/5 text-[#0E3B2E]'
                          : 'border-[#E7DCCF] bg-white text-[#6B6258] hover:border-[#B89A5A]/50'
                      }`}
                    >
                      {/* Rename input vs title */}
                      {renamingCatId === cat.id ? (
                        <input
                          type="text"
                          autoFocus
                          value={renameVal}
                          onChange={(e) => setRenameVal(e.target.value)}
                          onBlur={() => saveCategoryRename(cat.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveCategoryRename(cat.id);
                            if (e.key === 'Escape') setRenamingCatId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Rename category ${cat.name}`}
                          className="border-b border-[#B89A5A] bg-transparent text-sm font-semibold outline-none py-1 w-full text-[#4A3528]"
                        />
                      ) : (
                        <span className="text-sm font-semibold truncate pr-4 text-[#4A3528]">{cat.name}</span>
                      )}

                      {/* Controls footer inside card */}
                      <div
                        className="flex items-center justify-between mt-auto w-full pt-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveCategoryInline(idx, 'left')}
                            disabled={idx === 0}
                            className="p-1 hover:bg-[#0E3B2E]/5 text-[#6B6258] hover:text-[#0E3B2E] rounded disabled:opacity-30 disabled:hover:bg-transparent"
                            aria-label={`Move ${cat.name} left`}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveCategoryInline(idx, 'right')}
                            disabled={idx === categories.filter(c => c.name !== 'All').length - 1}
                            className="p-1 hover:bg-[#0E3B2E]/5 text-[#6B6258] hover:text-[#0E3B2E] rounded disabled:opacity-30 disabled:hover:bg-transparent"
                            aria-label={`Move ${cat.name} right`}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setRenamingCatId(cat.id);
                              setRenameVal(cat.name);
                            }}
                            className="p-1 text-[#6B6258] hover:text-[#0E3B2E] hover:bg-[#0E3B2E]/5 rounded"
                            aria-label={`Rename category ${cat.name}`}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCategoryCustom(cat.id, cat.name)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                            aria-label={`Delete category ${cat.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Inline Add Category Card */}
                  <div className="border-2 border-dashed border-[#E7DCCF] hover:border-[#B89A5A] rounded-2xl p-4 flex items-center justify-center min-w-[150px] h-[110px] bg-white hover:bg-[#FAF6F0]/50 transition-all cursor-pointer">
                    {isAddingCat ? (
                      <div className="flex flex-col items-center gap-1.5 w-full">
                        <input
                          type="text"
                          autoFocus
                          placeholder="Category Name"
                          value={newCatVal}
                          onChange={(e) => setNewCatVal(e.target.value)}
                          onBlur={() => handleAddCategorySubmit()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddCategorySubmit();
                            if (e.key === 'Escape') setIsAddingCat(false);
                          }}
                          aria-label="New category name"
                          className="border-b border-[#B89A5A] bg-transparent text-xs text-center font-semibold outline-none py-1 w-full text-[#4A3528]"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onMouseDown={handleAddCategorySubmit}
                            className="text-emerald-700 text-xs font-semibold px-2 py-0.5 hover:bg-emerald-50 rounded"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onMouseDown={() => setIsAddingCat(false)}
                            className="text-red-700 text-xs font-semibold px-2 py-0.5 hover:bg-red-50 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAddingCat(true)}
                        className="flex flex-col items-center text-[#B89A5A] font-semibold text-xs tracking-wider uppercase gap-1 w-full h-full justify-center"
                        aria-label="Add new category"
                      >
                        <Plus className="w-5 h-5 text-[#B89A5A] mb-1" aria-hidden="true" />
                        <span>Add Category</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Images Grid */}
              <div className="space-y-4 pt-4 border-t border-[#E7DCCF]/60">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#B89A5A]">
                    Images in {selectedCatName ? `"${selectedCatName}"` : 'selected category'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#6B6258]/60 font-light">Max 8 images per category ({currentImages.length} / 8 uploaded)</span>
                  </div>
                </div>

                {isGalleryLimitReached && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-800" role="alert">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Maximum 8 images are allowed in each category.</p>
                      <p className="mt-0.5 text-amber-700/90 font-light">To upload a new design, please delete one of the existing designs in this category first.</p>
                    </div>
                  </div>
                )}

                {selectedCatName ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                    {currentImages.length === 0 && (
                      <div className="col-span-2 sm:col-span-3 md:col-span-4 py-12 border-2 border-dashed border-[#E7DCCF] rounded-2xl bg-white text-center text-xs text-[#6B6258]/60 font-light">
                        No images yet. Upload your first image below.
                      </div>
                    )}

                    {currentImages.map((item, index) => (
                      <div
                        key={item.id}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index, currentImages)}
                        className="group relative bg-white border border-[#E7DCCF] rounded-2xl overflow-hidden shadow-sm hover:shadow-luxury-hover transition-all h-[210px] flex flex-col cursor-grab active:cursor-grabbing"
                      >
                        {/* Image Preview */}
                        <div className="w-full h-[155px] relative overflow-hidden bg-white border-b border-[#E7DCCF]/60 flex items-center justify-center">
                          <img
                            src={item.image}
                            alt={item.title || 'Gallery image'}
                            className="w-full h-full object-cover pointer-events-none"
                          />
                          {/* Hover action overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingImage(item)}
                              className="p-2 bg-white text-[#0E3B2E] rounded-full hover:scale-105 transition-all shadow-md font-semibold text-xs flex items-center gap-1 cursor-pointer"
                              aria-label={`Edit image: ${item.title || 'Untitled'}`}
                            >
                              <Edit className="w-4 h-4 text-[#B89A5A]" aria-hidden="true" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(item)}
                              className="p-2 bg-red-600 text-white rounded-full hover:scale-105 transition-all shadow-md cursor-pointer"
                              aria-label={`Delete image: ${item.title || 'Untitled'}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Card Info footer */}
                        <div className="p-3.5 flex items-center justify-between mt-auto bg-white pointer-events-none">
                          <span className="text-xs font-semibold truncate text-[#4A3528] max-w-[70%] text-left">
                            {item.title || 'Untitled Image'}
                          </span>
                          <div className="flex items-center gap-1 pointer-events-auto">
                            <button
                              type="button"
                              onClick={() => setEditingImage(item)}
                              className="p-1 text-[#6B6258] hover:text-[#0E3B2E] rounded cursor-pointer"
                              aria-label={`Edit ${item.title || 'image'}`}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(item)}
                              className="p-1 text-red-600 hover:text-red-800 rounded cursor-pointer"
                              aria-label={`Delete ${item.title || 'image'}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* + Add Image Card */}
                    {!isGalleryLimitReached && (
                      <div className="border-2 border-dashed border-[#E7DCCF] hover:border-[#B89A5A] rounded-2xl flex flex-col items-center justify-center h-[210px] bg-white hover:bg-[#FAF6F0]/50 transition-all cursor-pointer relative">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          id="image-grid-upload"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => handleImageSelect(e, (url) => handleAddImage(url))}
                          aria-label="Upload new image"
                        />
                        <Plus className="w-8 h-8 text-[#B89A5A] mb-1" aria-hidden="true" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#B89A5A]">+ Add Image</span>
                        <span className="text-[10px] text-[#6B6258]/60 mt-1 font-light">{currentImages.length} / 8 uploaded</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 border border-[#E7DCCF] rounded-2xl bg-white text-center text-xs text-[#6B6258]/60 font-light">
                    Create or select a category above to start uploading images.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB: SERVICES / PACKAGES */}
          {activeTab === 'services' && (
            <div className="space-y-8 text-left">
              <div className="flex items-center justify-between border-b border-[#E7DCCF]/60 pb-3">
                <span className="text-xs text-[#6B6258]/60 font-light">
                  Add, update icon, feature highlights, and order services. Changes persist immediately.
                </span>
              </div>

              {/* Package cards list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {services.map((svc, idx) => {
                  const IconComp = ICONS_MAP[svc.icon] || Sparkles;
                  return (
                    <div
                      key={svc.id}
                      onClick={() => setEditingSvc(svc)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Edit service: ${svc.name}`}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setEditingSvc(svc); }}
                      className={`group relative bg-white border rounded-2xl p-6 shadow-sm hover:shadow-luxury-hover transition-all flex flex-col justify-between min-h-[200px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#B89A5A] ${
                        svc.isFeatured ? 'border-[#B89A5A] ring-2 ring-[#B89A5A]/10' : 'border-[#E7DCCF]'
                      }`}
                    >
                      {/* Top Header Badge & Icon */}
                      <div className="flex items-center justify-between mb-3" onClick={(e) => e.stopPropagation()}>
                        <div className="w-9 h-9 rounded-full bg-[#0E3B2E]/5 flex items-center justify-center border border-[#E7DCCF]">
                          <IconComp className="w-5 h-5 text-[#B89A5A]" aria-hidden="true" />
                        </div>
                        {svc.isFeatured && (
                          <span className="text-[8px] bg-[#B89A5A] text-[#FAF6F0] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                            ★ Featured
                          </span>
                        )}
                      </div>

                      {/* Name */}
                      <div className="text-left mb-2">
                        <h4 className="text-serif text-xl font-light text-[#4A3528] group-hover:text-[#0E3B2E] transition-colors truncate">
                          {svc.name}
                        </h4>
                      </div>

                      {/* Short Description */}
                      <p className="text-xs font-light text-[#6B6258] text-left line-clamp-3 leading-relaxed flex-grow">
                        {svc.description || 'No description details provided.'}
                      </p>

                      {/* Reordering & Control Footer */}
                      <div
                        className="flex items-center justify-between border-t border-[#E7DCCF]/60 mt-4 pt-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveServiceInline(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 hover:bg-[#0E3B2E]/5 text-[#6B6258] hover:text-[#0E3B2E] rounded disabled:opacity-30 disabled:hover:bg-transparent"
                            aria-label={`Move ${svc.name} up`}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveServiceInline(idx, 'down')}
                            disabled={idx === services.length - 1}
                            className="p-1 hover:bg-[#0E3B2E]/5 text-[#6B6258] hover:text-[#0E3B2E] rounded disabled:opacity-30 disabled:hover:bg-transparent"
                            aria-label={`Move ${svc.name} down`}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingSvc(svc)}
                            className="p-1.5 text-[#6B6258] hover:text-[#0E3B2E] rounded"
                            aria-label={`Edit ${svc.name}`}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteService(svc.id)}
                            className="p-1.5 text-red-600 hover:text-red-800 rounded"
                            aria-label={`Delete ${svc.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* + Add Package Card */}
                <div
                  onClick={handleAddService}
                  role="button"
                  tabIndex={0}
                  aria-label="Add new service package"
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleAddService(); }}
                  className="border-2 border-dashed border-[#E7DCCF] hover:border-[#B89A5A] rounded-2xl flex flex-col items-center justify-center min-h-[200px] bg-white hover:bg-[#FAF6F0]/50 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#B89A5A]"
                >
                  <Plus className="w-8 h-8 text-[#B89A5A] mb-1" aria-hidden="true" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#B89A5A]">+ Add Package</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB: CONTACT INFORMATION */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="max-w-xl mx-auto space-y-6 text-left">
                <div className="bg-white border border-[#E7DCCF] rounded-3xl p-8 space-y-6 shadow-sm">
                  
                  {/* Instagram Link */}
                  <div>
                    <label htmlFor="contact-instagram" className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6258] block mb-2">
                      Instagram Profile URL
                    </label>
                    <input
                      id="contact-instagram"
                      type="url"
                      value={contact.instagramUrl || ''}
                      onChange={(e) => setContact({ ...contact, instagramUrl: e.target.value })}
                      onBlur={() => triggerContactAutoSave(contact)}
                      className="w-full rounded-xl border border-[#E7DCCF] bg-[#FAF6F0] p-3.5 text-sm focus:outline-none focus:border-[#B89A5A] text-[#4A3528]"
                      placeholder="https://instagram.com/stainedblooms"
                    />
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label htmlFor="contact-whatsapp" className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6258] block mb-2">
                      WhatsApp Number
                    </label>
                    <input
                      id="contact-whatsapp"
                      type="tel"
                      value={contact.whatsappNumber || ''}
                      onChange={(e) => setContact({ ...contact, whatsappNumber: e.target.value })}
                      onBlur={() => triggerContactAutoSave(contact)}
                      className="w-full rounded-xl border border-[#E7DCCF] bg-[#FAF6F0] p-3.5 text-sm focus:outline-none focus:border-[#B89A5A] text-[#4A3528]"
                      placeholder="+911234567890"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="contact-email" className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6258] block mb-2">
                      Email Address
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={contact.emailAddress || ''}
                      onChange={(e) => setContact({ ...contact, emailAddress: e.target.value })}
                      onBlur={() => triggerContactAutoSave(contact)}
                      className="w-full rounded-xl border border-[#E7DCCF] bg-[#FAF6F0] p-3.5 text-sm focus:outline-none focus:border-[#B89A5A] text-[#4A3528]"
                      placeholder="inquiry@stainedblooms.com"
                    />
                  </div>

                  {/* CTA Text */}
                  <div>
                    <label htmlFor="contact-cta" className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6258] block mb-2">
                      CTA Button Text
                    </label>
                    <input
                      id="contact-cta"
                      type="text"
                      value={contact.ctaText || ''}
                      onChange={(e) => setContact({ ...contact, ctaText: e.target.value })}
                      onBlur={() => triggerContactAutoSave(contact)}
                      className="w-full rounded-xl border border-[#E7DCCF] bg-[#FAF6F0] p-3.5 text-sm focus:outline-none focus:border-[#B89A5A] text-[#4A3528]"
                      placeholder="DM on Instagram"
                    />
                    <p className="text-[10px] text-[#6B6258]/60 mt-1 font-light">Shown on the contact section CTA banner.</p>
                  </div>
                </div>

                <div className="text-center">
                  <span className="text-[10px] text-[#B89A5A] uppercase tracking-widest font-semibold">
                    ⚡ Changes save automatically on field exit
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: WEBSITE SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 text-left">
              <div className="max-w-2xl mx-auto space-y-6">
                
                {/* Branding Core Settings */}
                <div className="bg-white border border-[#E7DCCF] rounded-3xl p-8 space-y-6 shadow-sm">
                  <h3 className="text-serif text-xl font-medium text-[#4A3528] border-b border-[#E7DCCF]/60 pb-3">Branding & Layout</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Website Name */}
                    <div>
                      <label htmlFor="setting-web-name" className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6258] block mb-2">
                        Website Name
                      </label>
                      <input
                        id="setting-web-name"
                        type="text"
                        value={settings.websiteName || ''}
                        onChange={(e) => setSettings({ ...settings, websiteName: e.target.value })}
                        onBlur={() => triggerSettingsAutoSave({ ...settings, websiteName: settings.websiteName }, null)}
                        className="w-full rounded-xl border border-[#E7DCCF] bg-[#FAF6F0] p-3.5 text-sm focus:outline-none focus:border-[#B89A5A] text-[#4A3528]"
                        placeholder="Stained Blooms"
                      />
                    </div>

                    {/* Logo Text */}
                    <div>
                      <label htmlFor="setting-logo-text" className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6258] block mb-2">
                        Logo Brand Text
                      </label>
                      <input
                        id="setting-logo-text"
                        type="text"
                        value={settings.logoText || ''}
                        onChange={(e) => setSettings({ ...settings, logoText: e.target.value })}
                        onBlur={() => triggerSettingsAutoSave({ ...settings, logoText: settings.logoText }, null)}
                        className="w-full rounded-xl border border-[#E7DCCF] bg-[#FAF6F0] p-3.5 text-sm focus:outline-none focus:border-[#B89A5A] text-[#4A3528]"
                        placeholder="Stained Blooms"
                      />
                    </div>
                  </div>

                  {/* Logo and Favicon uploads */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    
                    {/* Logo Image */}
                    <div className="flex flex-col items-center p-4 border border-[#E7DCCF] rounded-2xl bg-[#FAF6F0]/30">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6258] mb-3 align-self-start">Logo Image</span>
                      <div className="w-20 h-20 rounded-xl overflow-hidden border border-[#E7DCCF] bg-white flex items-center justify-center mb-4">
                        {settings.logo ? (
                          <img src={settings.logo} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-[#B89A5A]/40" />
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          id="logo-image-file"
                          className="hidden"
                          onChange={(e) => handleImageSelect(e, async (url) => {
                            const newSettings = { ...settings, logo: url };
                            await triggerSettingsAutoSave(newSettings, null);
                          })}
                        />
                        <label htmlFor="logo-image-file" className="btn-outline px-4 py-2 text-[9px] uppercase tracking-widest font-bold cursor-pointer">
                          Upload Logo
                        </label>
                      </div>
                    </div>

                    {/* Favicon Image */}
                    <div className="flex flex-col items-center p-4 border border-[#E7DCCF] rounded-2xl bg-[#FAF6F0]/30">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6258] mb-3 align-self-start">Favicon (Browser Tab Icon)</span>
                      <div className="w-20 h-20 rounded-xl overflow-hidden border border-[#E7DCCF] bg-white flex items-center justify-center mb-4">
                        {settings.favicon ? (
                          <img src={settings.favicon} alt="Favicon" className="w-10 h-10 object-contain" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-[#B89A5A]/40" />
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          id="favicon-image-file"
                          className="hidden"
                          onChange={(e) => handleImageSelect(e, async (url) => {
                            const newSettings = { ...settings, favicon: url };
                            await triggerSettingsAutoSave(newSettings, null);
                          })}
                        />
                        <label htmlFor="favicon-image-file" className="btn-outline px-4 py-2 text-[9px] uppercase tracking-widest font-bold cursor-pointer">
                          Upload Favicon
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Footer Text */}
                  <div>
                    <label htmlFor="setting-footer" className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6258] block mb-2">
                      Footer Text
                    </label>
                    <input
                      id="setting-footer"
                      type="text"
                      value={settings.footerText || ''}
                      onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                      onBlur={() => triggerSettingsAutoSave({ ...settings, footerText: settings.footerText }, null)}
                      className="w-full rounded-xl border border-[#E7DCCF] bg-[#FAF6F0] p-3.5 text-sm focus:outline-none focus:border-[#B89A5A] text-[#4A3528]"
                      placeholder="Footer copyright description"
                    />
                  </div>
                </div>

                {/* Hero Configuration Settings */}
                <div className="bg-white border border-[#E7DCCF] rounded-3xl p-8 space-y-6 shadow-sm">
                  <h3 className="text-serif text-xl font-medium text-[#4A3528] border-b border-[#E7DCCF]/60 pb-3">Hero Section Banner</h3>
                  
                  {/* Hero Title */}
                  <div>
                    <label htmlFor="setting-hero-title" className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6258] block mb-2">
                      Hero Title
                    </label>
                    <textarea
                      id="setting-hero-title"
                      rows="2"
                      value={hero.heading || ''}
                      onChange={(e) => setHero({ ...hero, heading: e.target.value })}
                      onBlur={() => triggerSettingsAutoSave(null, { ...hero, heading: hero.heading })}
                      className="w-full rounded-xl border border-[#E7DCCF] bg-[#FAF6F0] p-3.5 text-sm focus:outline-none focus:border-[#B89A5A] text-[#4A3528] resize-none"
                      placeholder="Heading title (use \n for line breaks)"
                    />
                  </div>

                  {/* Hero Subtitle */}
                  <div>
                    <label htmlFor="setting-hero-sub" className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6258] block mb-2">
                      Hero Subtitle / Description
                    </label>
                    <textarea
                      id="setting-hero-sub"
                      rows="3"
                      value={hero.description || ''}
                      onChange={(e) => setHero({ ...hero, description: e.target.value })}
                      onBlur={() => triggerSettingsAutoSave(null, { ...hero, description: hero.description })}
                      className="w-full rounded-xl border border-[#E7DCCF] bg-[#FAF6F0] p-3.5 text-sm focus:outline-none focus:border-[#B89A5A] text-[#4A3528] resize-none font-light leading-relaxed"
                      placeholder="Brief descriptive tagline"
                    />
                  </div>

                  {/* Hero Image upload & Preview */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-4 border border-[#E7DCCF] rounded-2xl bg-[#FAF6F0]/30">
                    <div className="w-32 aspect-[3/4] rounded-xl overflow-hidden border border-[#E7DCCF] bg-white shrink-0">
                      {hero.image ? (
                        <img src={hero.image} alt="Hero banner" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-[#B89A5A]/30" /></div>
                      )}
                    </div>
                    <div className="flex-grow space-y-2 text-center sm:text-left">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6258] block">Hero Image File</span>
                      <input
                        type="file"
                        accept="image/*"
                        id="hero-banner-file"
                        className="hidden"
                        onChange={(e) => handleImageSelect(e, async (url) => {
                          const newHero = { ...hero, image: url };
                          await triggerSettingsAutoSave(null, newHero);
                        })}
                      />
                      <label htmlFor="hero-banner-file" className="btn-outline px-5 py-2.5 text-[9px] uppercase tracking-widest font-bold cursor-pointer inline-block">
                        Upload Hero Image
                      </label>
                      <p className="text-[9px] text-[#6B6258]/60 font-light">Recommended portrait mode, under 10MB.</p>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="border-t border-[#E7DCCF]/60 pt-4 space-y-4">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#B89A5A] block">Call To Action Buttons</span>
                    
                    {/* Primary CTA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="primary-cta-label" className="text-[9px] uppercase tracking-wider text-[#6B6258] block mb-1">Primary Button Label</label>
                        <input
                          id="primary-cta-label"
                          type="text"
                          value={hero.buttonText || ''}
                          onChange={(e) => setHero({ ...hero, buttonText: e.target.value })}
                          onBlur={() => triggerSettingsAutoSave(null, { ...hero, buttonText: hero.buttonText })}
                          className="w-full rounded-lg border border-[#E7DCCF] bg-[#FAF6F0] p-3 text-xs focus:outline-none text-[#4A3528]"
                          placeholder="Message on Instagram"
                        />
                      </div>
                      <div>
                        <label htmlFor="primary-cta-url" className="text-[9px] uppercase tracking-wider text-[#6B6258] block mb-1">Primary Button URL</label>
                        <input
                          id="primary-cta-url"
                          type="text"
                          value={hero.buttonUrl || ''}
                          onChange={(e) => setHero({ ...hero, buttonUrl: e.target.value })}
                          onBlur={() => triggerSettingsAutoSave(null, { ...hero, buttonUrl: hero.buttonUrl })}
                          className="w-full rounded-lg border border-[#E7DCCF] bg-[#FAF6F0] p-3 text-xs focus:outline-none text-[#4A3528]"
                          placeholder="https://instagram.com"
                        />
                      </div>
                    </div>

                    {/* Secondary CTA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="secondary-cta-label" className="text-[9px] uppercase tracking-wider text-[#6B6258] block mb-1">Secondary Button Label</label>
                        <input
                          id="secondary-cta-label"
                          type="text"
                          value={hero.secondaryButtonText || ''}
                          onChange={(e) => setHero({ ...hero, secondaryButtonText: e.target.value })}
                          onBlur={() => triggerSettingsAutoSave(null, { ...hero, secondaryButtonText: hero.secondaryButtonText })}
                          className="w-full rounded-lg border border-[#E7DCCF] bg-[#FAF6F0] p-3 text-xs focus:outline-none text-[#4A3528]"
                          placeholder="View Gallery"
                        />
                      </div>
                      <div>
                        <label htmlFor="secondary-cta-url" className="text-[9px] uppercase tracking-wider text-[#6B6258] block mb-1">Secondary Button URL</label>
                        <input
                          id="secondary-cta-url"
                          type="text"
                          value={hero.secondaryButtonUrl || ''}
                          onChange={(e) => setHero({ ...hero, secondaryButtonUrl: e.target.value })}
                          onBlur={() => triggerSettingsAutoSave(null, { ...hero, secondaryButtonUrl: hero.secondaryButtonUrl })}
                          className="w-full rounded-lg border border-[#E7DCCF] bg-[#FAF6F0] p-3 text-xs focus:outline-none text-[#4A3528]"
                          placeholder="#gallery"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SEO and Metadata settings */}
                <div className="bg-white border border-[#E7DCCF] rounded-3xl p-8 space-y-6 shadow-sm">
                  <h3 className="text-serif text-xl font-medium text-[#4A3528] border-b border-[#E7DCCF]/60 pb-3">Search Engine Optimization (SEO)</h3>
                  
                  {/* Meta Title */}
                  <div>
                    <label htmlFor="seo-title" className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6258] block mb-2">
                      Browser Tab Title (Meta Title)
                    </label>
                    <input
                      id="seo-title"
                      type="text"
                      value={settings.metaTitle || ''}
                      onChange={(e) => setSettings({ ...settings, metaTitle: e.target.value })}
                      onBlur={() => triggerSettingsAutoSave({ ...settings, metaTitle: settings.metaTitle }, null)}
                      className="w-full rounded-xl border border-[#E7DCCF] bg-[#FAF6F0] p-3.5 text-sm focus:outline-none focus:border-[#B89A5A] text-[#4A3528]"
                      placeholder="Stained Blooms — Luxury Bridal Mehendi"
                    />
                  </div>

                  {/* Meta Description */}
                  <div>
                    <label htmlFor="seo-desc" className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6258] block mb-2">
                      Search Description (Meta Description)
                    </label>
                    <textarea
                      id="seo-desc"
                      rows="3"
                      value={settings.metaDescription || ''}
                      onChange={(e) => setSettings({ ...settings, metaDescription: e.target.value })}
                      onBlur={() => triggerSettingsAutoSave({ ...settings, metaDescription: settings.metaDescription }, null)}
                      className="w-full rounded-xl border border-[#E7DCCF] bg-[#FAF6F0] p-3.5 text-sm focus:outline-none focus:border-[#B89A5A] text-[#4A3528] resize-none font-light leading-relaxed"
                      placeholder="Enter search snippet details..."
                    />
                  </div>
                </div>

                <div className="text-center pb-8">
                  <span className="text-[10px] text-[#B89A5A] uppercase tracking-widest font-semibold">
                    ⚡ Changes save automatically on field exit
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── MOBILE BOTTOM TAB BAR ──────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF6F0] border-t border-[#E7DCCF] flex items-center justify-around px-2 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]" aria-label="Bottom navigation">
        {TABS.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              className={`flex flex-col items-center justify-center flex-1 py-2 rounded-2xl transition-all ${
                activeTab === tab.id
                  ? 'text-[#0E3B2E] bg-[#0E3B2E]/5'
                  : 'text-[#6B6258]/60'
              }`}
            >
              <TabIcon className={`w-5 h-5 mb-1 ${activeTab === tab.id ? 'text-[#B89A5A]' : 'text-[#B89A5A]/40'}`} aria-hidden="true" />
              <span className="text-[9px] uppercase tracking-wider font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* POPUP MODAL: IMAGE DETAILS */}
      {editingImage && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Edit image details"
          onClick={(e) => { if (e.target === e.currentTarget) setEditingImage(null); }}
        >
          <div
            ref={editImageModalRef}
            className="bg-[#FAF6F0] border border-[#E7DCCF] rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 relative animate-zoom-in text-left max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[#E7DCCF] pb-4">
              <h3 className="text-serif text-2xl font-light text-[#4A3528]">Edit Image Details</h3>
              <button
                onClick={() => setEditingImage(null)}
                className="p-1 rounded-full hover:bg-black/5 text-[#6B6258] focus:outline-none focus:ring-2 focus:ring-[#B89A5A] cursor-pointer"
                aria-label="Close edit image modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image Preview + Change Image Action */}
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border border-[#E7DCCF] bg-white shrink-0">
                <img
                  src={editingImage.image}
                  alt={editingImage.title || 'Gallery image preview'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-grow space-y-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  id="modal-change-image"
                  className="hidden"
                  onChange={(e) => handleImageSelect(e, async (url) => {
                    // Try to delete old storage file if replacing
                    if (editingImage.image) {
                      await deleteUploadedImage(editingImage.image);
                    }
                    setEditingImage({ ...editingImage, image: url });
                  })}
                />
                <label
                  htmlFor="modal-change-image"
                  className="btn-outline px-4 py-2 cursor-pointer text-[10px] tracking-widest font-bold inline-block text-center uppercase"
                >
                  Change Image
                </label>
                <p className="text-[9px] text-[#6B6258]/60 font-light">Max size 10MB (JPEG, PNG, WEBP)</p>
              </div>
            </div>

            {/* Title Field */}
            <div>
              <label htmlFor="img-title" className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6258] block mb-2">
                Image Title <span className="font-light normal-case">(Optional)</span>
              </label>
              <input
                id="img-title"
                type="text"
                value={editingImage.title}
                onChange={(e) => setEditingImage({ ...editingImage, title: e.target.value })}
                placeholder="e.g. Traditional Bridal Palms"
                className="w-full rounded-xl border border-[#E7DCCF] bg-[#FAF6F0] p-3.5 text-sm focus:outline-none focus:border-[#B89A5A] text-[#4A3528]"
              />
            </div>

            {/* Description Field */}
            <div>
              <label htmlFor="img-description" className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6258] block mb-2">
                Short Description <span className="font-light normal-case">(Optional)</span>
              </label>
              <textarea
                id="img-description"
                rows="3"
                value={editingImage.description}
                onChange={(e) => setEditingImage({ ...editingImage, description: e.target.value })}
                placeholder="Brief description of this pattern style."
                className="w-full rounded-xl border border-[#E7DCCF] bg-[#FAF6F0] p-3.5 text-sm focus:outline-none focus:border-[#B89A5A] text-[#4A3528] font-light leading-relaxed resize-none"
              />
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between border-t border-[#E7DCCF] pt-6 gap-3">
              <button
                type="button"
                onClick={() => {
                  showConfirm(
                    'Delete Image?',
                    'Are you sure you want to delete this image?',
                    async () => {
                      setIsSaving(true);
                      try {
                        await deleteUploadedImage(editingImage.image);
                        await deleteGalleryItem(editingImage.id);
                        await loadData();
                        setEditingImage(null);
                        showNotification('✓ Image deleted.');
                      } catch (err) {
                        showAlert('Delete Failed', err.message);
                      } finally {
                        setIsSaving(false);
                      }
                    }
                  );
                }}
                className="px-4 py-3 border border-red-200 hover:bg-red-50 text-red-700 text-xs font-semibold rounded-full uppercase tracking-wider flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Delete Image</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingImage(null)}
                  className="px-5 py-3 border border-[#E7DCCF] hover:bg-black/5 text-[#6B6258] text-xs font-semibold rounded-full uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#B89A5A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveImageDetails}
                  className="px-6 py-3 bg-[#0E3B2E] text-white hover:bg-[#0A3025] text-xs font-semibold rounded-full uppercase tracking-wider shadow-md focus:outline-none focus:ring-2 focus:ring-[#B89A5A] cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: SERVICE PACKAGE DETAILS */}
      {editingSvc && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Edit service package"
          onClick={(e) => { if (e.target === e.currentTarget) setEditingSvc(null); }}
        >
          <div
            ref={editSvcModalRef}
            className="bg-[#FAF6F0] border border-[#E7DCCF] rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 relative animate-zoom-in text-left max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[#E7DCCF] pb-4">
              <h3 className="text-serif text-2xl font-light text-[#4A3528]">Edit Package</h3>
              <button
                onClick={() => setEditingSvc(null)}
                className="p-1 rounded-full hover:bg-black/5 text-[#6B6258] focus:outline-none focus:ring-2 focus:ring-[#B89A5A] cursor-pointer"
                aria-label="Close edit package modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Package Name */}
            <div>
              <label htmlFor="svc-name" className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6258] block mb-2">
                Package Name
              </label>
              <input
                id="svc-name"
                type="text"
                value={editingSvc.name}
                onChange={(e) => setEditingSvc({ ...editingSvc, name: e.target.value })}
                className="w-full rounded-xl border border-[#E7DCCF] bg-[#FAF6F0] p-3.5 text-sm focus:outline-none focus:border-[#B89A5A] text-[#4A3528]"
                required
              />
            </div>

            {/* Description Details */}
            <div>
              <label htmlFor="svc-description" className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6258] block mb-2">
                Service Description
              </label>
              <textarea
                id="svc-description"
                rows="4"
                value={editingSvc.description || ''}
                onChange={(e) => setEditingSvc({ ...editingSvc, description: e.target.value })}
                placeholder="Details about motifs, pricing, trails, etc."
                className="w-full rounded-xl border border-[#E7DCCF] bg-[#FAF6F0] p-3.5 text-sm focus:outline-none focus:border-[#B89A5A] text-[#4A3528] font-light leading-relaxed resize-none"
              />
            </div>

            {/* Package Icon Selector */}
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6258] block mb-2">
                Package Icon
              </span>
              <div className="flex flex-wrap gap-2 pt-1" role="group" aria-label="Select package icon">
                {Object.keys(ICONS_MAP).map(key => {
                  const IconComp = ICONS_MAP[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEditingSvc({ ...editingSvc, icon: key })}
                      aria-pressed={editingSvc.icon === key}
                      aria-label={`Select ${key} icon`}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        editingSvc.icon === key
                          ? 'border-[#B89A5A] bg-[#0E3B2E] text-white shadow-sm'
                          : 'border-[#E7DCCF] hover:bg-white text-[#6B6258]'
                      }`}
                    >
                      <IconComp className="w-5 h-5" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Featured Toggle */}
            <div className="flex items-center justify-between bg-white border border-[#E7DCCF] rounded-2xl p-4">
              <div className="flex flex-col text-left">
                <label htmlFor="svc-featured" className="text-xs font-semibold text-[#4A3528] cursor-pointer">
                  Featured Highlight
                </label>
                <span className="text-[10px] text-[#6B6258]/70">Highlight this package with gold accents on the site.</span>
              </div>
              <input
                id="svc-featured"
                type="checkbox"
                checked={editingSvc.isFeatured || false}
                onChange={(e) => {
                  setEditingSvc({ ...editingSvc, isFeatured: e.target.checked });
                }}
                className="w-5 h-5 accent-[#0E3B2E] border-[#E7DCCF] rounded cursor-pointer"
              />
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between border-t border-[#E7DCCF] pt-6 gap-3">
              <button
                type="button"
                onClick={() => {
                  showConfirm(
                    'Delete Package?',
                    'Are you sure you want to delete this package?',
                    async () => {
                      setIsSaving(true);
                      try {
                        await deleteService(editingSvc.id);
                        await loadData();
                        setEditingSvc(null);
                        showNotification('✓ Service package deleted.');
                      } catch (err) {
                        showAlert('Delete Failed', err.message);
                      } finally {
                        setIsSaving(false);
                      }
                    }
                  );
                }}
                className="px-4 py-3 border border-red-200 hover:bg-red-50 text-red-700 text-xs font-semibold rounded-full uppercase tracking-wider flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Delete Package</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSvc(null)}
                  className="px-5 py-3 border border-[#E7DCCF] hover:bg-black/5 text-[#6B6258] text-xs font-semibold rounded-full uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#B89A5A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveServiceDetails}
                  className="px-6 py-3 bg-[#0E3B2E] text-white hover:bg-[#0A3025] text-xs font-semibold rounded-full uppercase tracking-wider shadow-md focus:outline-none focus:ring-2 focus:ring-[#B89A5A] cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM/ALERT MODAL */}
      {confirmModal.isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#FAF6F0]/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={confirmModal.title}
        >
          <div
            ref={confirmModalRef}
            className="bg-[#FAF6F0] w-[90%] max-w-[420px] rounded-[24px] shadow-[0_20px_60px_-15px_rgba(14,59,46,0.15)] border border-[#E7DCCF] flex flex-col items-center p-8 m-4 text-center relative"
          >

            {/* Modal Icon */}
            {!confirmModal.isAlert ? (
              <div className="mb-5 w-16 h-16 rounded-full bg-red-50 flex items-center justify-center border border-red-100" aria-hidden="true">
                <Trash2 className="w-8 h-8 text-red-500 stroke-[1.5]" />
              </div>
            ) : (
              <div className="mb-5 w-16 h-16 rounded-full bg-[#FAF6F0] flex items-center justify-center border border-[#E7DCCF]" aria-hidden="true">
                <MessageSquare className="w-8 h-8 text-[#B89A5A] stroke-[1.5]" />
              </div>
            )}

            <h3 className="text-xl font-semibold text-[#4A3528] mb-2">{confirmModal.title}</h3>
            <p className="text-sm font-light text-[#6B6258] mb-8">{confirmModal.message}</p>

            <div className="flex flex-col w-full gap-3">
              {!confirmModal.isAlert && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirmModal.onConfirm) confirmModal.onConfirm();
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="w-full py-3.5 bg-[#4A3528] hover:bg-[#3A291F] text-white text-xs font-semibold rounded-full uppercase tracking-[0.1em] transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-[#4A3528] cursor-pointer"
                >
                  {confirmModal.confirmText}
                </button>
              )}
              {confirmModal.isAlert && (
                <button
                  type="button"
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="w-full py-3.5 bg-[#0E3B2E] hover:bg-[#0A3025] text-white text-xs font-semibold rounded-full uppercase tracking-[0.1em] transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-[#0E3B2E] cursor-pointer"
                >
                  OK
                </button>
              )}
              {!confirmModal.isAlert && (
                <button
                  type="button"
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="w-full py-3.5 border border-[#E7DCCF] hover:bg-white text-[#4A3528] text-xs font-semibold rounded-full uppercase tracking-[0.1em] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E7DCCF] cursor-pointer"
                >
                  {confirmModal.cancelText}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;
