import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from '@/lib/navigation';
import { useAuth, useClerk } from '@clerk/react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, Coffee, Lock, LogOut, Package, Pencil, Plus, RefreshCw, ShieldX, Trash2, X } from 'lucide-react';
import {
  useGetAdminCatalog, getGetAdminCatalogQueryKey, getGetProductsQueryKey, getGetBundlesQueryKey,
  useCreateCatalogEntry, useUpdateCatalogEntry, useDeleteCatalogEntry,
  type CatalogProduct, type CatalogBundle, type CatalogEntryInput,
} from '@workspace/api-client-react';
import xbloomPhoto from '@assets/image_1791649384537.png';
import aidenPhoto from '@assets/image_1791649481086.png';
import moccamasterPhoto from '@assets/image_1791649574028.png';
import eurekaPhoto from '@assets/image_1791649604656.png';
import staggPhoto from '@assets/image_1791649655738.png';
import harioPhoto from '@assets/image_1791649703321.png';
import beanBagPhoto from '@assets/image_1791649759965.png';
import './admin.css';

const basePath = '';

const imagePhotos: Record<string, string> = {
  'xbloom-photo': xbloomPhoto.src, 'aiden-photo': aidenPhoto.src, 'moccamaster-photo': moccamasterPhoto.src,
  'eureka-photo': eurekaPhoto.src, 'stagg-photo': staggPhoto.src, 'hario-photo': harioPhoto.src, 'bean-bag-photo': beanBagPhoto.src,
};
const imageKeys = Object.keys(imagePhotos);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function resolveImage(image: string) {
  if (imagePhotos[image]) return imagePhotos[image];
  if (/^https:\/\//i.test(image)) return image;
  return null;
}

function errorStatus(err: unknown): number | null {
  if (err && typeof err === 'object' && 'status' in err && typeof (err as { status: unknown }).status === 'number') return (err as { status: number }).status;
  return null;
}

function errorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const data = (err as { data?: unknown }).data;
    if (data && typeof data === 'object') {
      const d = data as Record<string, unknown>;
      if (typeof d.error === 'string') return d.error;
      if (typeof d.message === 'string') return d.message;
    }
    const status = errorStatus(err);
    if (status === 409) return 'An entry with this ID already exists.';
    if (status === 401 || status === 403) return 'Your session no longer has owner access.';
    if (err instanceof Error && err.message) return err.message;
  }
  return 'Something went wrong. Please try again.';
}

const kwd = (n: number) => `${n.toFixed(3)} KWD`;

type ProductForm = { id: string; name: string; price: string; category: 'machine' | 'bean'; image: string; description: string; why: string;
  descriptionAr: string; whyAr: string; detailDescription: string; detailDescriptionAr: string; origin: string; originAr: string; bagSize: string };
type BundleForm = { id: string; name: string; price: string; regular: string; items: string; note: string; noteAr: string };

const emptyProduct: ProductForm = { id: '', name: '', price: '', category: 'machine', image: 'xbloom-photo', description: '', why: '',
  descriptionAr: '', whyAr: '', detailDescription: '', detailDescriptionAr: '', origin: '', originAr: '', bagSize: '' };
const emptyBundle: BundleForm = { id: '', name: '', price: '', regular: '', items: '', note: '', noteAr: '' };

function productToForm(p: CatalogProduct): ProductForm {
  return { id: p.id, name: p.name, price: String(p.price), category: p.category, image: p.image, description: p.description, why: p.why,
    descriptionAr: p.descriptionAr ?? '', whyAr: p.whyAr ?? '', detailDescription: p.detailDescription ?? '', detailDescriptionAr: p.detailDescriptionAr ?? '',
    origin: p.origin ?? '', originAr: p.originAr ?? '', bagSize: p.bagSize ?? '' };
}
function bundleToForm(b: CatalogBundle): BundleForm {
  return { id: b.id, name: b.name, price: String(b.price), regular: String(b.regular), items: b.items.join('\n'), note: b.note, noteAr: b.noteAr ?? '' };
}

