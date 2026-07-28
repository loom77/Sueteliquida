import React from 'react';
import { ArrowRightIcon } from './Icons.jsx';

export function PrimaryButton({ children, icon: Icon = ArrowRightIcon, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`primy-button primy-button-primary ${className}`}
      {...props}
    >
      <span>{children}</span>
      {Icon && <Icon width="19" height="19" aria-hidden="true"/>}
    </button>
  );
}

export function SecondaryButton({ children, icon: Icon, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`primy-button primy-button-secondary ${className}`}
      {...props}
    >
      {Icon && <Icon width="19" height="19" aria-hidden="true"/>}
      <span>{children}</span>
    </button>
  );
}

export function ActionCard({ title, description, icon: Icon, onClick, badge }) {
  return (
    <button type="button" onClick={onClick} className="primy-action-card group">
      <span className="primy-action-icon">{Icon && <Icon width="22" height="22" aria-hidden="true"/>}</span>
      <span className="min-w-0 flex-1 text-left">
        <span className="flex items-center gap-2">
          <span className="block font-display text-base font-semibold text-primary">{title}</span>
          {badge > 0 && <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-primary">{badge}</span>}
        </span>
        <span className="mt-1 block text-sm leading-6 text-secondary">{description}</span>
      </span>
      <ArrowRightIcon width="18" height="18" className="shrink-0 text-primy-700 transition-transform group-hover:translate-x-1" aria-hidden="true"/>
    </button>
  );
}

export function Eyebrow({ children }) {
  return <p className="primy-eyebrow">{children}</p>;
}
