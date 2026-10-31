import { ArrowRight, Check } from 'lucide-react';
import './_group.css';

function BrandMark({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 38 44" fill="none" aria-hidden="true">
    <path d="M7 5h24l-2.3 4H9.3L7 5Z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="m9 10 4 15c.5 2 2.1 3.3 4 3.3h4c1.9 0 3.5-1.3 4-3.3l4-15" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M16 28.5v4.2m6-4.2v4.2M11 36h16M19 32.7v3.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M13 18h12" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2"/>
  </svg>;
}

export function Refined() {
  return <section className="blhero-stage" aria-label="Brew homepage hero">
    <div className="blhero-container blhero-refined">
      <div className="blhero-refined-copy">
        <div className="blhero-eyebrow">Good coffee is a set of decisions</div>
        <h1>Engineer<br/><em>your cup.</em></h1>
        <p className="blhero-refined-text">A thoughtful edit of coffee tools and locally roasted beans for people who like knowing how their coffee gets made.</p>
        <div className="blhero-refined-actions">
          <a href="#products" className="blhero-refined-cta">Shop Now <ArrowRight size={15}/></a>
        </div>
        <div className="blhero-refined-note"><Check size={14}/>Tools for better mornings, chosen with care</div>
      </div>

      <div className="blhero-card" role="img" aria-label="Brew brew map: grind, water, and time">
        <div className="blhero-card-top">
          <div className="blhero-card-brand"><BrandMark/><span>Brew</span></div>
          <span className="blhero-card-index">BREW MAP&nbsp; / &nbsp;01</span>
        </div>
        <p className="blhero-card-kicker">A BETTER CUP, BY DESIGN</p>
        <div className="blhero-dial">
          <div className="blhero-dial-core"><BrandMark className="blhero-dial-mark"/></div>
          <div className="blhero-dial-node blhero-node-grind"><b>01</b><span>GRIND</span></div>
          <div className="blhero-dial-node blhero-node-water"><b>02</b><span>WATER</span></div>
          <div className="blhero-dial-node blhero-node-time"><b>03</b><span>TIME</span></div>
        </div>
        <div className="blhero-card-foot">
          <div><small>THE DAILY RITUAL</small><strong>Measure what matters.</strong></div>
          <span className="blhero-card-markers" aria-hidden="true"><i/><i/><i/></span>
        </div>
      </div>
    </div>
  </section>;
}
