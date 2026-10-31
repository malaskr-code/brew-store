import { useEffect, useRef, type ReactNode } from 'react';
import { ClerkProvider, SignIn, SignUp, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { useQueryClient } from '@tanstack/react-query';
import { getGetAdminCatalogQueryKey } from '@workspace/api-client-react';
import { Link, useLocation } from '@/lib/navigation';
import './admin-auth.css';

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = process.env.NEXT_PUBLIC_CLERK_PROXY_URL || undefined;
const basePath = '';
function stripBase(path: string): string {
  return path;
}

function AdminCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const previous = useRef<string | null | undefined>(undefined);
  useEffect(() => addListener(({ user }) => {
    const id = user?.id ?? null;
    if (previous.current !== undefined && previous.current !== id) {
      queryClient.removeQueries({ queryKey: getGetAdminCatalogQueryKey() });
    }
    previous.current = id;
  }), [addListener, queryClient]);
  return null;
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    document.documentElement.classList.toggle('dark', localStorage.getItem('brew-theme') === 'dark');
    document.documentElement.dir = localStorage.getItem('brew-language') === 'ar' ? 'rtl' : 'ltr';
  }, []);
  return <ClerkProvider
    publishableKey={clerkPubKey}
    proxyUrl={clerkProxyUrl}
    signInUrl={`${basePath}/sign-in`}
    signUpUrl={`${basePath}/sign-up`}
    routerPush={to => setLocation(stripBase(to))}
    routerReplace={to => setLocation(stripBase(to), { replace: true })}
    appearance={{
      theme: 'simple',
      options: { logoPlacement: 'inside', logoLinkUrl: basePath || '/', logoImageUrl: `${window.location.origin}${basePath}/logo.svg` },
      variables: {
        colorPrimary: 'var(--olive)', colorForeground: 'var(--ink)', colorMutedForeground: 'var(--muted)',
        colorBackground: 'var(--surface)', colorInput: 'var(--paper)', colorInputForeground: 'var(--ink)',
        colorDanger: '#b04435', colorNeutral: 'var(--ink)', fontFamily: "'Inter', 'IBM Plex Sans Arabic', sans-serif", borderRadius: '14px',
      },
      elements: {
        rootBox: 'brew-auth-root', cardBox: 'brew-auth-card', card: 'brew-auth-inner', footer: 'brew-auth-inner',
        headerTitle: 'brew-auth-strong', headerSubtitle: 'brew-auth-muted', socialButtonsBlockButtonText: 'brew-auth-strong',
        formFieldLabel: 'brew-auth-strong', footerActionLink: 'brew-auth-link', footerActionText: 'brew-auth-muted',
        dividerText: 'brew-auth-muted', identityPreviewEditButton: 'brew-auth-link', formFieldSuccessText: 'brew-auth-strong', alertText: 'brew-auth-strong',
      },
    }}
    localization={{
      signIn: { start: { title: 'Brew administration', subtitle: 'Sign in with your authorized store email' } },
      signUp: { start: { title: 'Create your store account', subtitle: 'Only the authorized store email can edit the catalog' } },
    }}>
    <AdminCacheInvalidator/>
    {children}
  </ClerkProvider>;
}

export function SignInPage() {
  return <main className="brew-auth-page"><Link href="/" className="brew-auth-back">← Back to Brew</Link>
    <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} forceRedirectUrl={`${basePath}/admin`}/>
  </main>;
}
export function SignUpPage() {
  return <main className="brew-auth-page"><Link href="/" className="brew-auth-back">← Back to Brew</Link>
    <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} forceRedirectUrl={`${basePath}/admin`}/>
  </main>;
}
