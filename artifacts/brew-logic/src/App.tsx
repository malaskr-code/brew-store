import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/screens/not-found';
import { Link, useLocation } from '@/lib/navigation';
import { ArrowDown, ArrowLeft, ArrowRight, Check, ChevronDown, Heart, Menu, Moon, Plus, Search, ShoppingBag, Sun, X } from 'lucide-react';
import xbloomPhoto from '@assets/image_1791649384537.png';
import aidenPhoto from '@assets/image_1791649481086.png';
import moccamasterPhoto from '@assets/image_1791649574028.png';
import eurekaPhoto from '@assets/image_1791649604656.png';
import staggPhoto from '@assets/image_1791649655738.png';
import harioPhoto from '@assets/image_1791649703321.png';
import beanBagPhoto from '@assets/image_1791649759965.png';
import { currencies, CurrencyProvider, useCurrency, type Currency } from '@/lib/currency';
import type { Product, Bundle, CatalogItem } from '@workspace/brew-catalog';
import { ChatWidget } from '@/components/chat-widget';
import { CatalogProvider, useCatalog } from '@/lib/catalog';
import { AdminAuthProvider, SignInPage, SignUpPage } from '@/lib/admin-auth';
import { CustomerAuthProvider, CustomerLoginPage, CustomerSignupPage, CustomerAccountButton } from '@/lib/customer-auth';
import AdminPage from '@/screens/admin';
import { useCheckout, type CheckoutState } from '@/lib/checkout';

type Language = 'en' | 'ar';
type CartItem = { id: string; name: string; price: number; image: string; quantity: number; isBundle?: boolean };

const queryClient = new QueryClient();

type SearchEntry = { item: CatalogItem; imageKey: string; category: string; searchTerms: string };

const productPhotos: Record<string, string> = {
  'xbloom-photo': xbloomPhoto.src,
  'aiden-photo': aidenPhoto.src,
  'moccamaster-photo': moccamasterPhoto.src,
  'eureka-photo': eurekaPhoto.src,
  'stagg-photo': staggPhoto.src,
  'hario-photo': harioPhoto.src,
  'bean-bag-photo': beanBagPhoto.src,
};

function productPhoto(image: string) {
  return productPhotos[image] ?? (image.startsWith('https://') ? image : undefined);
}

function bagSizeLabel(size: string | undefined, language: Language) {
  const value = size || '250g';
  const grams = /^(\d+(?:\.\d+)?)g$/.exec(value);
  return language === 'ar' && grams ? `${Number(grams[1]).toLocaleString('ar-KW')} غرام` : value;
}

