import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from '@/lib/navigation';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LogOut, Moon, Sun, User } from 'lucide-react';
import {
  getGetCustomerSessionQueryKey,
  useGetCustomerSession,
  useLoginCustomer,
  useLogoutCustomer,
  useSignupCustomer,
  type CustomerSession,
  type CustomerUser,
} from '@workspace/api-client-react';
import './customer-auth.css';

type Language = 'en' | 'ar';
type Theme = 'light' | 'dark';
const REQ = { credentials: 'same-origin' as RequestCredentials };

const text = {
  en: {
    loginTitle: 'Welcome back.', loginLead: 'Log in to keep your brewing setup within reach.',
    signupTitle: 'Open an account.', signupLead: 'A Brew account for considered home brewing in Kuwait.',
    name: 'Full name', email: 'Email', password: 'Password', passwordHint: 'At least 8 characters.',
    login: 'Log In', signup: 'Sign Up', loggingIn: 'Logging in…', signingUp: 'Creating account…',
    noAccount: 'New to Brew?', haveAccount: 'Already have an account?', back: 'Back to the shop',
    account: 'Account', logout: 'Log Out', loggingOut: 'Logging out…', signedInAs: 'Signed in as',
    show: 'Show password', hide: 'Hide password', theme: 'Toggle theme', lang: 'العربية',
    eyebrowLogin: 'Customer account', eyebrowSignup: 'New customer',
    note: 'Your session stays on this device for seven days.',
    eName: 'Please enter your name.', eNameLong: 'Name must be 100 characters or fewer.', eEmail: 'Please enter a valid email address.',
    ePass: 'Password must be at least 8 characters.', ePassLong: 'Password is too long. Use 72 bytes or fewer (shorter if using special characters).',
    email_in_use: 'An account with this email already exists.', invalid_credentials: 'Email or password is incorrect',
    validation: 'Please check your details and try again.', rate_limited: 'Too many attempts. Please wait a few minutes and try again.',
    unavailable: 'Accounts are unavailable right now. You can keep shopping as a guest.', generic: 'Something went wrong. Please try again.',
    logoutError: 'Could not log out. Please try again.', authDown: 'Accounts unavailable',
  },
  ar: {
    loginTitle: 'أهلاً بعودتك.', loginLead: 'سجّل الدخول لتبقى أدوات تحضيرك في متناولك.',
    signupTitle: 'أنشئ حسابك.', signupLead: 'حساب Brew لعشاق التحضير المنزلي في الكويت.',
    name: 'الاسم الكامل', email: 'البريد الإلكتروني', password: 'كلمة المرور', passwordHint: '٨ أحرف على الأقل.',
    login: 'تسجيل الدخول', signup: 'إنشاء حساب', loggingIn: 'جارٍ تسجيل الدخول…', signingUp: 'جارٍ إنشاء الحساب…',
    noAccount: 'جديد على Brew؟', haveAccount: 'لديك حساب بالفعل؟', back: 'العودة إلى المتجر',
    account: 'الحساب', logout: 'تسجيل الخروج', loggingOut: 'جارٍ تسجيل الخروج…', signedInAs: 'مسجّل باسم',
    show: 'إظهار كلمة المرور', hide: 'إخفاء كلمة المرور', theme: 'تبديل المظهر', lang: 'English',
    eyebrowLogin: 'حساب العميل', eyebrowSignup: 'عميل جديد',
    note: 'تبقى جلستك على هذا الجهاز لمدة سبعة أيام.',
    eName: 'يرجى إدخال اسمك.', eNameLong: 'يجب ألا يتجاوز الاسم ١٠٠ حرف.', eEmail: 'يرجى إدخال بريد إلكتروني صحيح.',
    ePass: 'يجب أن تتكون كلمة المرور من ٨ أحرف على الأقل.', ePassLong: 'كلمة المرور طويلة جداً. استخدم ٧٢ بايت أو أقل (أقصر عند استخدام أحرف خاصة).',
    email_in_use: 'يوجد حساب مسجّل بهذا البريد الإلكتروني.', invalid_credentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    validation: 'يرجى مراجعة بياناتك والمحاولة مرة أخرى.', rate_limited: 'محاولات كثيرة. يرجى الانتظار بضع دقائق ثم المحاولة.',
    unavailable: 'الحسابات غير متاحة حالياً. يمكنك متابعة التسوق كزائر.', generic: 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
    logoutError: 'تعذّر تسجيل الخروج. يرجى المحاولة مرة أخرى.', authDown: 'الحسابات غير متاحة',
  },
};
type Copy = typeof text.en;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordBytes = (p: string) => new TextEncoder().encode(p).length;
export const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;

