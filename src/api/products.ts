import { Category, Product, ProductDetails } from '../types/Product';
import { assetUrl } from '../utils/assets';

const requests = new Map<string, Promise<unknown>>();

function getData<T>(file: string): Promise<T> {
  if (!requests.has(file)) {
    const request = fetch(assetUrl(`api/${file}.json`))
      .then(response => {
        if (!response.ok) {
          throw new Error('Unable to load products');
        }

        return response.json();
      })
      .catch(error => {
        requests.delete(file);
        throw error;
      });

    requests.set(file, request);
  }

  return requests.get(file) as Promise<T>;
}

export const getProducts = () => getData<Product[]>('products');

export async function getCategoryDetails(category: Category) {
  const [details, products] = await Promise.all([
    getData<ProductDetails[]>(category),
    getProducts(),
  ]);

  return details.map(detail => {
    const product = products.find(
      item =>
        item.category === category &&
        (item.itemId === detail.id || item.name === detail.name),
    );

    return product
      ? {
          ...detail,
          id: product.itemId,
          priceRegular: product.fullPrice,
          priceDiscount: product.price,
        }
      : detail;
  });
}

export async function getProductDetails(productId: string) {
  const products = await getProducts();
  const product = products.find(item => item.itemId === productId);

  if (!product) {
    return null;
  }

  const variants = await getCategoryDetails(product.category);

  return variants.find(item => item.id === productId) || null;
}

export async function getSuggestedProducts(productId: string) {
  const products = await getProducts();
  const candidates = products.filter(product => product.itemId !== productId);

  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    [candidates[index], candidates[randomIndex]] = [
      candidates[randomIndex],
      candidates[index],
    ];
  }

  return candidates.slice(0, 12);
}