const copy = {
  en: {
    announcement: 'Free delivery on orders over {price} · Kuwait',
    navMachines: 'Machines', navBeans: 'Beans', navBundles: 'Bundles', navContact: 'Contact', categories: 'Categories',
    heroTag: 'Good coffee is a set of decisions',
    heroLead: 'Precision', heroEm: 'you can taste.',
    heroText: 'A thoughtful edit of coffee tools and locally roasted beans for people who like knowing how their coffee gets made.',
    shopNow: 'Shop Now', detailNote: 'Tools for better mornings, chosen with care',
    ticker1: 'Measure what matters', ticker2: 'Locally roasted in Kuwait', ticker3: 'Brew with intention', ticker4: 'A better cup, by design',
    productsTag: 'The working collection', productsTitle: 'Find your flow.',
    productsIntro: 'Good tools make the process clearer. Start with the part of your brew you want to understand better.',
    all: 'Everything', machines: 'Machines', beans: 'Beans', how: 'How it works', details: 'Details', add: 'Add to cart',
    back: 'Back', origin: 'Origin', bagSize: 'Bag size', roaster: 'Roaster', roastedBy: 'Roasted in Kuwait by Brew',
    originUnlisted: 'Specific country not listed', description: 'Description', regularPrice: 'Regular price',
    bundlePrice: 'Bundle price', includedItems: 'Included items', price: 'Price', savings: 'You save',
    bundlesTag: 'Made to work together', bundlesTitle: 'A good place to begin.',
    bundlesIntro: 'Three combinations, considered from the first grind to the final pour. A little less to decide, a lot more to enjoy.',
    bundleNote: 'Included in this set', save: 'Save', addBundle: 'Add bundle to cart',
    originTag: 'Close to home', originTitle: 'Roasted here. Brewed here.', originBanner: 'BREW · KUWAIT',
    originText: 'We roast the coffee in our shop right here in Kuwait.',
    contactTitle: 'A question about your next cup?', contactText: 'We would love to help you find the right setup.', contactButton: 'Get in touch',
    footerText: 'Coffee equipment and beans for the curious home brewer. Kuwait, made for your counter.',
    shop: 'Shop', sayHello: 'Say hello', follow: 'Follow along', email: 'Email us',
    rights: '© 2025 Brew · Kuwait', crafted: 'Engineer your cup',
    cart: 'Your cart', emptyTitle: 'Nothing brewing yet.', emptyText: 'Your next good cup starts with a tool or a bag of beans.', startShopping: 'Explore the collection',
    subtotal: 'Total', checkout: 'Continue to checkout', checkoutNote: 'Stripe test checkout is charged in USD. No real money will be charged.',
    remove: 'Remove', added: 'Added to your cart', bundleAdded: 'Bundle added to your cart',
    close: 'Close', quantity: 'Quantity', productDetails: 'Product details', roasted: 'Roasted in Kuwait by Brew',
    themeLight: 'Switch to light theme', themeDark: 'Switch to dark theme', language: 'العربية', menu: 'Open menu',
    search: 'Search', searchPlaceholder: 'Search machines, beans, bundles...', clearSearch: 'Clear search', noSearchResults: 'No products found',
    categoryMachineSearch: 'Machines & tools', categoryBeanSearch: 'Coffee beans', favorites: 'Favorites', noFavorites: 'No favorites yet',
    favoriteAdd: 'Add to favorites', favoriteRemove: 'Remove from favorites',
    currency: 'Currency', currencyLoading: 'Loading exchange rates', currencyError: 'Exchange rates unavailable. Prices are in KWD.',
    currencyNote: 'Approximate display prices. Stripe test checkout is charged in USD.',
    currencyLocationNote: 'Currency set from your location.',
    categoryMachines: 'Coffee machines & tools', categoryBeans: 'Locally roasted coffee',
    categoryMachineCopy: 'Thoughtful equipment that lets you get closer to the cup you want.', categoryBeansCopy: 'Freshly roasted in Kuwait by Brew. Find a coffee worth slowing down for.',
    noProducts: 'Nothing in this collection yet.',
    catalogLoading: 'Loading the collection…', catalogError: 'The collection is unavailable. Please try again.', retry: 'Try again',
    equipment: 'Brew equipment', localRoast: '250g · Kuwait roasted', each: 'Each', bundle: 'Bundle', brewStage: 'CALIBRATE · POUR · REPEAT', figure: 'FIG. 01 / POUR-OVER SYSTEM',
  },
  ar: {
    announcement: 'توصيل مجاني للطلبات فوق {price} · الكويت',
    navMachines: 'الأجهزة', navBeans: 'البن', navBundles: 'المجموعات', navContact: 'تواصل معنا', categories: 'التصنيفات',
    heroTag: 'القهوة الجيدة تبدأ بقرارات مدروسة',
    heroLead: 'دقة', heroEm: 'تتذوقها.',
    heroText: 'اختيارات مدروسة من أدوات القهوة وحبوب محمصة محلياً، لكل من يهتم بكيفية تحضير فنجانه.',
    shopNow: 'تسوّق الآن', detailNote: 'أدوات لصباح أفضل، اخترناها بعناية',
    ticker1: 'قِس ما يهم', ticker2: 'تحميص محلي في الكويت', ticker3: 'حضّر باهتمام', ticker4: 'فنجان أفضل، بتصميم مدروس',
    productsTag: 'مجموعة الأدوات', productsTitle: 'اكتشف طريقتك.',
    productsIntro: 'الأدوات الجيدة تجعل التحضير أوضح. ابدأ بالجزء الذي ترغب في فهمه أكثر.',
    all: 'الكل', machines: 'الأجهزة', beans: 'البن', how: 'كيف تعمل', details: 'التفاصيل', add: 'أضف إلى السلة',
    back: 'رجوع', origin: 'المنشأ', bagSize: 'حجم الكيس', roaster: 'المحمصة', roastedBy: 'تحميص Brew في الكويت',
    originUnlisted: 'لم يُذكر بلد المنشأ', description: 'الوصف', regularPrice: 'السعر الأصلي',
    bundlePrice: 'سعر المجموعة', includedItems: 'محتويات المجموعة', price: 'السعر', savings: 'وفّرت',
    bundlesTag: 'اختيارات تكمل بعضها', bundlesTitle: 'بداية موفقة.',
    bundlesIntro: 'ثلاث مجموعات مدروسة من أول طحن إلى آخر صبّة. خيارات أقل، ومتعة أكثر.',
    bundleNote: 'تتضمن هذه المجموعة', save: 'وفّر', addBundle: 'أضف المجموعة إلى السلة',
    originTag: 'من هنا', originTitle: 'تحميص محلي. وفنجانك أيضاً.', originBanner: 'Brew · الكويت',
    originText: 'نحمّص القهوة في متجرنا هنا في الكويت.',
    contactTitle: 'لديك سؤال عن فنجانك القادم؟', contactText: 'يسعدنا مساعدتك في اختيار الأدوات المناسبة.', contactButton: 'تواصل معنا',
    footerText: 'أدوات قهوة وحبوب لعشاق التحضير في المنزل. من الكويت، لركن قهوتك.',
    shop: 'تسوّق', sayHello: 'تواصل معنا', follow: 'تابعنا', email: 'راسلنا عبر البريد الإلكتروني',
    rights: '© ٢٠٢٥ Brew · الكويت', crafted: 'أتقن قهوتك',
    cart: 'سلتك', emptyTitle: 'لا شيء في السلة بعد.', emptyText: 'فنجانك القادم يبدأ بأداة أو كيس من البن.', startShopping: 'اكتشف المجموعة',
    subtotal: 'الإجمالي', checkout: 'متابعة إلى إتمام الطلب', checkoutNote: 'الدفع التجريبي عبر Stripe بالدولار الأمريكي. لن يتم تحصيل أي مبلغ حقيقي.',
    remove: 'إزالة', added: 'أُضيف إلى سلتك', bundleAdded: 'أُضيفت المجموعة إلى سلتك',
    close: 'إغلاق', quantity: 'الكمية', productDetails: 'تفاصيل المنتج', roasted: 'تحميص Brew في الكويت',
    themeLight: 'التبديل إلى المظهر الفاتح', themeDark: 'التبديل إلى المظهر الداكن', language: 'English', menu: 'فتح القائمة',
    search: 'بحث', searchPlaceholder: 'ابحث عن الأجهزة أو البن أو المجموعات...', clearSearch: 'مسح البحث', noSearchResults: 'لم يتم العثور على منتجات',
    categoryMachineSearch: 'أجهزة وأدوات القهوة', categoryBeanSearch: 'حبوب القهوة', favorites: 'المفضلة', noFavorites: 'لا توجد عناصر في المفضلة بعد',
    favoriteAdd: 'أضف إلى المفضلة', favoriteRemove: 'إزالة من المفضلة',
    currency: 'العملة', currencyLoading: 'جارٍ تحميل أسعار الصرف', currencyError: 'أسعار الصرف غير متاحة. الأسعار بالدينار الكويتي.',
    currencyNote: 'أسعار العرض تقريبية. الدفع التجريبي عبر Stripe بالدولار الأمريكي.',
    currencyLocationNote: 'تم تحديد العملة حسب موقعك.',
    categoryMachines: 'أجهزة وأدوات القهوة', categoryBeans: 'قهوة محمصة محلياً',
    categoryMachineCopy: 'أدوات مدروسة تقرّبك من الفنجان الذي تريده.', categoryBeansCopy: 'محمصة في الكويت بواسطة Brew. اكتشف قهوة تستحق التمهل.',
    noProducts: 'لا توجد منتجات في هذه المجموعة حالياً.',
    catalogLoading: 'جارٍ تحميل المجموعة…', catalogError: 'المجموعة غير متاحة الآن. يرجى المحاولة مرة أخرى.', retry: 'حاول مرة أخرى',
    equipment: 'أدوات التحضير', localRoast: '٢٥٠ غرام · تحميص محلي', each: 'للقطعة', bundle: 'مجموعة', brewStage: 'اضبط · اسكب · كرر', figure: 'الشكل ٠١ / تحضير بالتقطير',
  },
};

function detailDescription(item: CatalogItem, language: Language, t: typeof copy.en, money: (price: number) => string) {
  if ('items' in item) {
    return language === 'ar'
      ? `تجمع هذه المجموعة المنتجات التالية: ${item.items.join('، ')}. سعرها الأصلي ${money(item.regular)} وسعرها ${money(item.price)}. بذلك توفّر ${money(item.regular - item.price)}.`
      : `This set brings together ${item.items.join(', ')}. Its regular price is ${money(item.regular)}, and the bundle price is ${money(item.price)}. You save ${money(item.regular - item.price)}.`;
  }
  return language === 'ar'
    ? item.detailDescriptionAr || item.descriptionAr || item.detailDescription || item.description
    : item.detailDescription || `${item.description} ${item.why}`;
}

function detailHowLine(item: CatalogItem, language: Language, t: typeof copy.en) {
  if ('items' in item) {
    return language === 'ar' ? item.noteAr || item.note : item.note;
  }
  return language === 'ar' ? item.whyAr || item.why : item.why;
}

function catalogImageKey(item: CatalogItem, products: Product[]) {
  if ('image' in item) return item.image;
  const featuredProduct = products.find(product => product.name === item.items[0]);
  return featuredProduct?.image ?? 'machine';
}

function normalizeSearch(value: string) {
  return value.toLocaleLowerCase().normalize('NFKC').replace(/[\u064B-\u065F\u0670]/g, '').trim();
}

const DETAIL_BACK_PATH_KEY = 'brew-product-back-path';
const DETAIL_BACK_SCROLL_KEY = 'brew-product-back-scroll';
const PENDING_SECTION_KEY = 'brew-pending-section';

