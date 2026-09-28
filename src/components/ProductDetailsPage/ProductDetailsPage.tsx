import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getCategoryDetails,
  getProductDetails,
  getProducts,
  getSuggestedProducts,
} from '../../api/products';
import { useShop } from '../../context/ShopContext';
import { Product, ProductDetails } from '../../types/Product';
import { assetUrl, categoryNames } from '../../utils/assets';
import { BackButton } from '../BackButton';
import { Breadcrumbs } from '../Breadcrumbs';
import { Icon } from '../Icon';
import { Loader } from '../Loader';
import { ProductsSlider } from '../ProductsSlider';
import styles from './ProductDetailsPage.module.scss';

const colorValues: Record<string, string> = {
  black: '#202020',
  blue: '#3573a6',
  coral: '#f47e69',
  gold: '#e8d2b4',
  graphite: '#5b5b59',
  green: '#9fc8b3',
  midnight: '#252e37',
  midnightgreen: '#52635d',
  pink: '#f5d0d7',
  purple: '#c6bfdc',
  red: '#cc2638',
  rosegold: '#e6c2bd',
  sierrablue: '#a7bed1',
  silver: '#e2e3e5',
  skyblue: '#adc9d7',
  spaceblack: '#343435',
  spacegray: '#67686d',
  starlight: '#f2e9dc',
  white: '#f6f4ef',
  yellow: '#f4dc77',
};

const normalizeColor = (color: string) =>
  color.toLowerCase().replace(/[\s-]/g, '');