function parsePrice(v: string): number | null {
  if (v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 100000 ? n : null;
}

function validateId(id: string, taken: Set<string>, isNew: boolean) {
  if (!isNew) return undefined;
  if (!id) return 'Required.';
  if (id.length > 80 || !SLUG.test(id)) return 'Lowercase letters, numbers and single hyphens only.';
  if (taken.has(id)) return 'This ID is already used.';
  return undefined;
}

function validateProduct(f: ProductForm, taken: Set<string>, isNew: boolean) {
  const e: Partial<Record<keyof ProductForm, string>> = {};
  const idErr = validateId(f.id, taken, isNew); if (idErr) e.id = idErr;
  if (!f.name.trim()) e.name = 'Required.';
  if (parsePrice(f.price) === null) e.price = 'Enter a finite, non-negative number.';
  const img = f.image.trim();
  if (!img) e.image = 'Required.';
  else if (!imagePhotos[img] && !/^https:\/\/\S+$/i.test(img)) e.image = 'Use an existing image key or an HTTPS URL.';
  return e;
}

function validateBundle(f: BundleForm, taken: Set<string>, isNew: boolean) {
  const e: Partial<Record<keyof BundleForm, string>> = {};
  const idErr = validateId(f.id, taken, isNew); if (idErr) e.id = idErr;
  if (!f.name.trim()) e.name = 'Required.';
  const price = parsePrice(f.price); const regular = parsePrice(f.regular);
  if (price === null) e.price = 'Enter a finite, non-negative number.';
  if (regular === null) e.regular = 'Enter a finite, non-negative number.';
  if (price !== null && regular !== null && regular < price) e.regular = 'Regular price must be at least the bundle price.';
  const items = f.items.split('\n').map(s => s.trim()).filter(Boolean);
  if (items.length === 0) e.items = 'Add at least one item.';
  else if (items.length > 30) e.items = 'Up to 30 items.';
  return e;
}

function Field({ label, optional, error, hint, children, testId }: { label: string; optional?: boolean; error?: string; hint?: string; children: ReactNode; testId: string }) {
  return <div className={`adm-field${error ? ' bad' : ''}`}>
    <label htmlFor={testId}>{label}{optional && <em>optional</em>}</label>
    {children}
    {error ? <span className="adm-err" data-testid={`error-${testId}`}>{error}</span> : hint ? <span className="adm-hint">{hint}</span> : null}
  </div>;
}

type Editor = { kind: 'product'; original: CatalogProduct | null } | { kind: 'bundle'; original: CatalogBundle | null };

function EditorPanel({ editor, taken, onClose, onSaved }: { editor: Editor; taken: Set<string>; onClose: () => void; onSaved: (id: string, created: boolean) => void }) {
  const queryClient = useQueryClient();
  const create = useCreateCatalogEntry({ request: { credentials: 'same-origin' } });
  const update = useUpdateCatalogEntry({ request: { credentials: 'same-origin' } });
  const isNew = editor.original === null;
  const [pf, setPf] = useState<ProductForm>(() => editor.kind === 'product' && editor.original ? productToForm(editor.original) : emptyProduct);
  const [bf, setBf] = useState<BundleForm>(() => editor.kind === 'bundle' && editor.original ? bundleToForm(editor.original) : emptyBundle);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const pending = create.isPending || update.isPending;

  const pErr = useMemo(() => validateProduct(pf, taken, isNew), [pf, taken, isNew]);
  const bErr = useMemo(() => validateBundle(bf, taken, isNew), [bf, taken, isNew]);
  const errors: Record<string, string | undefined> = editor.kind === 'product' ? pErr : bErr;
  const show = (k: string) => (submitted ? errors[k] : undefined);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !pending) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, pending]);

  const setP = (k: keyof ProductForm) => (e: { target: { value: string } }) => setPf(f => ({ ...f, [k]: e.target.value }));
  const setB = (k: keyof BundleForm) => (e: { target: { value: string } }) => setBf(f => ({ ...f, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true); setServerError(null);
    if (Object.values(errors).some(Boolean)) return;
    let data: CatalogEntryInput;
    if (editor.kind === 'product') {
      data = { kind: 'product', id: pf.id.trim(), name: pf.name.trim(), price: Number(pf.price), category: pf.category, image: pf.image.trim(),
        description: pf.description.trim(), why: pf.why.trim(), descriptionAr: pf.descriptionAr.trim(), whyAr: pf.whyAr.trim(),
        detailDescription: pf.detailDescription.trim(), detailDescriptionAr: pf.detailDescriptionAr.trim(),
        origin: pf.origin.trim(), originAr: pf.originAr.trim(), bagSize: pf.bagSize.trim() };
    } else {
      data = { kind: 'bundle', id: bf.id.trim(), name: bf.name.trim(), price: Number(bf.price), regular: Number(bf.regular),
        items: bf.items.split('\n').map(s => s.trim()).filter(Boolean), note: bf.note.trim(), noteAr: bf.noteAr.trim() };
    }
    const done = {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAdminCatalogQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetBundlesQueryKey() });
        setPf(emptyProduct); setBf(emptyBundle); setSubmitted(false);
        onSaved(data.id, isNew);
      },
      onError: (err: unknown) => setServerError(errorMessage(err)),
    };
    if (isNew) create.mutate({ data }, done);
    else update.mutate({ id: editor.original!.id, data }, done);
  };

  const noun = editor.kind === 'product' ? 'product' : 'bundle';
  const preview = editor.kind === 'product' ? resolveImage(pf.image.trim()) : null;

  return <div className="adm-overlay" onMouseDown={e => { if (e.target === e.currentTarget && !pending) onClose(); }}>
    <form className="adm-panel" role="dialog" aria-modal="true" aria-labelledby="adm-editor-title" onSubmit={submit} noValidate data-testid={`form-${noun}`}>
      <div className="adm-panel-head">
        <div><div className="adm-eyebrow">{isNew ? `New ${noun}` : `Editing ${noun}`}</div><h2 id="adm-editor-title">{isNew ? `Add a ${noun}` : editor.original!.name}</h2></div>
        <button type="button" className="adm-btn sm" onClick={onClose} disabled={pending} aria-label="Close editor" data-testid="button-close-editor"><X size={15} /></button>
      </div>
      <div className="adm-panel-body">
        {serverError && <div className="adm-banner error" role="alert" data-testid="text-save-error"><AlertTriangle size={15} /><span>{serverError}</span></div>}
        {editor.kind === 'product' ? <>
          <fieldset className="adm-fieldset"><legend>Identity</legend>
            <div className="adm-grid2">
              <Field label="ID (slug)" error={show('id')} hint={isNew ? 'Permanent. Used in product URLs.' : 'IDs cannot be changed after creation.'} testId="input-product-id">
                <input id="input-product-id" value={pf.id} onChange={setP('id')} readOnly={!isNew} dir="ltr" placeholder="e.g. kalita-wave" data-testid="input-product-id" />
              </Field>
              <Field label="Category" testId="select-product-category">
                <select id="select-product-category" value={pf.category} onChange={e => setPf(f => ({ ...f, category: e.target.value as 'machine' | 'bean' }))} data-testid="select-product-category">
                  <option value="machine">Machine / tool</option><option value="bean">Coffee bean</option>
                </select>
              </Field>
            </div>
            <div className="adm-grid2">
              <Field label="Name (English)" error={show('name')} testId="input-product-name"><input id="input-product-name" value={pf.name} onChange={setP('name')} maxLength={160} data-testid="input-product-name" /></Field>
              <Field label="Price (KWD)" error={show('price')} testId="input-product-price"><input id="input-product-price" type="number" inputMode="decimal" step="0.001" min="0" value={pf.price} onChange={setP('price')} dir="ltr" data-testid="input-product-price" /></Field>
            </div>
          </fieldset>
          <fieldset className="adm-fieldset"><legend>Image</legend>
            <Field label="Image key or HTTPS URL" error={show('image')} hint={`Keys: ${imageKeys.join(', ')}`} testId="input-product-image">
              <div className="adm-imgprev">
                <div className="adm-thumb">{preview ? <img src={preview} alt="" /> : <Package size={20} />}</div>
                <input id="input-product-image" list="adm-image-keys" value={pf.image} onChange={setP('image')} dir="ltr" maxLength={2000} data-testid="input-product-image" />
                <datalist id="adm-image-keys">{imageKeys.map(k => <option key={k} value={k} />)}</datalist>
              </div>
            </Field>
          </fieldset>
          <fieldset className="adm-fieldset"><legend>Copy</legend>
            <Field label="Description (English)" testId="input-product-description"><textarea id="input-product-description" value={pf.description} onChange={setP('description')} maxLength={2000} data-testid="input-product-description" /></Field>
            <Field label="Why it works (English)" testId="input-product-why"><textarea id="input-product-why" value={pf.why} onChange={setP('why')} maxLength={2000} data-testid="input-product-why" /></Field>
            <Field label="Description (Arabic)" optional testId="input-product-descriptionAr"><textarea id="input-product-descriptionAr" dir="rtl" value={pf.descriptionAr} onChange={setP('descriptionAr')} maxLength={2000} data-testid="input-product-descriptionAr" /></Field>
            <Field label="Why it works (Arabic)" optional testId="input-product-whyAr"><textarea id="input-product-whyAr" dir="rtl" value={pf.whyAr} onChange={setP('whyAr')} maxLength={2000} data-testid="input-product-whyAr" /></Field>
            <Field label="Detail page text (English)" optional testId="input-product-detailDescription"><textarea id="input-product-detailDescription" value={pf.detailDescription} onChange={setP('detailDescription')} maxLength={4000} data-testid="input-product-detailDescription" /></Field>
            <Field label="Detail page text (Arabic)" optional testId="input-product-detailDescriptionAr"><textarea id="input-product-detailDescriptionAr" dir="rtl" value={pf.detailDescriptionAr} onChange={setP('detailDescriptionAr')} maxLength={4000} data-testid="input-product-detailDescriptionAr" /></Field>
          </fieldset>
          <fieldset className="adm-fieldset"><legend>Origin and size</legend>
            <div className="adm-grid2">
              <Field label="Origin (English)" optional testId="input-product-origin"><input id="input-product-origin" value={pf.origin} onChange={setP('origin')} maxLength={200} data-testid="input-product-origin" /></Field>
              <Field label="Origin (Arabic)" optional testId="input-product-originAr"><input id="input-product-originAr" dir="rtl" value={pf.originAr} onChange={setP('originAr')} maxLength={200} data-testid="input-product-originAr" /></Field>
            </div>
            <Field label="Bag size" optional hint="e.g. 250g" testId="input-product-bagSize"><input id="input-product-bagSize" value={pf.bagSize} onChange={setP('bagSize')} maxLength={80} data-testid="input-product-bagSize" /></Field>
          </fieldset>
        </> : <>
          <fieldset className="adm-fieldset"><legend>Identity</legend>
            <div className="adm-grid2">
              <Field label="ID (slug)" error={show('id')} hint={isNew ? 'Permanent once saved.' : 'IDs cannot be changed after creation.'} testId="input-bundle-id">
                <input id="input-bundle-id" value={bf.id} onChange={setB('id')} readOnly={!isNew} dir="ltr" placeholder="e.g. morning-ritual" data-testid="input-bundle-id" />
              </Field>
              <Field label="Name (English)" error={show('name')} testId="input-bundle-name"><input id="input-bundle-name" value={bf.name} onChange={setB('name')} maxLength={160} data-testid="input-bundle-name" /></Field>
            </div>
          </fieldset>
          <fieldset className="adm-fieldset"><legend>Pricing</legend>
            <div className="adm-grid2">
              <Field label="Bundle price (KWD)" error={show('price')} testId="input-bundle-price"><input id="input-bundle-price" type="number" inputMode="decimal" step="0.001" min="0" dir="ltr" value={bf.price} onChange={setB('price')} data-testid="input-bundle-price" /></Field>
              <Field label="Regular price (KWD)" error={show('regular')} testId="input-bundle-regular"><input id="input-bundle-regular" type="number" inputMode="decimal" step="0.001" min="0" dir="ltr" value={bf.regular} onChange={setB('regular')} data-testid="input-bundle-regular" /></Field>
            </div>
            {parsePrice(bf.price) !== null && parsePrice(bf.regular) !== null && parsePrice(bf.regular)! >= parsePrice(bf.price)! &&
              <span className="adm-hint" data-testid="text-bundle-savings">Customers save {kwd(parsePrice(bf.regular)! - parsePrice(bf.price)!)}</span>}
          </fieldset>
          <fieldset className="adm-fieldset"><legend>Contents</legend>
            <Field label="Included items" error={show('items')} hint="One product name per line." testId="input-bundle-items"><textarea id="input-bundle-items" value={bf.items} onChange={setB('items')} rows={5} data-testid="input-bundle-items" /></Field>
            <Field label="Note (English)" testId="input-bundle-note"><textarea id="input-bundle-note" value={bf.note} onChange={setB('note')} maxLength={2000} data-testid="input-bundle-note" /></Field>
            <Field label="Note (Arabic)" optional testId="input-bundle-noteAr"><textarea id="input-bundle-noteAr" dir="rtl" value={bf.noteAr} onChange={setB('noteAr')} maxLength={2000} data-testid="input-bundle-noteAr" /></Field>
          </fieldset>
        </>}
      </div>
      <div className="adm-panel-foot">
        {submitted && Object.values(errors).some(Boolean) && <span className="adm-err" style={{ marginInlineEnd: 'auto' }}>Fix the highlighted fields.</span>}
        <button type="button" className="adm-btn" onClick={onClose} disabled={pending} data-testid="button-cancel-editor">Cancel</button>
        <button type="submit" className="adm-btn primary" disabled={pending} data-testid="button-save-entry">
          {pending ? <><span className="adm-spin" />Saving</> : <><Check size={14} />{isNew ? `Create ${noun}` : 'Save changes'}</>}
        </button>
      </div>
    </form>
  </div>;
}