function sessionGet(key: string) {
  try { return window.sessionStorage.getItem(key); } catch { return null; }
}

function sessionSet(key: string, value: string) {
  try { window.sessionStorage.setItem(key, value); } catch { /* session history is an enhancement */ }
}

function sessionRemove(key: string) {
  try { window.sessionStorage.removeItem(key); } catch { /* session history is an enhancement */ }
}

function BrandMark({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 38 44" fill="none" aria-hidden="true">
      <path d="M7 5h24l-2.3 4H9.3L7 5Z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="m9 10 4 15c.5 2 2.1 3.3 4 3.3h4c1.9 0 3.5-1.3 4-3.3l4-15" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M16 28.5v4.2m6-4.2v4.2M11 36h16M19 32.7v3.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M13 18h12" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2"/>
    </svg>;
}

function Logo() {
  return <Link href="/" className="brand" aria-label="Brew home" data-testid="link-home">
    <BrandMark className="brand-mark" /><span>Brew</span>
  </Link>;
}

function ProductIllustration({ product, beanLabel, compact = false, children }: { product: Product | CartItem; beanLabel: string; compact?: boolean; children?: ReactNode }) {
  const image = product.image || 'machine';
  const photo = productPhoto(image);
  const hasPhoto = Boolean(photo);
  const blendsBackground = image === 'hario-photo' || image === 'bean-bag-photo';
  return <div className={`product-visual${compact ? ' compact' : ''}${hasPhoto ? ' has-photo' : ''}`}>
    <span className="visual-tag">{'category' in product && product.category === 'bean' || image === 'bag' ? beanLabel : 'Brew / 01'}</span>
    {photo ? <img className={`product-photo${blendsBackground ? ' light-background' : ''}`} src={photo} alt="" aria-hidden="true" /> : <div className={`device ${image}`} aria-hidden="true" />}
    {children}
  </div>;
}

function FavoriteToggle({ id, name, saved, t, onToggle, className = '' }: {
  id: string; name: string; saved: boolean; t: typeof copy.en; onToggle: () => void; className?: string;
}) {
  return <button
    type="button"
    className={`favorite-button${saved ? ' saved' : ''}${className ? ` ${className}` : ''}`}
    onClick={onToggle}
    aria-label={`${saved ? t.favoriteRemove : t.favoriteAdd} ${name}`}
    aria-pressed={saved}
    data-testid={`button-favorite-${id}`}
  ><Heart size={16} fill={saved ? 'currentColor' : 'none'} strokeWidth={1.8}/></button>;
}

function SearchResults({ entries, t, onAdd, onNavigate, id }: {
  entries: SearchEntry[]; t: typeof copy.en; onAdd: (item: CatalogItem) => void; onNavigate: () => void; id: string;
}) {
  const { money } = useCurrency();
  const { loading, error } = useCatalog();
  return <div className="search-results" id={id} role="region" aria-label={t.search}>
    {loading || error ? <div className="search-no-results" role="status">{loading ? t.catalogLoading : t.catalogError}</div> : entries.length === 0
      ? <div className="search-no-results" role="status" data-testid="search-no-results">{t.noSearchResults}</div>
      : <div className="search-result-list">{entries.map(entry => {
        const photo = productPhoto(entry.imageKey);
        const blend = entry.imageKey === 'hario-photo' || entry.imageKey === 'bean-bag-photo';
        return <article className="search-result" key={entry.item.id} data-testid={`search-result-${entry.item.id}`}>
          <Link href={`/product/${entry.item.id}`} className="search-result-link" onClick={onNavigate} data-testid={`link-search-result-${entry.item.id}`}>
            <div className="search-result-image">{photo
              ? <img className={blend ? 'light-background' : ''} src={photo} alt="" aria-hidden="true"/>
              : <ShoppingBag size={19} aria-hidden="true"/>}</div>
            <div className="search-result-copy">
              <small>{entry.category}</small>
              <strong>{entry.item.name}</strong>
              <span>{money(entry.item.price)}</span>
            </div>
          </Link>
          <button className="search-add-button" type="button" onClick={() => onAdd(entry.item)} data-testid={`button-search-add-${entry.item.id}`}>{t.add}<Plus size={13}/></button>
        </article>;
      })}</div>}
  </div>;
}

function ProductCard({ product, t, language, onAdd, onDetails, isFavorite, onToggleFavorite }: {
  product: Product; t: typeof copy.en; language: Language; onAdd: (product: Product) => void; onDetails: (product: Product) => void;
  isFavorite: boolean; onToggleFavorite: () => void;
}) {
  const { money } = useCurrency();
  return <article className="product-card" data-testid={`card-product-${product.id}`}>
    <div className="product-card-visual">
      <Link href={`/product/${product.id}`} className="product-visual-link" onClick={() => onDetails(product)} aria-label={product.name} data-testid={`link-product-image-${product.id}`}>
        <ProductIllustration product={product} beanLabel={t.originBanner}/>
      </Link>
      <FavoriteToggle id={product.id} name={product.name} saved={isFavorite} t={t} onToggle={onToggleFavorite} className="product-card-favorite"/>
    </div>
    <div className="product-info">
      <div className="product-kicker">{product.category === 'bean' ? `${bagSizeLabel(product.bagSize, language)} · ${language === 'ar' ? 'تحميص محلي' : 'Kuwait roasted'}` : t.equipment}</div>
      <div className="product-title-line"><Link href={`/product/${product.id}`} className="product-title-link" onClick={() => onDetails(product)} data-testid={`link-product-title-${product.id}`}><h3 className="product-title">{product.name}</h3></Link><span className="product-price" data-testid={`text-price-${product.id}`}>{money(product.price)}</span></div>
      <p className="product-desc">{language === 'ar' ? product.descriptionAr || product.description : product.description}</p>
      <div className="card-actions">
        <Link className="text-action" href={`/product/${product.id}`} onClick={() => onDetails(product)} data-testid={`button-details-${product.id}`}>{t.details}</Link>
        <button className="add-button" onClick={() => onAdd(product)} data-testid={`button-add-${product.id}`}>{t.add}</button>
      </div>
    </div>
  </article>;
}

function CurrencyDropdown({ t, theme, mobile = false }: { t: typeof copy.en; theme: 'light' | 'dark'; mobile?: boolean }) {
  const { currency, setCurrency, status, fromLocation, availableCurrencies } = useCurrency();
  return <div className={`currency-picker ${theme}${mobile ? ' currency-picker-mobile' : ''}`}
    title={status === 'error' ? t.currencyError : status === 'loading' ? t.currencyLoading : t.currency}>
    <select aria-label={t.currency} value={currency} disabled={status !== 'ready'}
      onChange={event => setCurrency(event.target.value as Currency)} data-testid={mobile ? 'select-currency-mobile' : 'select-currency'}>
      {currencies.map(code => <option key={code} value={code} disabled={status === 'ready' && !availableCurrencies.includes(code)}>{code}</option>)}
    </select>
    <ChevronDown size={11} aria-hidden="true"/>
    {fromLocation && <small className="currency-location-note" data-testid={mobile ? 'text-currency-location-mobile' : 'text-currency-location'}>{t.currencyLocationNote}</small>}
  </div>;
}

function Header({ t, language, setLanguage, theme, toggleTheme, cartCount, favoriteCount, openCart, openFavorites, onAddItem, onNavigateToDetail }: {
  t: typeof copy.en; language: Language; setLanguage: (l: Language) => void; theme: 'light' | 'dark'; toggleTheme: () => void;
  cartCount: number; favoriteCount: number; openCart: () => void; openFavorites: () => void;
  onAddItem: (item: CatalogItem) => void; onNavigateToDetail: () => void;
}) {
  const { money } = useCurrency();
  const { products, bundles } = useCatalog();
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchPanelRef = useRef<HTMLDivElement>(null);
  const mobileSearchButtonRef = useRef<HTMLButtonElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const searchEntries = useMemo(() => {
    const query = normalizeSearch(searchQuery);
    if (!query) return [];
    const machineTerms = `${t.categoryMachineSearch} machine machines equipment brewer brewers coffee tools أجهزة آلة آلات معدات أدوات`;
    const beanTerms = `${t.categoryBeanSearch} bean beans coffee roast roasted local حبوب البن بن قهوة محمصة`;
    const bundleTerms = `${t.bundle} bundle bundles set sets مجموعات مجموعة باقة باقات`;
    const entries: SearchEntry[] = [
      ...products.map(item => ({
        item,
        imageKey: item.image,
        category: item.category === 'machine' ? t.categoryMachineSearch : t.categoryBeanSearch,
        searchTerms: item.category === 'machine' ? machineTerms : beanTerms,
      })),
      ...bundles.map(item => ({
        item,
        imageKey: catalogImageKey(item, products),
        category: t.bundle,
        searchTerms: bundleTerms,
      })),
    ];
    return entries.filter(entry => normalizeSearch(`${entry.item.name} ${entry.category} ${entry.searchTerms}`).includes(query));
  }, [searchQuery, t, products, bundles]);
  useEffect(() => { setMenuOpen(false); setCategoriesOpen(false); setMobileSearchOpen(false); setSearchDropdownOpen(false); }, [location]);
  useEffect(() => {
    if (mobileSearchOpen) mobileSearchInputRef.current?.focus();
  }, [mobileSearchOpen]);
  useEffect(() => {
    const closeDropdownOutside = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const insideSearch = desktopSearchRef.current?.contains(target)
        || mobileSearchPanelRef.current?.contains(target)
        || mobileSearchButtonRef.current?.contains(target);
      if (!insideSearch) setSearchDropdownOpen(false);
    };
    document.addEventListener('pointerdown', closeDropdownOutside);
    return () => document.removeEventListener('pointerdown', closeDropdownOutside);
  }, []);
  const updateSearch = (value: string) => {
    setSearchQuery(value);
    setSearchDropdownOpen(Boolean(value.trim()));
  };
  const clearSearch = () => {
    setSearchQuery('');
    setSearchDropdownOpen(false);
  };
  const addSearchResult = (item: CatalogItem) => {
    onAddItem(item);
    clearSearch();
    setMobileSearchOpen(false);
  };
  const toggleMobileSearch = () => {
    if (mobileSearchOpen) {
      setMobileSearchOpen(false);
      setSearchDropdownOpen(false);
    } else {
      setMenuOpen(false);
      setMobileSearchOpen(true);
      setSearchDropdownOpen(Boolean(searchQuery.trim()));
    }
  };
  const showResults = searchDropdownOpen && Boolean(searchQuery.trim());
  const goToSection = (sectionId: 'bundles' | 'contact') => {
    setMenuOpen(false);
    setCategoriesOpen(false);
    setSearchDropdownOpen(false);
    setMobileSearchOpen(false);
    if (location === '/') {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      sessionSet(PENDING_SECTION_KEY, sectionId);
      setLocation('/');
    }
  };
  return <>
    <div className="top-strip"><span>{t.announcement.split('{price}')[0]}<bdi>{money(25)}</bdi>{t.announcement.split('{price}')[1]}</span></div>
    <header className="nav-shell">
      <div className="container-wide nav-inner">
        <Logo />
        <nav className="nav-links" aria-label="Main navigation">
          <div className="nav-drop">
            <button onClick={() => setCategoriesOpen(!categoriesOpen)} aria-expanded={categoriesOpen} data-testid="button-categories">{t.categories} <ChevronDown size={13}/></button>
            {categoriesOpen && <div className="drop-panel">
              <Link href="/machines" data-testid="link-machines-dropdown">{t.navMachines}</Link>
              <Link href="/beans" data-testid="link-beans-dropdown">{t.navBeans}</Link>
            </div>}
          </div>
          <a href="#bundles" onClick={event => { event.preventDefault(); goToSection('bundles'); }} data-testid="link-bundles">{t.navBundles}</a>
          <a href="#contact" onClick={event => { event.preventDefault(); goToSection('contact'); }} data-testid="link-contact">{t.navContact}</a>
        </nav>
        <div className="desktop-search" ref={desktopSearchRef}>
          <div className="search-field">
            <Search size={15} aria-hidden="true"/>
            <input
              type="text"
              value={searchQuery}
              onChange={event => updateSearch(event.currentTarget.value)}
              onFocus={() => { if (searchQuery.trim()) setSearchDropdownOpen(true); }}
              placeholder={t.searchPlaceholder}
              aria-label={t.search}
              aria-controls="desktop-search-results"
              aria-expanded={showResults && !mobileSearchOpen}
              data-testid="input-navbar-search"
            />
            {searchQuery && <button type="button" className="search-clear" onClick={clearSearch} aria-label={t.clearSearch} data-testid="button-clear-search"><X size={14}/></button>}
          </div>
          {showResults && !mobileSearchOpen && <SearchResults id="desktop-search-results" entries={searchEntries} t={t} onAdd={addSearchResult} onNavigate={onNavigateToDetail}/>}
        </div>
        <div className="nav-actions">
          <CurrencyDropdown t={t} theme={theme}/>
          <CustomerAccountButton language={language}/>
          <button className="icon-button" onClick={toggleTheme} aria-label={theme === 'light' ? t.themeDark : t.themeLight} data-testid="button-theme">
            {theme === 'light' ? <Moon size={16}/> : <Sun size={16}/>}
          </button>
          <button className="icon-button" onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} aria-label={`Language: ${language === 'en' ? 'Arabic' : 'English'}`} data-testid="button-language"><span style={{fontSize:10,fontWeight:600}}>{language === 'en' ? 'ع' : 'EN'}</span></button>
          <button className="icon-button mobile-search-button" onClick={toggleMobileSearch} aria-label={t.search} aria-expanded={mobileSearchOpen} ref={mobileSearchButtonRef} data-testid="button-mobile-search"><Search size={16}/></button>
          <button className="icon-button favorites-nav-button" onClick={openFavorites} aria-label={`${t.favorites} (${favoriteCount})`} data-testid="button-favorites">
            <Heart size={16} strokeWidth={1.8}/><span className="favorite-count" data-testid="text-favorite-count">{favoriteCount.toLocaleString(language === 'ar' ? 'ar-KW' : 'en-US')}</span>
          </button>
          <button className="icon-button" onClick={openCart} aria-label={t.cart} data-testid="button-cart"><ShoppingBag size={16}/>{cartCount > 0 && <span key={cartCount} className="cart-count" data-testid="text-cart-count">{cartCount}</span>}</button>
          <button className="icon-button mobile-menu" onClick={() => { setMobileSearchOpen(false); setSearchDropdownOpen(false); setMenuOpen(!menuOpen); }} aria-label={t.menu} aria-expanded={menuOpen} data-testid="button-mobile-menu">{menuOpen ? <X size={17}/> : <Menu size={17}/>}</button>
        </div>
      </div>
      {mobileSearchOpen && <div className="mobile-search-panel" ref={mobileSearchPanelRef}>
        <div className="container-wide mobile-search-inner">
          <div className="mobile-search-row">
            <div className="search-field">
              <Search size={15} aria-hidden="true"/>
              <input
                ref={mobileSearchInputRef}
                type="text"
                value={searchQuery}
                onChange={event => updateSearch(event.currentTarget.value)}
                onFocus={() => { if (searchQuery.trim()) setSearchDropdownOpen(true); }}
                placeholder={t.searchPlaceholder}
                aria-label={t.search}
                aria-controls="mobile-search-results"
                aria-expanded={showResults && mobileSearchOpen}
                data-testid="input-navbar-search-mobile"
              />
              {searchQuery && <button type="button" className="search-clear" onClick={clearSearch} aria-label={t.clearSearch} data-testid="button-clear-search-mobile"><X size={14}/></button>}
            </div>
            <button className="icon-button mobile-search-close" onClick={toggleMobileSearch} aria-label={t.close} data-testid="button-close-mobile-search"><X size={16}/></button>
          </div>
          {showResults && <SearchResults id="mobile-search-results" entries={searchEntries} t={t} onAdd={addSearchResult} onNavigate={onNavigateToDetail}/>}
        </div>
      </div>}
      {menuOpen && <nav className="mobile-nav" aria-label="Mobile navigation">
        <div className="mobile-currency-row"><span>{t.currency}</span><CurrencyDropdown t={t} theme={theme} mobile/></div>
        <button onClick={() => setCategoriesOpen(!categoriesOpen)} data-testid="button-mobile-categories">{t.categories} <ChevronDown size={13}/></button>
        {categoriesOpen && <><Link href="/machines" data-testid="link-mobile-machines">{t.navMachines}</Link><Link href="/beans" data-testid="link-mobile-beans">{t.navBeans}</Link></>}
        <a href="#bundles" onClick={event => { event.preventDefault(); goToSection('bundles'); }} data-testid="link-mobile-bundles">{t.navBundles}</a>
        <a href="#contact" onClick={event => { event.preventDefault(); goToSection('contact'); }} data-testid="link-mobile-contact">{t.navContact}</a>
      </nav>}
    </header>
  </>;
}