export const ProductDetailsPage = () => {
  const { productId = '' } = useParams();
  const navigate = useNavigate();
  const { cart, favorites, addToCart, toggleFavorite } = useShop();
  const [details, setDetails] = useState<ProductDetails | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductDetails[]>([]);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [unavailableImages, setUnavailableImages] = useState<string[]>([]);
  const [loadedId, setLoadedId] = useState('');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    setStatus('loading');
    setSelectedImage(0);
    setUnavailableImages([]);

    const load = async () => {
      try {
        const [newDetails, products, suggested] = await Promise.all([
          getProductDetails(productId),
          getProducts(),
          getSuggestedProducts(productId),
        ]);
        const categoryDetails = newDetails
          ? await getCategoryDetails(newDetails.category)
          : [];

        if (!active) {
          return;
        }

        setDetails(newDetails);
        setProduct(products.find(item => item.itemId === productId) || null);
        setVariants(categoryDetails);
        setSuggestions(suggested);
        setLoadedId(productId);
        setStatus('success');
      } catch {
        if (active) {
          setLoadedId(productId);
          setStatus('error');
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [productId, attempt]);

  if (status === 'loading' || loadedId !== productId) {
    return <Loader />;
  }

  if (status === 'error') {
    return (
      <div className="container">
        <BackButton />
        <div className="empty-state" role="alert">
          <h1 className="page-title">Something went wrong</h1>
          <p>We could not load this product. Please try again.</p>
          <button
            className="primary-button"
            type="button"
            onClick={() => setAttempt(value => value + 1)}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  if (!details || !product) {
    return (
      <div className="container">
        <Breadcrumbs items={[{ label: 'Product was not found' }]} />
        <BackButton />
        <div className="empty-state">
          <img src={assetUrl('img/product-not-found.png')} alt="" />
          <h1 className="page-title">Product was not found</h1>
          <Link className="primary-button" to="/">
            Go to home page
          </Link>
        </div>
      </div>
    );
  }

  const isInCart = cart.some(item => item.id === product.itemId);
  const isFavorite = favorites.some(item => item.itemId === product.itemId);
  const availableImages = details.images.filter(
    image => !unavailableImages.includes(image),
  );
  const images = availableImages.length ? availableImages : [product.image];
  const imageIndex = Math.min(selectedImage, images.length - 1);
  const markImageUnavailable = (image: string) => {
    setUnavailableImages(current =>
      current.includes(image) ? current : [...current, image],
    );
  };
  const family = variants.filter(
    variant => variant.namespaceId === details.namespaceId,
  );
  const findVariant = (capacity: string, color: string) =>
    family.find(
      variant =>
        variant.capacity === capacity &&
        normalizeColor(variant.color) === normalizeColor(color),
    );
  const selectVariant = (capacity: string, color: string) => {
    const variant = findVariant(capacity, color);

    if (variant && variant.id !== productId) {
      navigate(`/product/${variant.id}`);
    }
  };
  const summarySpecs = [
    ['Screen', details.screen],
    ['Resolution', details.resolution],
    ['Processor', details.processor],
    ['RAM', details.ram],
  ];
  const fullSpecs = [
    ...summarySpecs,
    ['Built in memory', details.capacity],
    ...(details.camera ? [['Camera', details.camera]] : []),
    ...(details.zoom ? [['Zoom', details.zoom]] : []),
    ['Cell', details.cell.join(', ')],
  ];

  return (
    <div className={`container ${styles.page}`}>
      <Breadcrumbs
        items={[
          {
            label: categoryNames[details.category],
            to: `/${details.category}`,
          },
          { label: details.name },
        ]}
      />
      <BackButton />
      <h1 className={styles.title}>{details.name}</h1>

      <div className={styles.product}>
        <div className={styles.gallery}>
          <div className={styles.thumbnails} aria-label="Product pictures">
            {images.map((image, index) => (
              <button
                key={image}
                type="button"
                className={`${styles.thumbnail} ${
                  imageIndex === index ? styles.selectedThumbnail : ''
                }`}
                aria-label={`View picture ${index + 1} of ${details.name}`}
                aria-pressed={imageIndex === index}
                onClick={() => setSelectedImage(index)}
              >
                <img
                  src={assetUrl(image)}
                  alt=""
                  onError={() => markImageUnavailable(image)}
                />
              </button>
            ))}
          </div>
          <div className={styles.mainImage}>
            <img
              src={assetUrl(images[imageIndex])}
              alt={`${details.name}, view ${imageIndex + 1}`}
              onError={() => markImageUnavailable(images[imageIndex])}
            />
          </div>
        </div>

        <div className={styles.options}>
          <p className={styles.productId}>ID: {product.id}</p>
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Available colors</legend>
            <div className={styles.colors}>
              {details.colorsAvailable.map(color => (
                <label className={styles.colorOption} key={color}>
                  <input
                    className="visually-hidden"
                    type="radio"
                    name="product-color"
                    value={color}
                    checked={
                      normalizeColor(details.color) === normalizeColor(color)
                    }
                    disabled={!findVariant(details.capacity, color)}
                    onChange={() => selectVariant(details.capacity, color)}
                  />
                  <span
                    className={styles.colorSwatch}
                    style={{
                      backgroundColor:
                        colorValues[normalizeColor(color)] || color,
                    }}
                    title={color}
                  />
                  <span className="visually-hidden">{color}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Select capacity</legend>
            <div className={styles.capacities}>
              {details.capacityAvailable.map(capacity => (
                <label className={styles.capacityOption} key={capacity}>
                  <input
                    className="visually-hidden"
                    type="radio"
                    name="product-capacity"
                    value={capacity}
                    checked={details.capacity === capacity}
                    disabled={!findVariant(capacity, details.color)}
                    onChange={() => selectVariant(capacity, details.color)}
                  />
                  <span>{capacity}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className={styles.prices}>
            <strong>${product.price}</strong>
            {product.fullPrice > product.price && (
              <del>${product.fullPrice}</del>
            )}
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={`primary-button ${isInCart ? styles.added : ''}`}
              aria-pressed={isInCart}
              onClick={() => {
                if (!isInCart) {
                  addToCart(product);
                }
              }}
            >
              {isInCart ? 'Added to cart' : 'Add to cart'}
            </button>
            <button
              type="button"
              className={`icon-button ${styles.favorite} ${
                isFavorite ? styles.favoriteActive : ''
              }`}
              aria-label={
                isFavorite ? 'Remove from favorites' : 'Add to favorites'
              }
              aria-pressed={isFavorite}
              onClick={() => toggleFavorite(product)}
            >
              <Icon name="heart" filled={isFavorite} />
            </button>
          </div>
          <dl className={styles.specList}>
            {summarySpecs.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className={styles.information}>
        <section aria-labelledby="product-about">
          <h2 className={styles.sectionTitle} id="product-about">
            About
          </h2>
          {details.description.map(section => (
            <div className={styles.description} key={section.title}>
              <h3>{section.title}</h3>
              {section.text.map(paragraph => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ))}
        </section>
        <section aria-labelledby="product-specs">
          <h2 className={styles.sectionTitle} id="product-specs">
            Tech specs
          </h2>
          <dl className={`${styles.specList} ${styles.fullSpecs}`}>
            {fullSpecs.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {suggestions.length > 0 && (
        <ProductsSlider title="You may also like" products={suggestions} />
      )}
    </div>
  );
};
