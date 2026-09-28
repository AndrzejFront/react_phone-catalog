import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import { getProducts } from '../../api/products';
import { Category } from '../../types/Product';
import { Icon } from '../Icon';
import { assetUrl } from '../../utils/assets';
import { SearchField } from '../SearchField';
import styles from './Header.module.scss';

const links = [
  { to: '/', label: 'Home' },
  { to: '/phones', label: 'Phones' },
  { to: '/tablets', label: 'Tablets' },
  { to: '/accessories', label: 'Accessories' },
];

function readTheme() {
  try {
    return localStorage.getItem('nice-gadgets-theme') === 'dark';
  } catch {
    return false;
  }
}

export const Header = () => {
  const { favorites, cartQuantity } = useShop();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [dark, setDark] = useState(readTheme);
  const [detailsCategory, setDetailsCategory] = useState<Category | null>(null);
  const category = pathname.slice(1);
  const showSearch = ['phones', 'tablets', 'accessories', 'favorites'].includes(
    category,
  );

  useEffect(() => {
    setMenuOpen(false);
    setToolsOpen(false);
  }, [pathname]);

  useEffect(() => {
    let active = true;

    setDetailsCategory(null);

    if (pathname.startsWith('/product/')) {
      const productId = pathname.slice('/product/'.length);

      getProducts()
        .then(products => {
          if (active) {
            setDetailsCategory(
              products.find(product => product.itemId === productId)
                ?.category || null,
            );
          }
        })
        .catch(() => {
          // Keep navigation usable while the product page handles load errors.
        });
    }

    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setToolsOpen(false);
      }
    };

    document.addEventListener('keydown', closeOnEscape);

    return () => document.removeEventListener('keydown', closeOnEscape);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';

    try {
      localStorage.setItem('nice-gadgets-theme', dark ? 'dark' : 'light');
    } catch {
      // Theme switching still works without persistent browser storage.
    }
  }, [dark]);

  return (
    <header
      className={`${styles.header} ${menuOpen ? styles.menuOpen : ''}`}
      onMouseLeave={() => setToolsOpen(false)}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setToolsOpen(false);
        }
      }}
    >
      <Link className={styles.logo} to="/" aria-label="Nice Gadgets home">
        <picture>
          <source
            media="(max-width: 1199px)"
            srcSet={assetUrl('img/figma-assets/logo-mobile.svg')}
          />
          <img
            src={assetUrl('img/figma-assets/logo-header.svg')}
            alt="NICE GADGETS"
          />
        </picture>
      </Link>
      <nav
        id="main-navigation"
        className={`${styles.navigation} ${menuOpen ? styles.open : ''}`}
        aria-label="Main navigation"
      >
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            onClick={() => setMenuOpen(false)}
            onMouseEnter={() => setToolsOpen(true)}
            className={({ isActive }) =>
              isActive || link.to === `/${detailsCategory}` ? styles.active : ''
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <button
        className={styles.toolsTrigger}
        type="button"
        aria-label="Open search and appearance"
        aria-expanded={toolsOpen}
        aria-controls="catalog-tools"
        onFocus={() => setToolsOpen(true)}
        onClick={() => setToolsOpen(true)}
      >
        Search and appearance
      </button>
      <div
        id="catalog-tools"
        className={`${styles.tools} ${toolsOpen || menuOpen ? styles.toolsOpen : ''}`}
      >
        {showSearch && <SearchField key={pathname} category={category} />}
        <button
          type="button"
          className={styles.themeButton}
          aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
          onClick={() => setDark(value => !value)}
        >
          <Icon name={dark ? 'sun' : 'moon'} />
          {dark ? 'Light theme' : 'Dark theme'}
        </button>
      </div>
      <div className={styles.actions}>
        <NavLink
          to="/favorites"
          aria-label={`Favorites, ${favorites.length} products`}
          className={({ isActive }) =>
            `${styles.action} ${isActive ? styles.active : ''}`
          }
        >
          <Icon name="heart" />
          {favorites.length > 0 && (
            <span className={styles.badge}>{favorites.length}</span>
          )}
        </NavLink>
        <NavLink
          to="/cart"
          aria-label={`Cart, ${cartQuantity} items`}
          className={({ isActive }) =>
            `${styles.action} ${isActive ? styles.active : ''}`
          }
        >
          <Icon name="cart" />
          {cartQuantity > 0 && (
            <span className={styles.badge}>{cartQuantity}</span>
          )}
        </NavLink>
        <button
          className={`${styles.action} ${styles.menuButton}`}
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          onClick={() => setMenuOpen(value => !value)}
        >
          <Icon name={menuOpen ? 'close' : 'menu'} />
        </button>
      </div>
    </header>
  );
};
