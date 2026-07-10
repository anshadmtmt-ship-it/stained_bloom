// AdminDashboard.jsx — Stained Blooms Admin Panel
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Feather, Flower, Sparkles, Crown, Image as ImageIcon,
  LogOut, Save, Trash2, Edit, Plus, X, ArrowLeft,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  MessageSquare, Mail, Home, Loader2, Settings as SettingsIcon
} from 'lucide-react';
import { getCMSData, saveCMSData, uploadImage, loginAdmin, logoutAdmin, deleteUploadedImage } from './cmsHelper';

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

    // Auto-focus first element
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
  const logoUrl = settings?.logo || "/images/logo.jpg";
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
  const [isDirty, setIsDirty] = useState(false);
  const skipDirtyRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  // CMS state values
  const [services, setServices] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [categories, setCategories] = useState([]);
  const [contact, setContact] = useState(null);
  const [settings, setSettings] = useState(null);

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

  // Load settings on mount (even if not authenticated, for login branding) & load remaining CMS data if auth is present
  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const loadedSettings = await getCMSData('settings');
        setSettings(loadedSettings || {});
      } catch (e) {
        console.warn("Failed to load settings on mount:", e);
      }
    };
    fetchBranding();

    if (sessionStorage.getItem('sb_admin_logged_in') === 'true') {
      setIsAuthenticated(true);
      loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!skipDirtyRef.current) {
      setIsDirty(true);
    }
  }, [gallery, categories, services, contact, settings]);

  // Block navigation if dirty — only when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, isAuthenticated]);

  const handleTabChange = (newTab) => {
    if (isDirty) {
      showConfirm(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to discard them and switch tabs?',
        () => {
          loadData(); // Re-fetch to discard changes
          setActiveTab(newTab);
        },
        'Discard Changes'
      );
    } else {
      setActiveTab(newTab);
    }
  };

  const loadData = async () => {
    try {
      const [loadedCategories, loadedServices, loadedGallery, loadedContact, loadedSettings] = await Promise.all([
        getCMSData('categories'),
        getCMSData('services'),
        getCMSData('gallery'),
        getCMSData('contact'),
        getCMSData('settings')
      ]);

      skipDirtyRef.current = true;
      const validCategories = loadedCategories || [];
      setCategories(validCategories);

      const firstCat = validCategories.find(c => c.name !== 'All');
      if (firstCat) {
        setSelectedCatName(firstCat.name);
      }

      setServices(loadedServices || []);
      setGallery(loadedGallery || []);
      setContact(loadedContact || {});
      setSettings(loadedSettings || {});

      setTimeout(() => {
        setIsDirty(false);
        skipDirtyRef.current = false;
      }, 100);
    } catch (e) {
      console.error(e);
      showAlert('Error', 'Failed to load CMS data from server.');
    }
  };

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification({ msg: '', type: 'success' }), 3500);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await loginAdmin(username, password);
      setIsAuthenticated(true);
      setLoginError('');
      loadData();
    } catch (err) {
      setLoginError(err.message || 'Invalid username or password.');
    }
  };

  const handleLogout = () => {
    showConfirm(
      'Logout?',
      'Are you sure you want to log out of the admin panel?',
      () => {
        logoutAdmin(); // clears both sb_admin_token and sb_admin_logged_in
        setIsAuthenticated(false);
        setIsDirty(false); // prevent beforeunload after logout
        setUsername('');
        setPassword('');
      },
      'Logout'
    );
  };

  // Image upload helper
  const handleImageSelect = async (e, callback) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showAlert('File Too Large', 'Image must be under 2MB.');
      e.target.value = '';
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showAlert('Invalid File Type', 'Only JPEG, PNG, and WebP images are accepted.');
      e.target.value = '';
      return;
    }
    try {
      const imageUrl = await uploadImage(file);
      callback(imageUrl);
    } catch (err) {
      showAlert('Upload Failed', err.message || 'Failed to upload image. Please try again.');
    }
    e.target.value = '';
  };

  // Save changes triggers
  const handleSaveGallery = async () => {
    setIsSaving(true);
    try {
      await saveCMSData('gallery', gallery);
      await saveCMSData('categories', categories);
      showNotification('✓ Gallery changes saved successfully.');
      setTimeout(() => setIsDirty(false), 50);
    } catch (e) {
      showAlert('Save Failed', e.message || 'Failed to save gallery changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveServices = async () => {
    if (services.some(s => !s.name?.trim())) {
      showAlert('Validation Error', 'All packages must have a name.');
      return;
    }
    setIsSaving(true);
    try {
      await saveCMSData('services', services);
      showNotification('✓ Services and packages saved successfully.');
      setTimeout(() => setIsDirty(false), 50);
    } catch (e) {
      showAlert('Save Failed', e.message || 'Failed to save services. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveContact = async () => {
    if (contact.emailAddress && !/^\S+@\S+\.\S+$/.test(contact.emailAddress)) {
      showAlert('Validation Error', 'Please enter a valid email address.');
      return;
    }
    if (contact.instagramUrl && !contact.instagramUrl.startsWith('http')) {
      showAlert('Validation Error', 'Instagram URL must start with http:// or https://');
      return;
    }
    setIsSaving(true);
    try {
      await saveCMSData('contact', contact);
      showNotification('✓ Contact details saved successfully.');
      setTimeout(() => setIsDirty(false), 50);
    } catch (e) {
      showAlert('Save Failed', e.message || 'Failed to save contact details. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (settings && settings.logoText && !settings.logoText.trim()) {
      showAlert('Validation Error', 'Logo text/brand name cannot be empty.');
      return;
    }
    setIsSaving(true);
    try {
      await saveCMSData('settings', settings);
      showNotification('✓ Branding settings saved successfully.');
      setTimeout(() => setIsDirty(false), 50);
    } catch (e) {
      showAlert('Save Failed', e.message || 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Categories helper actions
  const handleAddCategorySubmit = () => {
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
    const newCat = {
      id: `cat-${Date.now()}`,
      name: cleanName,
      isVisible: true
    };
    setCategories([...categories, newCat]);
    setSelectedCatName(cleanName);
    setNewCatVal('');
    setIsAddingCat(false);
  };

  const saveCategoryRename = (catId) => {
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

    setCategories(categories.map(c => c.id === catId ? { ...c, name: cleanName } : c));
    setGallery(gallery.map(g => g.category === originalCat.name ? { ...g, category: cleanName } : g));

    if (selectedCatName === originalCat.name) {
      setSelectedCatName(cleanName);
    }
    setRenamingCatId(null);
  };

  const deleteCategoryCustom = (catId, catName) => {
    showConfirm(
      'Delete Category?',
      `Are you sure you want to delete category "${catName}"? All images inside it will also be deleted.`,
      () => {
        // Attempt to clean up uploaded files for images in this category
        gallery
          .filter(g => g.category === catName && g.image?.startsWith('/images/uploads/'))
          .forEach(g => deleteUploadedImage(g.image));

        setCategories(categories.filter(c => c.id !== catId));
        setGallery(gallery.filter(g => g.category !== catName));

        const remainingCats = categories.filter(c => c.id !== catId && c.name !== 'All');
        setSelectedCatName(remainingCats.length > 0 ? remainingCats[0].name : '');
      }
    );
  };

  const moveCategoryInline = (editableIndex, direction) => {
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
    setCategories(newCats);
  };

  // Gallery items helpers
  const handleAddImage = (imageUrl) => {
    const currentImages = gallery.filter(g => g.category === selectedCatName);
    if (currentImages.length >= 8) {
      showAlert('Limit Reached', 'Maximum of 8 images per category.');
      return;
    }

    const newItem = {
      id: Date.now(),
      category: selectedCatName,
      title: '',
      description: '',
      image: imageUrl
    };
    setGallery([...gallery, newItem]);
  };

  const handleDeleteImage = (item) => {
    showConfirm(
      'Delete Image?',
      'Are you sure you want to delete this gallery image?',
      () => {
        // Attempt cleanup of uploaded file
        deleteUploadedImage(item.image);
        setGallery(gallery.filter(g => g.id !== item.id));
      }
    );
  };

  // Services/Packages helpers
  const handleAddService = () => {
    const newSvc = {
      id: `svc-${Date.now()}`,
      name: 'New Package',
      price: '',
      icon: 'Sparkles',
      description: 'ELEGANT DESIGN',
      details: 'Intricate custom henna design.',
      isFeatured: false
    };
    setServices([...services, newSvc]);
    setEditingSvc(newSvc); // Open popup immediately for new package
  };

  const handleDeleteService = (svcId) => {
    showConfirm(
      'Delete Package?',
      'Are you sure you want to delete this package?',
      () => setServices(services.filter(s => s.id !== svcId))
    );
  };

  const moveServiceInline = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === services.length - 1) return;

    const newSvcs = [...services];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    [newSvcs[index], newSvcs[targetIdx]] = [newSvcs[targetIdx], newSvcs[index]];
    setServices(newSvcs);
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
                Username
              </label>
              <input
                id="admin-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-[18px] border border-[#E7DCCF] bg-[#FAF6F0] p-3.5 text-sm focus:outline-none focus:border-[#B89A5A] text-[#4A3528]"
                placeholder="admin"
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
                required
                autoComplete="current-password"
              />
            </div>

            {loginError && (
              <p className="text-xs text-red-700 mt-2 font-light" role="alert">✕ {loginError}</p>
            )}

            <button
              type="submit"
              className="w-full btn-primary py-4 rounded-full mt-4 font-semibold text-xs tracking-wider"
            >
              Log In to Portal
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Safety check for loading values
  if (!contact || !categories || !settings) {
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

  /* ─── RENDER: Main Admin Panel ────────────────────────────────────────────── */
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
          className={`fixed bottom-20 md:bottom-10 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-6 ${
            notification.type === 'error' ? 'bg-red-700' : 'bg-[#0E3B2E]'
          } border border-[#B89A5A]/30 text-[#FAF6F0] px-5 py-3.5 rounded-[18px] shadow-luxury z-50 flex items-center gap-3 text-xs tracking-wide animate-zoom-in whitespace-nowrap`}
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
                  onClick={() => handleTabChange(tab.id)}
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
            {activeTab === 'services' ? 'Services & Packages' : activeTab === 'gallery' ? 'Gallery Manager' : 'Contact Information'}
          </h1>
          {isDirty && (
            <span className="text-[10px] text-[#B89A5A] uppercase tracking-wider font-semibold animate-pulse" aria-live="polite">
              ● Unsaved changes
            </span>
          )}
        </header>

        {/* Mobile page title */}
        <div className="md:hidden px-5 py-4 flex items-center justify-between">
          <h1 className="text-serif text-xl font-light text-[#4A3528] capitalize">
            {activeTab === 'services' ? 'Services & Packages' : activeTab === 'gallery' ? 'Gallery' : 'Contact'}
          </h1>
          {isDirty && (
            <span className="text-[10px] text-[#B89A5A] uppercase tracking-wider font-semibold" aria-live="polite">● Unsaved</span>
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
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#B89A5A]">
                    Images in {selectedCatName ? `"${selectedCatName}"` : 'selected category'}
                  </span>
                  <span className="text-xs text-[#6B6258]/60 font-light">Max 8 images per category</span>
                </div>

                {selectedCatName ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                    {currentImages.length === 0 && (
                      <div className="col-span-2 sm:col-span-3 md:col-span-4 py-12 border-2 border-dashed border-[#E7DCCF] rounded-2xl bg-white text-center text-xs text-[#6B6258]/60 font-light">
                        No images yet. Upload your first image below.
                      </div>
                    )}

                    {currentImages.map((item) => (
                      <div
                        key={item.id}
                        className="group relative bg-white border border-[#E7DCCF] rounded-2xl overflow-hidden shadow-sm hover:shadow-luxury-hover transition-all h-[210px] flex flex-col"
                      >
                        {/* Image Preview */}
                        <div className="w-full h-[155px] relative overflow-hidden bg-white border-b border-[#E7DCCF]/60 flex items-center justify-center">
                          <img
                            src={item.image}
                            alt={item.title || 'Gallery image'}
                            className="w-full h-full object-cover"
                          />
                          {/* Hover action overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingImage(item)}
                              className="p-2 bg-white text-[#0E3B2E] rounded-full hover:scale-105 transition-all shadow-md font-semibold text-xs flex items-center gap-1"
                              aria-label={`Edit image: ${item.title || 'Untitled'}`}
                            >
                              <Edit className="w-4 h-4 text-[#B89A5A]" aria-hidden="true" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(item)}
                              className="p-2 bg-red-600 text-white rounded-full hover:scale-105 transition-all shadow-md"
                              aria-label={`Delete image: ${item.title || 'Untitled'}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Card Info footer */}
                        <div className="p-3.5 flex items-center justify-between mt-auto bg-white">
                          <span className="text-xs font-semibold truncate text-[#4A3528] max-w-[70%] text-left">
                            {item.title || 'Untitled Image'}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingImage(item)}
                              className="p-1 text-[#6B6258] hover:text-[#0E3B2E] rounded"
                              aria-label={`Edit ${item.title || 'image'}`}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(item)}
                              className="p-1 text-red-600 hover:text-red-800 rounded"
                              aria-label={`Delete ${item.title || 'image'}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* + Add Image Card */}
                    {currentImages.length < 8 && (
                      <div className="border-2 border-dashed border-[#E7DCCF] hover:border-[#B89A5A] rounded-2xl flex flex-col items-center justify-center h-[210px] bg-white hover:bg-[#FAF6F0]/50 transition-all cursor-pointer relative">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
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

              {/* SAVE GALLERY BUTTON */}
              <div className="flex justify-end pt-8 border-t border-[#E7DCCF]">
                <button
                  onClick={handleSaveGallery}
                  disabled={isSaving}
                  className="btn-primary gap-2 px-10 py-4 flex items-center shadow-md w-full sm:w-auto text-xs font-semibold tracking-widest uppercase disabled:opacity-70"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-[#B89A5A]" aria-hidden="true" /> : <Save className="w-4 h-4 text-[#B89A5A]" aria-hidden="true" />}
                  <span>{isSaving ? 'Saving…' : 'Save Changes'}</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB: SERVICES / PACKAGES */}
          {activeTab === 'services' && (
            <div className="space-y-8 text-left">
              <div className="flex items-center justify-between border-b border-[#E7DCCF]/60 pb-3">
                <span className="text-xs text-[#6B6258]/60 font-light">
                  Click any package to edit details, manage price, or set features.
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

                      {/* Name and Price */}
                      <div className="text-left mb-2">
                        <h4 className="text-serif text-xl font-light text-[#4A3528] group-hover:text-[#0E3B2E] transition-colors truncate">
                          {svc.name}
                        </h4>
                        <span className="text-xs font-semibold text-[#B89A5A]">
                          {svc.price || 'No Price Set'}
                        </span>
                      </div>

                      {/* Short Description */}
                      <p className="text-xs font-light text-[#6B6258] text-left line-clamp-2 leading-relaxed flex-grow">
                        {svc.details || 'No description details provided.'}
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

              {/* SAVE SERVICES BUTTON */}
              <div className="flex justify-end pt-8 border-t border-[#E7DCCF]">
                <button
                  onClick={handleSaveServices}
                  disabled={isSaving}
                  className="btn-primary gap-2 px-10 py-4 flex items-center shadow-md w-full sm:w-auto text-xs font-semibold tracking-widest uppercase disabled:opacity-70"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-[#B89A5A]" aria-hidden="true" /> : <Save className="w-4 h-4 text-[#B89A5A]" aria-hidden="true" />}
                  <span>{isSaving ? 'Saving…' : 'Save Changes'}</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB: CONTACT INFORMATION */}
          {activeTab === 'contact' && (
            <div className="space-y-6">

              <div className="max-w-xl mx-auto space-y-6 text-left">
                <div className="bg-white border border-[#E7DCCF] rounded-3xl p-8 space-y-6 shadow-sm">
                  {/* Business Name */}
                  <div>
                    <label htmlFor="contact-business-name" className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6258] block mb-2">
                      Business Name
                    </label>
                    <input
                      id="contact-business-name"
                      type="text"
                      value={contact.businessName || ''}
                      onChange={(e) => setContact({ ...contact, businessName: e.target.value })}
                      className="w-full rounded-xl border border-[#E7DCCF] bg-[#FAF6F0] p-3.5 text-sm focus:outline-none focus:border-[#B89A5A] text-[#4A3528]"
                      placeholder="Stained Blooms"
                    />
                  </div>

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
                      className="w-full rounded-xl border border-[#E7DCCF] bg-[#FAF6F0] p-3.5 text-sm focus:outline-none focus:border-[#B89A5A] text-[#4A3528]"
                      placeholder="inquiry@stainedblooms.com"
                    />
                  </div>

                  {/* Business Address */}
                  <div>
                    <label htmlFor="contact-address" className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6258] block mb-2">
                      Business Address / Location
                    </label>
                    <input
                      id="contact-address"
                      type="text"
                      value={contact.businessAddress || ''}
                      onChange={(e) => setContact({ ...contact, businessAddress: e.target.value })}
                      className="w-full rounded-xl border border-[#E7DCCF] bg-[#FAF6F0] p-3.5 text-sm focus:outline-none focus:border-[#B89A5A] text-[#4A3528]"
                      placeholder="Kerala, India"
                    />
                  </div>

                  {/* Business Hours */}
                  <div>
                    <label htmlFor="contact-hours" className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6258] block mb-2">
                      Business Hours
                    </label>
                    <input
                      id="contact-hours"
                      type="text"
                      value={contact.businessHours || ''}
                      onChange={(e) => setContact({ ...contact, businessHours: e.target.value })}
                      className="w-full rounded-xl border border-[#E7DCCF] bg-[#FAF6F0] p-3.5 text-sm focus:outline-none focus:border-[#B89A5A] text-[#4A3528]"
                      placeholder="10:00 AM - 07:00 PM (By Appointment Only)"
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
                      className="w-full rounded-xl border border-[#E7DCCF] bg-[#FAF6F0] p-3.5 text-sm focus:outline-none focus:border-[#B89A5A] text-[#4A3528]"
                      placeholder="DM on Instagram"
                    />
                    <p className="text-[10px] text-[#6B6258]/60 mt-1 font-light">Shown on the contact section CTA banner.</p>
                  </div>
                </div>

                {/* SAVE CONTACT BUTTON */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveContact}
                    disabled={isSaving}
                    className="btn-primary gap-2 px-10 py-4 flex items-center shadow-md w-full sm:w-auto text-xs font-semibold tracking-widest uppercase disabled:opacity-70"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-[#B89A5A]" aria-hidden="true" /> : <Save className="w-4 h-4 text-[#B89A5A]" aria-hidden="true" />}
                    <span>{isSaving ? 'Saving…' : 'Save Changes'}</span>
                  </button>
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
              onClick={() => handleTabChange(tab.id)}
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
                className="p-1 rounded-full hover:bg-black/5 text-[#6B6258] focus:outline-none focus:ring-2 focus:ring-[#B89A5A]"
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
                  accept="image/jpeg,image/png,image/webp"
                  id="modal-change-image"
                  className="hidden"
                  onChange={(e) => handleImageSelect(e, (url) => setEditingImage({ ...editingImage, image: url }))}
                  aria-label="Replace image file"
                />
                <label
                  htmlFor="modal-change-image"
                  className="btn-outline px-4 py-2 cursor-pointer text-[10px] tracking-widest font-bold inline-block text-center uppercase"
                >
                  Change Image
                </label>
                <p className="text-[9px] text-[#6B6258]/60 font-light">Max size 2MB (JPEG, PNG, WEBP)</p>
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
                    () => {
                      deleteUploadedImage(editingImage.image);
                      setGallery(gallery.filter(g => g.id !== editingImage.id));
                      setEditingImage(null);
                    }
                  );
                }}
                className="px-4 py-3 border border-red-200 hover:bg-red-50 text-red-700 text-xs font-semibold rounded-full uppercase tracking-wider flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Delete Image</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingImage(null)}
                  className="px-5 py-3 border border-[#E7DCCF] hover:bg-black/5 text-[#6B6258] text-xs font-semibold rounded-full uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#B89A5A]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGallery(gallery.map(g => g.id === editingImage.id ? editingImage : g));
                    setEditingImage(null);
                  }}
                  className="px-6 py-3 bg-[#0E3B2E] text-white hover:bg-[#0A3025] text-xs font-semibold rounded-full uppercase tracking-wider shadow-md focus:outline-none focus:ring-2 focus:ring-[#B89A5A]"
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
                className="p-1 rounded-full hover:bg-black/5 text-[#6B6258] focus:outline-none focus:ring-2 focus:ring-[#B89A5A]"
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

            {/* Price */}
            <div>
              <label htmlFor="svc-price" className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6258] block mb-2">
                Price
              </label>
              <input
                id="svc-price"
                type="text"
                value={editingSvc.price || ''}
                onChange={(e) => setEditingSvc({ ...editingSvc, price: e.target.value })}
                placeholder="e.g. ₹1,500 or Custom pricing"
                className="w-full rounded-xl border border-[#E7DCCF] bg-[#FAF6F0] p-3.5 text-sm focus:outline-none focus:border-[#B89A5A] text-[#4A3528]"
              />
            </div>

            {/* Short Description */}
            <div>
              <label htmlFor="svc-description" className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6258] block mb-2">
                Short Description
              </label>
              <input
                id="svc-description"
                type="text"
                value={editingSvc.description || ''}
                onChange={(e) => setEditingSvc({ ...editingSvc, description: e.target.value })}
                placeholder="e.g. ELEGANT & MINIMAL"
                className="w-full rounded-xl border border-[#E7DCCF] bg-[#FAF6F0] p-3.5 text-sm focus:outline-none focus:border-[#B89A5A] text-[#4A3528] uppercase tracking-widest"
              />
            </div>

            {/* Details */}
            <div>
              <label htmlFor="svc-details" className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6258] block mb-2">
                Full Details
              </label>
              <textarea
                id="svc-details"
                rows="3"
                value={editingSvc.details}
                onChange={(e) => setEditingSvc({ ...editingSvc, details: e.target.value })}
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
                      className={`p-2.5 rounded-xl border transition-all ${
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
                    () => {
                      setServices(services.filter(s => s.id !== editingSvc.id));
                      setEditingSvc(null);
                    }
                  );
                }}
                className="px-4 py-3 border border-red-200 hover:bg-red-50 text-red-700 text-xs font-semibold rounded-full uppercase tracking-wider flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Delete Package</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSvc(null)}
                  className="px-5 py-3 border border-[#E7DCCF] hover:bg-black/5 text-[#6B6258] text-xs font-semibold rounded-full uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#B89A5A]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!editingSvc.name?.trim()) {
                      showAlert('Validation Error', 'Package name cannot be empty.');
                      return;
                    }
                    let updatedServices = services.map(s => {
                      if (s.id === editingSvc.id) {
                        return editingSvc;
                      }
                      return editingSvc.isFeatured ? { ...s, isFeatured: false } : s;
                    });
                    setServices(updatedServices);
                    setEditingSvc(null);
                  }}
                  className="px-6 py-3 bg-[#0E3B2E] text-white hover:bg-[#0A3025] text-xs font-semibold rounded-full uppercase tracking-wider shadow-md focus:outline-none focus:ring-2 focus:ring-[#B89A5A]"
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
                  className="w-full py-3.5 bg-[#4A3528] hover:bg-[#3A291F] text-white text-xs font-semibold rounded-full uppercase tracking-[0.1em] transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-[#4A3528]"
                >
                  {confirmModal.confirmText}
                </button>
              )}
              {confirmModal.isAlert && (
                <button
                  type="button"
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="w-full py-3.5 bg-[#0E3B2E] hover:bg-[#0A3025] text-white text-xs font-semibold rounded-full uppercase tracking-[0.1em] transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-[#0E3B2E]"
                >
                  OK
                </button>
              )}
              {!confirmModal.isAlert && (
                <button
                  type="button"
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="w-full py-3.5 border border-[#E7DCCF] hover:bg-white text-[#4A3528] text-xs font-semibold rounded-full uppercase tracking-[0.1em] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E7DCCF]"
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