function errorCode(err: unknown): string {
  const e = err as { status?: number; data?: { code?: string } | null } | null;
  const code = e?.data?.code;
  if (code === 'email_in_use' || code === 'invalid_credentials' || code === 'validation' || code === 'rate_limited' || code === 'unavailable') return code;
  if (code === 'cross_site') return 'generic';
  if (e?.status === 429) return 'rate_limited';
  if (e?.status === 401) return 'invalid_credentials';
  if (e?.status === 409) return 'email_in_use';
  if (e?.status === 400 || e?.status === 422) return 'validation';
  if (!e?.status || e.status >= 500) return 'unavailable';
  return 'generic';
}

/* ---------- Provider ---------- */
type Ctx = {
  user: CustomerUser | null; isLoading: boolean; isUnavailable: boolean;
  login: (email: string, password: string) => Promise<CustomerSession>;
  signup: (name: string, email: string, password: string) => Promise<CustomerSession>;
  logout: () => Promise<void>;
  loginPending: boolean; signupPending: boolean; logoutPending: boolean;
  refresh: () => void;
};
const CustomerAuthContext = createContext<Ctx | null>(null);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const key = getGetCustomerSessionQueryKey();
  const session = useGetCustomerSession({ query: { queryKey: key, retry: 1, staleTime: 60_000, refetchInterval: 60_000, throwOnError: false }, request: REQ });
  const loginM = useLoginCustomer({ request: REQ });
  const signupM = useSignupCustomer({ request: REQ });
  const logoutM = useLogoutCustomer({ request: REQ });
  const loginRef = useRef(loginM.mutateAsync); loginRef.current = loginM.mutateAsync;
  const signupRef = useRef(signupM.mutateAsync); signupRef.current = signupM.mutateAsync;
  const logoutRef = useRef(logoutM.mutateAsync); logoutRef.current = logoutM.mutateAsync;

  const login = useCallback(async (email: string, password: string) => {
    const res = await loginRef.current({ data: { email, password } });
    queryClient.setQueryData(getGetCustomerSessionQueryKey(), res);
    return res;
  }, [queryClient]);
  const signup = useCallback(async (name: string, email: string, password: string) => {
    const res = await signupRef.current({ data: { name, email, password } });
    queryClient.setQueryData(getGetCustomerSessionQueryKey(), res);
    return res;
  }, [queryClient]);
  const logout = useCallback(async () => {
    await logoutRef.current();
    queryClient.setQueryData<CustomerSession>(getGetCustomerSessionQueryKey(), { user: null });
    queryClient.removeQueries({ predicate: q => q.queryKey.some(k => typeof k === 'string' && k.startsWith('/api/customer')) });
    void queryClient.invalidateQueries({ queryKey: getGetCustomerSessionQueryKey() });
  }, [queryClient]);
  const refresh = useCallback(() => { void queryClient.invalidateQueries({ queryKey: getGetCustomerSessionQueryKey() }); }, [queryClient]);

  const value = useMemo<Ctx>(() => ({
    user: session.data?.user ?? null, isLoading: session.isLoading, isUnavailable: session.isError && !session.data,
    login, signup, logout, refresh,
    loginPending: loginM.isPending, signupPending: signupM.isPending, logoutPending: logoutM.isPending,
  }), [session.data, session.isLoading, session.isError, login, signup, logout, refresh, loginM.isPending, signupM.isPending, logoutM.isPending]);
  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth must be used inside CustomerAuthProvider');
  return ctx;
}

