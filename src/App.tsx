import './App.scss';
import { useEffect } from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ShopProvider } from './context/ShopContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage';
import { CatalogPage } from './components/CatalogPage';
import { ProductDetailsPage } from './components/ProductDetailsPage';
import { CartPage } from './components/CartPage';
import { FavoritesPage } from './components/FavoritesPage';
import { NotFoundPage } from './components/NotFoundPage';

const PageContent = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={event => {
          event.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        Skip to content
      </a>
      <Header />
      <main id="main-content" className="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/phones" element={<CatalogPage category="phones" />} />
          <Route path="/tablets" element={<CatalogPage category="tablets" />} />
          <Route
            path="/accessories"
            element={<CatalogPage category="accessories" />}
          />
          <Route path="/product/:productId" element={<ProductDetailsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
};

export const App = () => (
  <HashRouter>
    <ShopProvider>
      <PageContent />
    </ShopProvider>
  </HashRouter>
);