function Footer({ t }: { t: typeof copy.en }) {
  return <>
    <section className="contact-band" id="contact">
      <div className="container-wide contact-inner"><div><h2>{t.contactTitle}</h2><p>{t.contactText}</p></div>
        <a className="primary-button" href="mailto:hello@brewlogic.com" data-testid="link-contact-email">{t.contactButton}<ArrowRight size={15}/></a>
      </div>
    </section>
    <footer className="footer">
      <div className="container-wide">
        <div className="footer-top">
          <div><Logo/><p className="footer-note"><bdi>Engineer your cup</bdi></p><p className="footer-note">{t.footerText}</p></div>
          <div className="footer-links">
            <div className="footer-col"><strong>{t.shop}</strong><Link href="/machines" data-testid="footer-link-machines">{t.navMachines}</Link><Link href="/beans" data-testid="footer-link-beans">{t.navBeans}</Link><Link href="/#bundles" data-testid="footer-link-bundles">{t.navBundles}</Link></div>
            <div className="footer-col"><strong>{t.sayHello}</strong><a href="mailto:hello@brewlogic.com" data-testid="footer-link-email">{t.email}</a><a href="https://wa.me/96598858879" target="_blank" rel="noreferrer" data-testid="footer-link-whatsapp">WhatsApp</a></div>
            <div className="footer-col"><strong>{t.follow}</strong><a href="https://www.instagram.com/" target="_blank" rel="noreferrer" data-testid="footer-link-instagram">Instagram</a><span>Kuwait City, Kuwait</span></div>
          </div>
        </div>
        <div className="footer-bottom"><span>{t.rights}</span><a href="https://www.exchangerate-api.com" data-testid="link-exchange-attribution">Rates By Exchange Rate API</a><span>{t.crafted}</span></div>
      </div>
    </footer>
  </>;
}