/* ---------- Account button ---------- */
export function CustomerAccountButton({ language }: { language: Language }) {
  const t = text[language];
  const { user, isLoading, isUnavailable, logout, logoutPending } = useCustomerAuth();
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState('');
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ left: number; width: number } | null>(null);
  const [location] = useLocation();
  useEffect(() => { setOpen(false); }, [location]);
  useLayoutEffect(() => {
    if (!open) return;
    const positionMenu = () => {
      if (!wrap.current || !menu.current) return;
      const anchor = wrap.current.getBoundingClientRect();
      const viewportWidth = document.documentElement.clientWidth;
      const width = Math.min(menu.current.offsetWidth, viewportWidth - 24);
      const preferred = language === 'ar' ? anchor.left : anchor.right - width;
      const viewportLeft = Math.max(12, Math.min(preferred, viewportWidth - width - 12));
      const left = viewportLeft - anchor.left;
      setMenuPosition(previous => previous?.left === left && previous.width === width ? previous : { left, width });
    };
    positionMenu();
    window.addEventListener('resize', positionMenu);
    window.addEventListener('scroll', positionMenu, true);
    return () => {
      window.removeEventListener('resize', positionMenu);
      window.removeEventListener('scroll', positionMenu, true);
    };
  }, [open, language, user?.id, user?.name]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (e.target instanceof Node && !wrap.current?.contains(e.target)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); btn.current?.focus(); } };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
  const doLogout = async () => {
    setErr('');
    try { await logout(); setOpen(false); } catch { setErr(t.logoutError); }
  };
  const label = user ? `${t.account}: ${user.name}` : t.account;
  return <div className="ca-account" ref={wrap}>
    <button ref={btn} type="button" className={`icon-button ca-account-trigger${user ? ' signed-in' : ''}`}
      onClick={() => setOpen(o => !o)} aria-haspopup="menu" aria-expanded={open} aria-controls="ca-account-menu"
      aria-label={label} aria-busy={isLoading} data-testid="button-account">
      <User size={16} strokeWidth={1.8} aria-hidden="true"/>
      {user && <span className="ca-first-name" data-testid="text-account-first-name">{firstName(user.name)}</span>}
    </button>
    {open && <div ref={menu} className="ca-menu" id="ca-account-menu" role="menu" aria-label={t.account}
      style={menuPosition ? { insetInlineEnd: 'auto', insetInlineStart: 'auto', right: 'auto', left: menuPosition.left, width: menuPosition.width, minWidth: 0 } : undefined}>
      {user ? <>
        <div className="ca-menu-head" role="presentation">
          <small>{t.signedInAs}</small>
          <strong data-testid="text-account-name">{user.name}</strong>
          <span><bdi>{user.email}</bdi></span>
        </div>
        <button type="button" role="menuitem" className="ca-menu-item" onClick={doLogout} disabled={logoutPending} data-testid="button-logout">
          <LogOut size={14} aria-hidden="true"/>{logoutPending ? t.loggingOut : t.logout}
        </button>
        {err && <p className="ca-menu-error" role="alert">{err}</p>}
      </> : <>
        {isUnavailable && <p className="ca-menu-note">{t.authDown}</p>}
        <Link href="/login" role="menuitem" className="ca-menu-item" data-testid="link-account-login">{t.login}</Link>
        <Link href="/signup" role="menuitem" className="ca-menu-item" data-testid="link-account-signup">{t.signup}</Link>
      </>}
    </div>}
  </div>;
}

/* ---------- Auth pages ---------- */
function readPref<T extends string>(key: string, allowed: T[], fallback: T): T {
  try { const v = window.localStorage.getItem(key); return allowed.includes(v as T) ? (v as T) : fallback; } catch { return fallback; }
}
function writePref(key: string, v: string) { try { window.localStorage.setItem(key, v); } catch { /* optional */ } }