function ConfirmDelete({ target, onCancel, onDone }: { target: { id: string; name: string; kind: string }; onCancel: () => void; onDone: (ok: boolean, msg: string) => void }) {
  const queryClient = useQueryClient();
  const del = useDeleteCatalogEntry({ request: { credentials: 'same-origin' } });
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const confirm = () => {
    setError(null);
    del.mutate({ id: target.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAdminCatalogQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetBundlesQueryKey() });
        onDone(true, `${target.name} was deleted.`);
      },
      onError: err => setError(errorMessage(err)),
    });
  };
  return <div className="adm-dialog-wrap" onMouseDown={e => { if (e.target === e.currentTarget && !del.isPending) onCancel(); }}>
    <div className="adm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="adm-del-title" data-testid="dialog-confirm-delete">
      <h2 id="adm-del-title">Delete {target.name}?</h2>
      <p>This removes the {target.kind} from the live storefront immediately and cannot be undone. Type <strong dir="ltr">{target.id}</strong> to confirm.</p>
      <div className="adm-field"><input value={typed} onChange={e => setTyped(e.target.value)} dir="ltr" autoFocus aria-label="Type the ID to confirm" data-testid="input-confirm-delete" /></div>
      {error && <div className="adm-banner error" role="alert" style={{ marginTop: 12 }} data-testid="text-delete-error"><AlertTriangle size={15} /><span>{error}</span></div>}
      <div className="adm-actions">
        <button className="adm-btn" onClick={onCancel} disabled={del.isPending} data-testid="button-cancel-delete">Keep it</button>
        <button className="adm-btn danger solid" onClick={confirm} disabled={typed !== target.id || del.isPending} data-testid="button-confirm-delete">
          {del.isPending ? <><span className="adm-spin" />Deleting</> : <><Trash2 size={14} />Delete permanently</>}
        </button>
      </div>
    </div>
  </div>;
}