function Hero({ t }: { t: typeof copy.en }) {
  return <section className="container-wide hero">
    <div className="hero-copy">
      <div className="eyebrow">{t.heroTag}</div>
      <h1>{t.heroLead}<br/><em>{t.heroEm}</em></h1>
      <p className="hero-text">{t.heroText}</p>
      <a href="#products" className="primary-button" data-testid="link-shop-now">{t.shopNow}<ArrowDown size={15}/></a>
      <div className="hero-note"><span><Check size={13}/></span>{t.detailNote}</div>
    </div>
    <div className="hero-art" aria-label="Brew logo" role="img">
      <div className="hero-brand-lockup"><BrandMark className="hero-brand-mark"/><span>Brew</span></div>
    </div>
  </section>;
}

function Ticker({ t }: { t: typeof copy.en }) {
  return <div className="ticker"><div className="ticker-track">{[0, 1].map(n => <span key={n}>
    <span>{t.ticker1}</span><span>{t.ticker2}</span><span>{t.ticker3}</span><span>{t.ticker4}</span>
  </span>)}</div></div>;
}

function BundleSection({ t, language, onAdd, onDetails, favoriteIds, onToggleFavorite }: {
  t: typeof copy.en; language: Language; onAdd: (bundle: Bundle) => void; onDetails: (bundle: Bundle) => void;
  favoriteIds: string[]; onToggleFavorite: (item: CatalogItem) => void;
}) {
  const { money } = useCurrency();
  const { bundles } = useCatalog();
  return <section className="bundles-section" id="bundles"><div className="container-wide">
    <div className="section-head"><div><div className="eyebrow">{t.bundlesTag}</div><h2>{t.bundlesTitle}</h2></div><p className="section-intro">{t.bundlesIntro}</p></div>
    <div className="bundle-grid">{bundles.map((bundle, index) => <article className="bundle-card" key={bundle.id} data-testid={`card-${bundle.id}`}>
      <div className="bundle-card-head"><span className="bundle-num">BL / SET 0{index + 1}</span>
        <FavoriteToggle id={bundle.id} name={bundle.name} saved={favoriteIds.includes(bundle.id)} t={t} onToggle={() => onToggleFavorite(bundle)}/>
      </div>
      <h3>{bundle.name}</h3><p>{language === 'ar' ? bundle.noteAr || bundle.note : bundle.note}</p>
      <ul className="bundle-items" aria-label={t.bundleNote}>{bundle.items.map(item => <li key={item}>{item}</li>)}</ul>
      <div className="bundle-bottom"><div className="bundle-price"><small>{money(bundle.regular)}</small><strong>{money(bundle.price)}</strong><span>{t.save} {money(bundle.regular - bundle.price)}</span></div>
        <Link className="bundle-detail-link" href={`/product/${bundle.id}`} onClick={() => onDetails(bundle)} data-testid={`link-details-${bundle.id}`}>{t.details}</Link>
        <button className="add-button" onClick={() => onAdd(bundle)} data-testid={`button-add-${bundle.id}`}>{t.addBundle}</button></div>
    </article>)}</div>
  </div></section>;
}