function usePrefs() {
  const [language, setLanguage] = useState<Language>(() => readPref('brew-language', ['en', 'ar'], 'en'));
  const [theme, setTheme] = useState<Theme>(() => readPref('brew-theme', ['light', 'dark'], 'light'));
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    writePref('brew-language', language);
  }, [language]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    writePref('brew-theme', theme);
  }, [theme]);
  return { language, setLanguage, theme, setTheme };
}

function Mark() {
  return <svg className="ca-mark" viewBox="0 0 38 44" fill="none" aria-hidden="true">
    <path d="M7 5h24l-2.3 4H9.3L7 5Z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="m9 10 4 15c.5 2 2.1 3.3 4 3.3h4c1.9 0 3.5-1.3 4-3.3l4-15" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M16 28.5v4.2m6-4.2v4.2M11 36h16M19 32.7v3.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M13 18h12" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2"/>
  </svg>;
}

function AuthShell({ mode, children, t, prefs }: { mode: 'login' | 'signup'; children: ReactNode; t: Copy; prefs: ReturnType<typeof usePrefs> }) {
  const { language, setLanguage, theme, setTheme } = prefs;
  const Back = language === 'ar' ? ArrowRight : ArrowLeft;
  return <div className="ca-page">
    <header className="ca-top">
      <Link href="/" className="ca-back" data-testid="link-return-store"><Back size={14} aria-hidden="true"/>{t.back}</Link>
      <div className="ca-controls">
        <button type="button" className="icon-button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={t.theme} data-testid="button-auth-theme">
          {theme === 'light' ? <Moon size={16}/> : <Sun size={16}/>}
        </button>
        <button type="button" className="icon-button" onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} aria-label={t.lang} data-testid="button-auth-language">
          <span className="ca-lang">{language === 'en' ? 'ع' : 'EN'}</span>
        </button>
      </div>
    </header>
    <main className="ca-grid">
      <aside className="ca-art" aria-hidden="true">
        <div className="ca-rings"/>
        <div className="ca-lockup"><Mark/><span>Brew</span></div>
        <small>{language === 'ar' ? 'اضبط · اسكب · كرر' : 'CALIBRATE · POUR · REPEAT'}</small>
      </aside>
      <section className="ca-card">
        <div className="ca-eyebrow">{mode === 'signup' ? t.eyebrowSignup : t.eyebrowLogin}</div>
        <h1>{mode === 'login' ? t.loginTitle : t.signupTitle}</h1>
        <p className="ca-lead">{mode === 'login' ? t.loginLead : t.signupLead}</p>
        {children}
      </section>
    </main>
  </div>;
}

type Errors = Partial<Record<'name' | 'email' | 'password', string>>;

function validate(t: Copy, f: { name?: string; email: string; password: string }, requireName: boolean): Errors {
  const e: Errors = {};
  if (requireName) {
    if (!f.name?.trim()) e.name = t.eName;
    else if (f.name.trim().length > 100) e.name = t.eNameLong;
  }
  if (!EMAIL_RE.test(f.email.trim()) || f.email.trim().length > 254) e.email = t.eEmail;
  if (Array.from(f.password).length < 8) e.password = t.ePass;
  else if (passwordBytes(f.password) > 72) e.password = t.ePassLong;
  return e;
}

function Field({ id, label, type, value, onChange, error, autoComplete, testId, hint, dirLtr }: {
  id: string; label: string; type: string; value: string; onChange: (v: string) => void; error?: string;
  autoComplete: string; testId: string; hint?: string; dirLtr?: boolean;
}) {
  return <div className={`ca-field${error ? ' has-error' : ''}`}>
    <label htmlFor={id}>{label}</label>
    <input id={id} type={type} value={value} onChange={e => onChange(e.currentTarget.value)} autoComplete={autoComplete}
      dir={dirLtr ? 'ltr' : undefined} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : undefined} data-testid={testId}/>
    {error ? <span className="ca-error" id={`${id}-err`}>{error}</span> : hint ? <span className="ca-hint">{hint}</span> : null}
  </div>;
}

