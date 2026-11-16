import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { Category, Business } from './types/index.ts';
import { Header } from './components/Header.tsx';
import { Hero } from './components/Hero.tsx';
import { SearchBar } from './components/SearchBar.tsx';
import { CategoryFilter } from './components/CategoryFilter.tsx';
import { BusinessList } from './components/BusinessList.tsx';
import { RegisterModal } from './components/RegisterModal.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { FaqSection } from './components/FaqSection.tsx';
import { ContactSection } from './components/ContactSection.tsx';
import { Footer } from './components/Footer.tsx';

function MainContent() {
  const { user, role, token, loginWithGoogle } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [totalApprovedCount, setTotalApprovedCount] = useState<number>(0);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  // Modals
  const [registerOpen, setRegisterOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch Categories
  const fetchCategories = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoadingCategories(true);
      const res = await fetch('/api/categories', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Erro ao buscar categorias:', err);
    } finally {
      if (!silent) setLoadingCategories(false);
    }
  }, []);

  // Fetch Approved Businesses with optional filters
  const fetchBusinesses = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoadingBusinesses(true);
      const params = new URLSearchParams();
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      if (selectedSubcategory) {
        params.append('subcategory', selectedSubcategory);
      }

      const res = await fetch(`/api/businesses?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data);
        if (!searchTerm.trim() && !selectedCategory && !selectedSubcategory) {
          setTotalApprovedCount(data.length);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar negócios:', err);
    } finally {
      if (!silent) setLoadingBusinesses(false);
    }
  }, [searchTerm, selectedCategory, selectedSubcategory]);

  // Check pending requests count if admin
  const checkPendingCount = useCallback(async () => {
    const currentToken = token || sessionStorage.getItem('ninho2_admin_token');
    if (role === 'admin' && currentToken) {
      try {
        const res = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${currentToken}` },
          cache: 'no-store',
        });
        if (res.ok) {
          const stats = await res.json();
          setPendingCount(stats.pending || 0);
        }
      } catch (e) {
        // Silent catch
      }
    }
  }, [role, token]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBusinesses();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchBusinesses]);

  useEffect(() => {
    checkPendingCount();
  }, [checkPendingCount]);

  // Real-time multi-device sync via SSE + visibility/focus refresh + fallback polling
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'businesses' || payload.type === 'all') {
            fetchBusinesses(true);
            checkPendingCount();
          }
          if (payload.type === 'categories' || payload.type === 'all') {
            fetchCategories(true);
          }
        } catch {
          // Ignore malformed event
        }
      };
    } catch {
      // Fallback to focus/polling if EventSource is unavailable
    }

    const syncNow = () => {
      if (document.visibilityState === 'visible') {
        fetchBusinesses(true);
        fetchCategories(true);
        checkPendingCount();
      }
    };

    window.addEventListener('focus', syncNow);
    document.addEventListener('visibilitychange', syncNow);
    const pollInterval = window.setInterval(syncNow, 30000);

    return () => {
      eventSource?.close();
      window.removeEventListener('focus', syncNow);
      document.removeEventListener('visibilitychange', syncNow);
      window.clearInterval(pollInterval);
    };
  }, [fetchBusinesses, fetchCategories, checkPendingCount]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setSearchTerm(suggestion);
    const element = document.getElementById('catalog');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenAdmin = () => {
    setAdminOpen(true);
  };

  const selectedCategoryObj = categories.find((c) => c.slug === selectedCategory);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF8] selection:bg-[#8DBF91]/40 selection:text-[#1F3325] overflow-x-hidden">
      {/* Top Header */}
      <Header
        onOpenRegister={() => setRegisterOpen(true)}
        onOpenAdmin={handleOpenAdmin}
        onScrollTo={handleScrollTo}
        pendingCount={pendingCount}
      />

      {/* Hero Section */}
      <main className="flex-1">
        <Hero
          onExplore={() => handleScrollTo('catalog')}
          onRegister={() => setRegisterOpen(true)}
          approvedCount={totalApprovedCount || businesses.length}
        />

        {/* Real-Time Search Bar */}
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSelectSuggestion={handleSelectSuggestion}
          totalResults={businesses.length}
        />

        {/* Categories Grid Filter */}
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          selectedSubcategory={selectedSubcategory}
          onSelectCategory={(slug) => {
            setSelectedCategory(slug);
            setSelectedSubcategory(null);
          }}
          onSelectSubcategory={(sub) => {
            setSelectedSubcategory(sub);
            handleScrollTo('catalog');
          }}
          loading={loadingCategories}
        />

        {/* Business Catalog Grid */}
        <BusinessList
          businesses={businesses}
          loading={loadingBusinesses}
          searchTerm={searchTerm}
          selectedCategoryName={selectedCategoryObj?.name}
          selectedSubcategory={selectedSubcategory}
          onClearFilters={handleClearFilters}
          onOpenRegister={() => setRegisterOpen(true)}
        />

        {/* FAQ Section */}
        <FaqSection />

        {/* Contact Form Section */}
        <ContactSection />
      </main>

      {/* Footer */}
      <Footer
        onScrollToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onOpenRegister={() => setRegisterOpen(true)}
        onOpenAdmin={handleOpenAdmin}
      />

      {/* Business Registration Modal */}
      <RegisterModal
        isOpen={registerOpen}
        onClose={() => setRegisterOpen(false)}
        categories={categories}
        onSuccess={() => {
          checkPendingCount();
        }}
      />

      {/* Administration Panel */}
      <AdminPanel
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
        onDataChanged={() => {
          fetchBusinesses();
          fetchCategories();
          checkPendingCount();
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