function OriginSection({ t }: { t: typeof copy.en }) {
  return <section className="container-wide origin-section">
    <div className="origin-art"><strong>LOCAL<br/>GROUND</strong><small>{t.originBanner}</small></div>
    <div className="origin-copy"><div className="eyebrow">{t.originTag}</div><h2>{t.originTitle}</h2><p>{t.originText}</p></div>
  </section>;
}

function CartDrawer({ open, close, items, t, onQuantity, onRemove, checkout }: {
  open: boolean; close: () => void; items: CartItem[]; t: typeof copy.en; onQuantity: (id: string, delta: number) => void; onRemove: (id: string) => void; checkout: CheckoutState;
}) {
  const { money, currency } = useCurrency();
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return <>
    <div className={`drawer-backdrop${open ? ' open' : ''}`} onClick={close} aria-hidden={!open}/>
    <aside className={`cart-drawer${open ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label={t.cart}>
      <div className="drawer-head"><h2>{t.cart} <span style={{fontSize:14,opacity:.55}}>({items.reduce((n, x) => n + x.quantity, 0)})</span></h2><button className="icon-button" onClick={close} aria-label={t.close} data-testid="button-close-cart"><X size={17}/></button></div>
      {checkout.message && <div className="cart-summary" role={checkout.isError ? 'alert' : 'status'} data-testid="status-checkout">
        <p className="checkout-note">{checkout.message}</p>
        {checkout.canRetry && <button className="add-button" onClick={() => void checkout.verify()} data-testid="button-verify-payment">{checkout.retryText}</button>}
      </div>}
      {currency !== 'KWD' && <p className="currency-note" data-testid="text-currency-note">{t.currencyNote}</p>}
      {items.length === 0 ? <div className="empty-cart"><div><ShoppingBag size={26} strokeWidth={1.2}/><h3>{t.emptyTitle}</h3><p>{t.emptyText}</p><button className="primary-button" onClick={close} data-testid="button-empty-shopping">{t.startShopping}<ArrowRight size={14}/></button></div></div> : <>
        <div className="cart-items">{items.map(item => <article className="cart-row" key={item.id} data-testid={`row-cart-${item.id}`}>
          <div className="cart-thumb"><div className={`device ${item.image}`}/></div>
          <div><h3>{item.name}</h3><small>{money(item.price)} · {item.isBundle ? t.bundle : t.each}</small><div className="quantity" aria-label={t.quantity}>
            <button onClick={() => onQuantity(item.id, -1)} aria-label={`Decrease ${item.name} quantity`} data-testid={`button-decrease-${item.id}`}>−</button><span data-testid={`text-quantity-${item.id}`}>{item.quantity}</span><button onClick={() => onQuantity(item.id, 1)} aria-label={`Increase ${item.name} quantity`} data-testid={`button-increase-${item.id}`}>+</button>
          </div></div><button className="remove-button" onClick={() => onRemove(item.id)} data-testid={`button-remove-${item.id}`}>{t.remove}</button>
        </article>)}</div>
        <div className="cart-summary"><div className="total-line"><span>{t.subtotal}</span><span data-testid="text-cart-total">{money(total)}</span></div>
          {checkout.quote && <div data-testid="checkout-usd-quote">
            <div className="total-line"><span>{checkout.quoteLabel}</span><strong>{checkout.quote.amountUsd.toFixed(2)} USD</strong></div>
            <p className="checkout-note">{checkout.rateLabel}</p>
          </div>}
          <button className="primary-button checkout" onClick={() => void checkout.start()} disabled={checkout.busy} aria-busy={checkout.busy} data-testid="button-checkout">{checkout.buttonText || t.checkout}<ArrowRight size={15}/></button><p className="checkout-note">{t.checkoutNote}</p></div>
      </>}
    </aside>
  </>;
}

function FavoritesDrawer({ open, close, items, t, onAdd, onRemove }: {
  open: boolean; close: () => void; items: CatalogItem[]; t: typeof copy.en; onAdd: (item: CatalogItem) => void; onRemove: (id: string) => void;
}) {
  const { money } = useCurrency();
  const { products } = useCatalog();
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);
  return <>
    <div className={`drawer-backdrop${open ? ' open' : ''}`} onClick={close} aria-hidden={!open}/>
    <aside className={`favorites-drawer${open ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label={t.favorites} aria-hidden={!open}>
      <div className="drawer-head">
        <h2>{t.favorites} <span style={{fontSize:14,opacity:.55}}>({items.length})</span></h2>
        <button className="icon-button" onClick={close} aria-label={t.close} data-testid="button-close-favorites"><X size={17}/></button>
      </div>
      {items.length === 0
        ? <div className="empty-cart"><div><Heart size={26} strokeWidth={1.2}/><h3>{t.noFavorites}</h3></div></div>
        : <div className="favorites-items">{items.map(item => {
          const imageKey = catalogImageKey(item, products);
          const photo = productPhoto(imageKey);
          const blend = imageKey === 'hario-photo' || imageKey === 'bean-bag-photo';
          return <article className="favorites-row" key={item.id} data-testid={`row-favorite-${item.id}`}>
            <div className="favorite-thumb">{photo
              ? <img className={blend ? 'light-background' : ''} src={photo} alt="" aria-hidden="true"/>
              : <ShoppingBag size={20} aria-hidden="true"/>}</div>
            <div className="favorite-row-content">
              <h3>{item.name}</h3>
              <small>{money(item.price)}</small>
              <div className="favorite-row-actions">
                <button className="add-button" onClick={() => onAdd(item)} data-testid={`button-favorite-add-${item.id}`}>{t.add}</button>
                <button className="remove-button favorite-remove" onClick={() => onRemove(item.id)} aria-label={`${t.favoriteRemove} ${item.name}`} data-testid={`button-favorite-remove-${item.id}`}><X size={14}/><span>{t.remove}</span></button>
              </div>
            </div>
          </article>;
        })}</div>}
    </aside>
  </>;
}

function ProductDetailPage({ item, t, language, backHref, isFavorite, onToggleFavorite, onAdd }: {
  item: CatalogItem; t: typeof copy.en; language: Language; backHref: string; isFavorite: boolean;
  onToggleFavorite: () => void; onAdd: (item: CatalogItem, quantity: number) => void;
}) {
  const { money } = useCurrency();
  const { products } = useCatalog();
  const [quantity, setQuantity] = useState(1);
  useEffect(() => setQuantity(1), [item.id]);
  const isBundle = 'items' in item;
  const category = isBundle ? t.bundle : item.category === 'machine' ? t.categoryMachines : t.categoryBeans;
  const image = productPhoto(catalogImageKey(item, products));
  const origin = !isBundle && item.category === 'bean' ? (language === 'ar' ? item.originAr || item.origin : item.origin) || t.originUnlisted : '';

  return <main className="container-wide product-detail" data-testid={`page-product-${item.id}`}>
    <Link href={backHref} className="detail-back" data-testid="link-product-back"><ArrowLeft size={15}/>{t.back}</Link>
    <div className="product-detail-grid">
      <div className="product-detail-image" aria-label={item.name} role="img">
        {image ? <img src={image} alt={item.name} data-testid={`image-product-detail-${item.id}`}/> : <ShoppingBag size={64} aria-hidden="true"/>}
      </div>
      <div className="product-detail-copy">
        <div className="eyebrow">{category}</div>
        <h1>{item.name}</h1>
        {isBundle
          ? <div className="detail-bundle-prices">
            <div><small>{t.regularPrice}</small><del>{money(item.regular)}</del></div>
            <div><small>{t.bundlePrice}</small><strong>{money(item.price)}</strong></div>
            <div><small>{t.savings}</small><span>{money(item.regular - item.price)}</span></div>
          </div>
          : <div className="detail-product-price">{money(item.price)}</div>}
        <section className="detail-how">
          <h2>{t.how}</h2>
          <p>{detailHowLine(item, language, t)}</p>
        </section>
        <section className="detail-description">
          <h2>{t.description}</h2>
          <p>{detailDescription(item, language, t, money)}</p>
        </section>
        {!isBundle && item.category === 'bean' && <dl className="detail-facts">
          <div><dt>{t.origin}</dt><dd>{origin}</dd></div>
          <div><dt>{t.bagSize}</dt><dd>{bagSizeLabel(item.bagSize, language)}</dd></div>
          <div><dt>{t.roaster}</dt><dd>{t.roastedBy}</dd></div>
        </dl>}
        {isBundle && <section className="detail-included">
          <h2>{t.includedItems}</h2>
          <ul>{item.items.map(includedItem => <li key={includedItem}>{includedItem}</li>)}</ul>
        </section>}
        <div className="detail-purchase">
          <div className="detail-quantity" role="group" aria-label={t.quantity}>
            <button type="button" onClick={() => setQuantity(value => Math.max(1, value - 1))} aria-label={`${t.quantity} −`} data-testid="button-detail-quantity-decrease">−</button>
            <span data-testid="text-detail-quantity">{quantity}</span>
            <button type="button" onClick={() => setQuantity(value => value + 1)} aria-label={`${t.quantity} +`} data-testid="button-detail-quantity-increase">+</button>
          </div>
          <FavoriteToggle id={item.id} name={item.name} saved={isFavorite} t={t} onToggle={onToggleFavorite} className="detail-favorite"/>
          <button className="add-button detail-add" onClick={() => onAdd(item, quantity)} data-testid={`button-detail-add-${item.id}`}>{t.add}<Plus size={15}/></button>
        </div>
      </div>
    </div>
  </main>;
}

function Storefront() {
  const { products, catalogItems, loading, error, ready, retry } = useCatalog();
  const [location] = useLocation();
  const [language, setLanguageState] = useState<Language>(() => (localStorage.getItem('brew-language') as Language) || 'en');
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => (localStorage.getItem('brew-theme') as 'light' | 'dark') || 'light');
  const [cart, setCart] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('brew-cart') || '[]') as CartItem[]; } catch { return []; }
  });
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem('brew-favorites') || '[]');
      return Array.isArray(stored)
        ? [...new Set(stored.filter((id): id is string => typeof id === 'string'))]
        : [];
    } catch { return []; }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'machine' | 'bean'>('all');
  const [toast, setToast] = useState('');
  const checkout = useCheckout(cart, language, receipt => {
    let completed: string[] = [];
    try {
      const stored: unknown = JSON.parse(localStorage.getItem('brew-checkout-receipts') || '[]');
      if (Array.isArray(stored)) completed = stored.filter((id): id is string => typeof id === 'string');
    } catch { /* corrupted receipt storage must not crash the store */ }
    if (completed.includes(receipt.sessionId)) return;
    const next = cart.flatMap(item => {
      const purchased = receipt.items.find(line => line.id === item.id)?.quantity || 0;
      return item.quantity > purchased ? [{ ...item, quantity: item.quantity - purchased }] : [];
    });
    // No storage effects inside a React state updater (Strict Mode repeats it).
    localStorage.setItem('brew-cart', JSON.stringify(next));
    localStorage.setItem('brew-checkout-receipts', JSON.stringify([...completed.slice(-99), receipt.sessionId]));
    setCart(next);
  });
  useEffect(() => { if (checkout.returned) setCartOpen(true); }, [checkout.returned]);
  const t = copy[language];
  const isDetailRoute = location.startsWith('/product/');
  const detailId = isDetailRoute ? location.slice('/product/'.length) : '';
  const detailItem = catalogItems.find(item => item.id === detailId);
  const storedBackPath = sessionGet(DETAIL_BACK_PATH_KEY);
  const backHref = storedBackPath?.startsWith('/') && !storedBackPath.startsWith('//') && storedBackPath !== location ? storedBackPath : '/';
  const routeKind = location.startsWith('/machines') ? 'machine' : location.startsWith('/beans') ? 'bean' : 'all';
  const filteredProducts = useMemo(() => products.filter(product => routeKind === 'all' ? activeTab === 'all' || product.category === activeTab : product.category === routeKind), [routeKind, activeTab, products]);
  const favoriteItems = useMemo(
    () => favoriteIds.map(id => catalogItems.find(item => item.id === id)).filter((item): item is CatalogItem => Boolean(item)),
    [favoriteIds, catalogItems],
  );
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (!ready) return;
    setFavoriteIds(old => old.filter(id => catalogItems.some(item => item.id === id)));
    setCart(old => old.flatMap(saved => {
      const item = catalogItems.find(entry => entry.id === saved.id);
      if (!item) return [];
      return [{ ...saved, name: item.name, price: item.price, image: catalogImageKey(item, products), isBundle: 'items' in item }];
    }));
  }, [catalogItems, products, ready]);
  useEffect(() => {
    localStorage.setItem('brew-cart', JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    localStorage.setItem('brew-favorites', JSON.stringify(favoriteIds));
  }, [favoriteIds]);
  useEffect(() => {
    localStorage.setItem('brew-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  useEffect(() => {
    localStorage.setItem('brew-language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (isDetailRoute) {
      window.scrollTo(0, 0);
      return;
    }
    if (sessionGet(DETAIL_BACK_PATH_KEY) === location) {
      const previousScroll = Number(sessionGet(DETAIL_BACK_SCROLL_KEY) || '0');
      sessionRemove(DETAIL_BACK_PATH_KEY);
      sessionRemove(DETAIL_BACK_SCROLL_KEY);
      const frame = window.requestAnimationFrame(() => window.scrollTo(0, previousScroll));
      return () => window.cancelAnimationFrame(frame);
    }
    return undefined;
  }, [location, isDetailRoute]);
  useEffect(() => {
    if (location !== '/') return;
    const sectionId = sessionGet(PENDING_SECTION_KEY);
    if (sectionId !== 'bundles' && sectionId !== 'contact') return;
    const timer = window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      sessionRemove(PENDING_SECTION_KEY);
    }, 80);
    return () => window.clearTimeout(timer);
  }, [location]);

  const addItem = (item: CatalogItem, quantity = 1) => {
    const isBundle = 'items' in item;
    const cartItem: CartItem = isBundle
      ? { id: item.id, name: item.name, price: item.price, image: catalogImageKey(item, products), quantity, isBundle: true }
      : { id: item.id, name: item.name, price: item.price, image: item.image, quantity };
    setCart(old => {
      const exists = old.find(entry => entry.id === cartItem.id);
      return exists ? old.map(entry => entry.id === cartItem.id ? { ...entry, quantity: entry.quantity + quantity } : entry) : [...old, cartItem];
    });
    setToast(isBundle ? t.bundleAdded : t.added);
  };
  const rememberDetailReturn = () => {
    sessionSet(DETAIL_BACK_PATH_KEY, location);
    sessionSet(DETAIL_BACK_SCROLL_KEY, String(window.scrollY));
  };
  const toggleFavorite = (item: CatalogItem) => {
    setFavoriteIds(old => old.includes(item.id) ? old.filter(id => id !== item.id) : [...old, item.id]);
  };
  const adjustQuantity = (id: string, delta: number) => setCart(old => old.flatMap(item => item.id === id ? (item.quantity + delta <= 0 ? [] : [{ ...item, quantity: item.quantity + delta }]) : [item]));
  const removeItem = (id: string) => setCart(old => old.filter(item => item.id !== id));
  return <div className="page-shell" data-testid="storefront">
    <Header t={t} language={language} setLanguage={setLanguageState} theme={theme} toggleTheme={() => setThemeState(theme === 'light' ? 'dark' : 'light')}
      cartCount={cartCount} favoriteCount={favoriteIds.length}
      openCart={() => { setFavoritesOpen(false); setCartOpen(true); }}
      openFavorites={() => { setCartOpen(false); setFavoritesOpen(true); }}
      onAddItem={addItem} onNavigateToDetail={rememberDetailReturn}/>
    {isDetailRoute ? loading || error
      ? <main className="container-wide section" role="status">{loading ? t.catalogLoading : <>{t.catalogError} <button className="add-button" onClick={retry}>{t.retry}</button></>}</main>
      : detailItem
      ? <ProductDetailPage item={detailItem} t={t} language={language} backHref={backHref}
        isFavorite={favoriteIds.includes(detailItem.id)} onToggleFavorite={() => toggleFavorite(detailItem)} onAdd={addItem}/>
      : <NotFound/>
      : <>
    {routeKind === 'all' && <><Hero t={t}/><Ticker t={t}/></>}
    <main className="container-wide section" id="products">
      {routeKind !== 'all' && <div className="section-head"><div><div className="eyebrow">{routeKind === 'machine' ? t.categoryMachines : t.categoryBeans}</div><h2>{routeKind === 'machine' ? t.navMachines : t.navBeans}</h2></div><p className="section-intro">{routeKind === 'machine' ? t.categoryMachineCopy : t.categoryBeansCopy}</p></div>}
      {routeKind === 'all' && <div className="section-head"><div><div className="eyebrow">{t.productsTag}</div><h2>{t.productsTitle}</h2></div><p className="section-intro">{t.productsIntro}</p></div>}
      {routeKind === 'all' && <div className="tabs" role="tablist" aria-label={t.productsTitle}>
        {(['all', 'machine', 'bean'] as const).map(tab => <button key={tab} role="tab" aria-selected={activeTab === tab} className={`tab${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)} data-testid={`tab-${tab}`}>{tab === 'all' ? t.all : tab === 'machine' ? t.machines : t.beans}</button>)}
      </div>}
      {loading ? <p role="status">{t.catalogLoading}</p> : error ? <p role="alert">{t.catalogError} <button className="add-button" onClick={retry}>{t.retry}</button></p> : filteredProducts.length ? <div className="product-grid">{filteredProducts.map(product => <ProductCard key={product.id} product={product} t={t} language={language} onAdd={addItem} onDetails={rememberDetailReturn}
        isFavorite={favoriteIds.includes(product.id)} onToggleFavorite={() => toggleFavorite(product)}/>)}</div> : <p>{t.noProducts}</p>}
    </main>
    {routeKind === 'all' && <><BundleSection t={t} language={language} onAdd={addItem} onDetails={rememberDetailReturn} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite}/><OriginSection t={t}/></>}
    </>}
    <Footer t={t}/>
    <ChatWidget language={language} onNavigate={rememberDetailReturn}/>
    <a className="whatsapp" href="https://wa.me/96598858879" target="_blank" rel="noreferrer" aria-label="Contact Brew on WhatsApp" data-testid="link-floating-whatsapp"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.2 11.7a8.2 8.2 0 0 1-12.1 7.2L3 20l1.2-4.8A8.2 8.2 0 1 1 20.2 11.7Z" stroke="currentColor" strokeWidth="1.6"/><path d="M8.2 8.1c.3-.5.5-.5.8-.5h.5c.2 0 .4.1.5.5l.7 1.7c.1.3 0 .5-.2.7l-.5.6c-.2.2-.2.4-.1.6.4.8 1.3 1.6 2.2 2 .2.1.4.1.6-.1l.7-.8c.2-.2.4-.2.7-.1l1.6.8c.3.1.4.3.4.5 0 .3-.2 1.2-.8 1.5-.6.4-1.3.5-2.1.3-.8-.2-1.9-.7-3.1-1.8-1.2-1.1-2-2.4-2.2-3.3-.2-.9 0-1.6.3-2.1Z" fill="currentColor"/></svg></a>
    <CartDrawer open={cartOpen} close={() => setCartOpen(false)} items={cart} t={t} onQuantity={adjustQuantity} onRemove={removeItem} checkout={checkout}/>
    <FavoritesDrawer open={favoritesOpen} close={() => setFavoritesOpen(false)} items={favoriteItems} t={t} onAdd={addItem} onRemove={id => setFavoriteIds(old => old.filter(itemId => itemId !== id))}/>
    <div className={`toast-message${toast ? ' show' : ''}`} role="status" aria-live="polite" data-testid="status-toast">{toast}</div>
  </div>;
}

function Router() {
  const [path] = useLocation();
  let page: ReactNode = <NotFound/>;
  if (['/', '/machines', '/beans'].includes(path) || /^\/product\/[^/]+\/?$/.test(path)) page = <Storefront/>;
  else if (path === '/admin') page = <AdminPage/>;
  else if (path === '/login') page = <CustomerLoginPage/>;
  else if (path === '/signup') page = <CustomerSignupPage/>;
  else if (path === '/sign-in' || path.startsWith('/sign-in/')) page = <SignInPage/>;
  else if (path === '/sign-up' || path.startsWith('/sign-up/')) page = <SignUpPage/>;
  return <RoutedErrorBoundary>{page}</RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}>
    <CustomerAuthProvider>
    <TooltipProvider>
      <CurrencyProvider>
      <CatalogProvider>
        <AdminAuthProvider>
        <Router/>
        </AdminAuthProvider>
      </CatalogProvider>
      </CurrencyProvider>
      <Toaster/>
    </TooltipProvider>
    </CustomerAuthProvider>
  </QueryClientProvider>;
}

export default App;