function Shell({ children, signedIn }: { children: ReactNode; signedIn?: boolean }) {
  const { signOut } = useClerk();
  return <div className="adm"><div className="adm-wrap">
    <header className="adm-top">
      <Link href="/" className="adm-brand" data-testid="link-storefront"><Coffee size={20} color="var(--olive)" />Brew <small>Catalog</small></Link>
      <div className="adm-actions">
        <Link href="/" className="adm-btn sm" data-testid="link-view-store">View storefront</Link>
        {signedIn && <button className="adm-btn sm" onClick={() => signOut({ redirectUrl: basePath || '/' })} data-testid="button-sign-out"><LogOut size={13} />Sign out</button>}
      </div>
    </header>
    {children}
  </div></div>;
}

export default function AdminPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const query = useGetAdminCatalog({ query: { enabled: isLoaded && !!isSignedIn, queryKey: getGetAdminCatalogQueryKey(), retry: false }, request: { credentials: 'same-origin' } });
  const [tab, setTab] = useState<'products' | 'bundles'>('products');
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<Editor | null>(null);
  const [toDelete, setToDelete] = useState<{ id: string; name: string; kind: string } | null>(null);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const notify = (msg: string, error = false) => {
    setToast({ msg, error });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3600);
  };
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const products = useMemo(() => query.data?.products ?? [], [query.data]);
  const bundles = useMemo(() => query.data?.bundles ?? [], [query.data]);
  const taken = useMemo(() => new Set([...products.map(p => p.id), ...bundles.map(b => b.id)]), [products, bundles]);
  const q = search.trim().toLowerCase();
  const shownProducts = products.filter(p => !q || `${p.name} ${p.id}`.toLowerCase().includes(q));
  const shownBundles = bundles.filter(b => !q || `${b.name} ${b.id} ${b.items.join(' ')}`.toLowerCase().includes(q));

  if (!isLoaded) return <Shell><div className="adm-head"><div style={{ width: '100%' }}><div className="adm-skel" style={{ height: 60, maxWidth: 360 }} /></div></div></Shell>;

  if (!isSignedIn) return <Shell>
    <div className="adm-head"><div><div className="adm-eyebrow">Private</div><h1>Catalog editor</h1></div></div>
    <div className="adm-state" data-testid="state-signed-out">
      <span className="adm-state-icon"><Lock size={22} /></span>
      <h2>Owner access only</h2>
      <p>This page edits the live Brew catalog. Sign in with the shop owner account to manage products and bundles. Other accounts can sign in but will not see the editor.</p>
      <div className="adm-actions">
        <Link href="/sign-in" className="adm-btn primary" data-testid="link-sign-in">Sign in</Link>
        <Link href="/sign-up" className="adm-btn" data-testid="link-sign-up">Create account</Link>
      </div>
    </div>
  </Shell>;

  const status = errorStatus(query.error);
  if (query.isError && (status === 401 || status === 403)) return <Shell signedIn>
    <div className="adm-head"><div><div className="adm-eyebrow">Private</div><h1>Catalog editor</h1></div></div>
    <div className="adm-state deny" data-testid="state-access-denied">
      <span className="adm-state-icon"><ShieldX size={22} /></span>
      <h2>{status === 401 ? 'Session not recognised' : 'Access denied'}</h2>
      <p>{status === 401 ? 'Your sign-in could not be verified. Sign in again to continue.' : 'You are signed in, but this account is not the shop owner. Only the owner email can edit the catalog.'}</p>
      <div className="adm-actions">
        {status === 401 ? <Link href="/sign-in" className="adm-btn primary" data-testid="link-sign-in-again">Sign in again</Link>
          : <Link href="/" className="adm-btn primary" data-testid="link-back-store">Back to the shop</Link>}
      </div>
    </div>
  </Shell>;

  const list = tab === 'products' ? shownProducts : shownBundles;

  return <Shell signedIn>
    <div className="adm-head">
      <div><div className="adm-eyebrow">Owner workspace</div><h1>Catalog editor</h1><p>Changes publish to the storefront as soon as they are saved.</p></div>
      <div className="adm-stats">
        <div><strong data-testid="text-count-products">{query.isLoading ? '-' : products.length}</strong>Products</div>
        <div><strong data-testid="text-count-bundles">{query.isLoading ? '-' : bundles.length}</strong>Bundles</div>
      </div>
    </div>

    <div className="adm-tabs" role="tablist">
      <button role="tab" aria-selected={tab === 'products'} className={`adm-tab${tab === 'products' ? ' on' : ''}`} onClick={() => setTab('products')} data-testid="tab-products">Products<span>{products.length}</span></button>
      <button role="tab" aria-selected={tab === 'bundles'} className={`adm-tab${tab === 'bundles' ? ' on' : ''}`} onClick={() => setTab('bundles')} data-testid="tab-bundles">Bundles<span>{bundles.length}</span></button>
      <input className="adm-search" placeholder={`Filter ${tab}`} value={search} onChange={e => setSearch(e.target.value)} aria-label="Filter entries" data-testid="input-filter" />
      <button className="adm-btn primary sm" onClick={() => setEditor(tab === 'products' ? { kind: 'product', original: null } : { kind: 'bundle', original: null })} disabled={!query.data} data-testid={`button-add-${tab === 'products' ? 'product' : 'bundle'}`}>
        <Plus size={14} />Add {tab === 'products' ? 'product' : 'bundle'}
      </button>
    </div>

    {query.isLoading ? <div className="adm-list">{[0, 1, 2, 3].map(i => <div key={i} className="adm-skel" />)}</div>
      : query.isError ? <div className="adm-state" data-testid="state-load-error">
        <span className="adm-state-icon"><AlertTriangle size={22} /></span>
        <h2>Could not load the catalog</h2><p>{errorMessage(query.error)}</p>
        <div className="adm-actions"><button className="adm-btn primary" onClick={() => query.refetch()} data-testid="button-retry"><RefreshCw size={14} />Try again</button></div>
      </div>
      : list.length === 0 ? <div className="adm-state" data-testid="state-empty">
        <span className="adm-state-icon"><Package size={22} /></span>
        <h2>{q ? 'No matches' : `No ${tab} yet`}</h2>
        <p>{q ? 'Nothing matches that filter. Clear it to see everything.' : `Add the first ${tab === 'products' ? 'product' : 'bundle'} to show it on the storefront.`}</p>
        {q && <div className="adm-actions"><button className="adm-btn" onClick={() => setSearch('')} data-testid="button-clear-filter">Clear filter</button></div>}
      </div>
      : <div className="adm-list">
        {tab === 'products' ? shownProducts.map(p => {
          const img = resolveImage(p.image);
          return <article key={p.id} className={`adm-row${flashId === p.id ? ' flash' : ''}`} data-testid={`row-product-${p.id}`}>
            <div className="adm-thumb">{img ? <img src={img} alt="" /> : <Package size={20} />}</div>
            <div><span className="adm-pill">{p.category === 'bean' ? 'Bean' : 'Machine'}</span><h3>{p.name}</h3>
              <div className="adm-meta"><code dir="ltr">{p.id}</code>{p.origin && <span>{p.origin}</span>}{p.bagSize && <span>{p.bagSize}</span>}</div></div>
            <div className="adm-price" data-testid={`text-price-${p.id}`}>{kwd(p.price)}</div>
            <div className="adm-row-actions">
              <button className="adm-btn sm" onClick={() => setEditor({ kind: 'product', original: p })} data-testid={`button-edit-${p.id}`}><Pencil size={13} />Edit</button>
              <button className="adm-btn sm danger" onClick={() => setToDelete({ id: p.id, name: p.name, kind: 'product' })} aria-label={`Delete ${p.name}`} data-testid={`button-delete-${p.id}`}><Trash2 size={13} /></button>
            </div>
          </article>;
        }) : shownBundles.map(b => <article key={b.id} className={`adm-row${flashId === b.id ? ' flash' : ''}`} data-testid={`row-bundle-${b.id}`}>
          <div className="adm-thumb"><Package size={20} /></div>
          <div><span className="adm-pill">Bundle · {b.items.length} items</span><h3>{b.name}</h3>
            <div className="adm-meta"><code dir="ltr">{b.id}</code><span>{b.items.join(', ')}</span></div></div>
          <div className="adm-price" data-testid={`text-price-${b.id}`}><small>{kwd(b.regular)}</small>{kwd(b.price)}</div>
          <div className="adm-row-actions">
            <button className="adm-btn sm" onClick={() => setEditor({ kind: 'bundle', original: b })} data-testid={`button-edit-${b.id}`}><Pencil size={13} />Edit</button>
            <button className="adm-btn sm danger" onClick={() => setToDelete({ id: b.id, name: b.name, kind: 'bundle' })} aria-label={`Delete ${b.name}`} data-testid={`button-delete-${b.id}`}><Trash2 size={13} /></button>
          </div>
        </article>)}
      </div>}

    {editor && <EditorPanel editor={editor} taken={taken} onClose={() => setEditor(null)} onSaved={(id, created) => {
      setEditor(null); setFlashId(id); window.setTimeout(() => setFlashId(null), 1500);
      notify(created ? 'Created and published to the storefront.' : 'Changes saved and published.');
    }} />}
    {toDelete && <ConfirmDelete target={toDelete} onCancel={() => setToDelete(null)} onDone={(ok, msg) => { setToDelete(null); notify(msg, !ok); }} />}
    {toast && <div className={`adm-toast${toast.error ? ' error' : ''}`} role="status" aria-live="polite" data-testid="text-toast">{toast.error ? <AlertTriangle size={14} /> : <Check size={14} />}{toast.msg}</div>}
  </Shell>;
}
