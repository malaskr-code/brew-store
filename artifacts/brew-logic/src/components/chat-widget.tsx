import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from '@/lib/navigation';
import { MessageCircle, Send, X } from 'lucide-react';
import { sendChatMessage, type ChatMessage } from '@workspace/api-client-react';
import type { CatalogItem } from '@workspace/brew-catalog';
import { useCatalog } from '@/lib/catalog';
import './chat-widget.css';

type StoredMessage = ChatMessage & { failed?: boolean };
const STORAGE_KEY = 'brew-chat-conversation';
const text = {
  en: {
    title: 'Brew Assistant', open: 'Open shop assistant', close: 'Close assistant',
    placeholder: 'Ask about coffee or our products...', send: 'Send message', typing: 'Thinking...',
    disclaimer: 'AI assistant. Answers may contain mistakes.',
    busy: "I'm busy right now. Try again in a minute.",
    unavailable: 'The assistant is unavailable right now. Please try again later.',
    starters: ['Which machine grinds coffee?', 'Recommend a machine under 100 KWD', 'Which beans should I start with?'],
  },
  ar: {
    title: 'مساعد Brew', open: 'فتح مساعد المتجر', close: 'إغلاق المساعد',
    placeholder: 'اسأل عن القهوة أو منتجاتنا...', send: 'إرسال الرسالة', typing: 'جارٍ التفكير...',
    disclaimer: 'مساعد بالذكاء الاصطناعي. قد تحتوي الإجابات على أخطاء.',
    busy: 'أنا مشغول الآن. حاول مرة أخرى بعد دقيقة.',
    unavailable: 'المساعد غير متاح الآن. يرجى المحاولة لاحقاً.',
    starters: ['أي جهاز يطحن القهوة؟', 'رشّح لي جهازاً بسعر أقل من 100 KWD', 'بأي حبوب قهوة تنصحني أن أبدأ؟'],
  },
};

function readConversation(): StoredMessage[] {
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(saved)) return [];
    return saved.filter((item): item is StoredMessage => item && (item.role === 'user' || item.role === 'assistant')
      && typeof item.content === 'string' && item.content.length > 0 && item.content.length <= 5000);
  } catch { return []; }
}

type ChatState = { messages: StoredMessage[]; pending: boolean };
let chatState: ChatState = { messages: readConversation(), pending: false };
const listeners = new Set<(state: ChatState) => void>();

function updateConversation(messages: StoredMessage[], pending: boolean) {
  chatState = { messages, pending };
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch { /* Chat still works without storage. */ }
  listeners.forEach(listener => listener(chatState));
}

function linkedAnswer(content: string, onNavigate: () => void, catalogItems: CatalogItem[]): ReactNode {
  if (!catalogItems.length) return content;
  const productNames = [...catalogItems].sort((a, b) => b.name.length - a.name.length);
  const namePattern = new RegExp(`(${productNames.map(item => item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const productByName = new Map(catalogItems.map(item => [item.name.toLowerCase(), item]));
  return content.split(namePattern).map((part, index) => {
    const product = productByName.get(part.toLowerCase());
    return product
      ? <Link key={index} href={`/product/${product.id}`} onClick={onNavigate} data-testid={`link-chat-product-${product.id}`}>{part}</Link>
      : part;
  });
}

export function ChatWidget({ language, onNavigate }: { language: 'en' | 'ar'; onNavigate: () => void }) {
  const { catalogItems } = useCatalog();
  const t = text[language];
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ChatState>(chatState);
  const { messages, pending } = state;
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listeners.add(setState);
    setState(chatState);
    return () => { listeners.delete(setState); };
  }, []);
  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages, pending, open]);
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  const send = async (value: string) => {
    const content = value.trim();
    if (!content || content.length > 500 || chatState.pending) return;
    setInput('');
    const next: StoredMessage[] = [...messages, { role: 'user', content }];
    updateConversation(next, true);
    try {
      const history = next.filter(message => !message.failed).slice(-6).map(message => ({
        role: message.role, content: message.content.slice(0, 500),
      }));
      const response = await sendChatMessage({ messages: history }, {
        credentials: 'same-origin', signal: AbortSignal.timeout(35000),
      });
      if (!response.reply?.trim()) throw new Error('Empty reply');
      updateConversation([...next, { role: 'assistant', content: response.reply }], true);
    } catch (error) {
      const rateLimited = typeof error === 'object' && error !== null && 'status' in error && error.status === 429;
      updateConversation([...next, { role: 'assistant', content: rateLimited ? t.busy : t.unavailable, failed: true }], true);
    } finally {
      updateConversation(chatState.messages, false);
    }
  };

  const followProduct = () => { onNavigate(); setOpen(false); };
  return <>
    <button className="chat-launcher" onClick={() => setOpen(value => !value)} aria-label={open ? t.close : t.open}
      aria-expanded={open} aria-controls="brew-chat-window" data-testid="button-chat">
      {open ? <X size={21}/> : <MessageCircle size={21}/>}
    </button>
    {open && <section className="chat-window" id="brew-chat-window" role="dialog" aria-label={t.title}
      dir={language === 'ar' ? 'rtl' : 'ltr'} data-testid="chat-window">
      <header className="chat-heading"><h2>{t.title}</h2><button onClick={() => setOpen(false)} aria-label={t.close} data-testid="button-close-chat"><X size={16}/></button></header>
      <div className="chat-messages" role="log" aria-live="polite">
        {messages.length === 0 && <div className="chat-starters">{t.starters.map((question, index) =>
          <button key={question} onClick={() => void send(question)} disabled={pending} data-testid={`button-chat-starter-${index}`}>{question}</button>)}</div>}
        {messages.map((message, index) => <div key={index} className={`chat-bubble ${message.role}${message.failed ? ' chat-error' : ''}`} dir="auto" data-testid={`chat-message-${index}`}>
          {message.role === 'assistant' ? linkedAnswer(message.content, followProduct, catalogItems) : message.content}
        </div>)}
        {pending && <div className="chat-typing" role="status" data-testid="chat-typing"><span/><span/><span/><small>{t.typing}</small></div>}
        <div ref={endRef}/>
      </div>
      <form className="chat-form" onSubmit={event => { event.preventDefault(); void send(input); }}>
        <textarea ref={inputRef} value={input} maxLength={500} rows={2} onChange={event => setInput(event.target.value)}
          placeholder={t.placeholder} aria-label={t.placeholder} disabled={pending} data-testid="input-chat"
          onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(input); } }}/>
        <button type="submit" disabled={pending || !input.trim()} aria-label={t.send} data-testid="button-chat-send"><Send size={17}/></button>
      </form>
      <div className="chat-footnote"><span>{t.disclaimer}</span><small>{input.length}/500</small></div>
    </section>}
  </>;
}
