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
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Erro ao buscar categorias:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Fetch Approved Businesses with optional filters
  const fetchBusinesses = useCallback(async () => {
    try {
      setLoadingBusinesses(true);
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

      const res = await fetch(`/api/businesses?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data);
      }
    } catch (err) {
      console.error('Erro ao buscar negócios:', err);
    } finally {
      setLoadingBusinesses(false);
    }
  }, [searchTerm, selectedCategory, selectedSubcategory]);

  // Check pending requests count if admin
  const checkPendingCount = useCallback(async () => {
    const currentToken = token || sessionStorage.getItem('ninho2_admin_token');
    if (role === 'admin' && currentToken) {
      try {
        const res = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${currentToken}` },
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
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBusinesses();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchBusinesses]);

  useEffect(() => {
    checkPendingCount();
  }, [checkPendingCount]);

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
    <div className="min-h-screen flex flex-col bg-[#F8FAF8] selection:bg-[#8DBF91]/40 selection:text-[#1F3325]">
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
          approvedCount={businesses.length}
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