function PasswordField({ id, t, value, onChange, error, autoComplete, hint }: {
  id: string; t: Copy; value: string; onChange: (v: string) => void; error?: string; autoComplete: string; hint?: string;
}) {
  const [show, setShow] = useState(false);
  return <div className={`ca-field${error ? ' has-error' : ''}`}>
    <label htmlFor={id}>{t.password}</label>
    <div className="ca-pass">
      <input id={id} type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.currentTarget.value)}
        autoComplete={autoComplete} dir="ltr" aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : undefined} data-testid="input-password"/>
      <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? t.hide : t.show} aria-pressed={show} data-testid="button-toggle-password">
        {show ? <EyeOff size={15}/> : <Eye size={15}/>}
      </button>
    </div>
    {error ? <span className="ca-error" id={`${id}-err`}>{error}</span> : hint ? <span className="ca-hint">{hint}</span> : null}
  </div>;
}

export function CustomerLoginPage() {
  const prefs = usePrefs();
  const t = text[prefs.language];
  const { login, loginPending } = useCustomerAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (loginPending) return;
    const v = validate(t, { email, password }, false);
    setErrors(v); setFormError('');
    if (Object.keys(v).length) return;
    try { await login(email.trim(), password); navigate('/'); }
    catch (err) { setFormError(errorCode(err)); }
  };
  return <AuthShell mode="login" t={t} prefs={prefs}>
    <form className="ca-form" onSubmit={submit} noValidate data-testid="form-login">
      {formError && <p className="ca-alert" role="alert" data-testid="text-auth-error">{t[formError as keyof Copy]}</p>}
      <Field id="login-email" label={t.email} type="email" value={email} onChange={setEmail} error={errors.email} autoComplete="email" testId="input-email" dirLtr/>
      <PasswordField id="login-password" t={t} value={password} onChange={setPassword} error={errors.password} autoComplete="current-password"/>
      <button type="submit" className="primary-button ca-submit" disabled={loginPending} aria-busy={loginPending} data-testid="button-submit-login">
        {loginPending ? t.loggingIn : t.login}
      </button>
      <p className="ca-switch">{t.noAccount} <Link href="/signup" data-testid="link-to-signup">{t.signup}</Link></p>
      <p className="ca-note">{t.note}</p>
    </form>
  </AuthShell>;
}

export function CustomerSignupPage() {
  const prefs = usePrefs();
  const t = text[prefs.language];
  const { signup, signupPending } = useCustomerAuth();
  const [, navigate] = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (signupPending) return;
    const v = validate(t, { name, email, password }, true);
    setErrors(v); setFormError('');
    if (Object.keys(v).length) return;
    try { await signup(name.trim(), email.trim(), password); navigate('/'); }
    catch (err) { setFormError(errorCode(err)); }
  };
  return <AuthShell mode="signup" t={t} prefs={prefs}>
    <form className="ca-form" onSubmit={submit} noValidate data-testid="form-signup">
      {formError && <p className="ca-alert" role="alert" data-testid="text-auth-error">{t[formError as keyof Copy]}</p>}
      <Field id="signup-name" label={t.name} type="text" value={name} onChange={setName} error={errors.name} autoComplete="name" testId="input-name"/>
      <Field id="signup-email" label={t.email} type="email" value={email} onChange={setEmail} error={errors.email} autoComplete="email" testId="input-email" dirLtr/>
      <PasswordField id="signup-password" t={t} value={password} onChange={setPassword} error={errors.password} autoComplete="new-password" hint={t.passwordHint}/>
      <button type="submit" className="primary-button ca-submit" disabled={signupPending} aria-busy={signupPending} data-testid="button-submit-signup">
        {signupPending ? t.signingUp : t.signup}
      </button>
      <p className="ca-switch">{t.haveAccount} <Link href="/login" data-testid="link-to-login">{t.login}</Link></p>
    </form>
  </AuthShell>;
}
