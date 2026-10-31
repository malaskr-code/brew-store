import { ArrowDown, Check } from 'lucide-react';
import './_group.css';

function BrandMark({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 38 44" fill="none" aria-hidden="true">
    <path d="M7 5h24l-2.3 4H9.3L7 5Z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="m9 10 4 15c.5 2 2.1 3.3 4 3.3h4c1.9 0 3.5-1.3 4-3.3l4-15" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M16 28.5v4.2m6-4.2v4.2M11 36h16M19 32.7v3.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M13 18h12" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2"/>
  </svg>;
}

export function Current() {
  return <section className="blhero-stage" aria-label="Current Brew homepage hero">
    <div className="blhero-container blhero-current">
      <div className="blhero-current-copy">
        <div className="blhero-eyebrow">Good coffee is a set of decisions</div>
        <h1>Engineer<br/><em>your cup.</em></h1>
        <p className="blhero-current-text">A thoughtful edit of coffee tools and locally roasted beans for people who like knowing how their coffee gets made.</p>
        <a href="#products" className="blhero-current-cta">Shop Now <ArrowDown size={15}/></a>
        <div className="blhero-current-note"><span className="blhero-current-check"><Check size={13}/></span>Tools for better mornings, chosen with care</div>
      </div>
      <div className="blhero-current-art" role="img" aria-label="Brew logo">
        <div className="blhero-current-lockup"><BrandMark className="blhero-current-mark"/><span>Brew</span></div>
      </div>
    </div>
  </section>;
}
