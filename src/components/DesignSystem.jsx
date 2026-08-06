import React from 'react';
import { ArrowRightIcon, InfoIcon, SparklesIcon } from './Icons.jsx';

const cx = (...values) => values.filter(Boolean).join(' ');

export function Button({
  children,
  icon: Icon,
  iconPosition = 'start',
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingLabel = 'Cargando…',
  className = '',
  type = 'button',
  disabled,
  ...props
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      className={cx('ds-button', `ds-button--${variant}`, `ds-button--${size}`, className)}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <span className="ds-button__spinner" aria-hidden="true" />}
      {!loading && Icon && iconPosition === 'start' && <Icon width="19" height="19" aria-hidden="true" />}
      <span>{loading ? loadingLabel : children}</span>
      {!loading && Icon && iconPosition === 'end' && <Icon width="19" height="19" aria-hidden="true" />}
    </button>
  );
}

export function PrimaryButton({ children, icon: Icon = ArrowRightIcon, className = '', ...props }) {
  return (
    <Button variant="primary" icon={Icon} iconPosition="end" className={className} {...props}>
      {children}
    </Button>
  );
}

export function SecondaryButton({ children, icon: Icon, className = '', ...props }) {
  return (
    <Button variant="secondary" icon={Icon} className={className} {...props}>
      {children}
    </Button>
  );
}

export function Card({
  children,
  as: Tag = 'section',
  tone = 'section',
  padding = 'md',
  interactive = false,
  className = '',
  ...props
}) {
  return (
    <Tag
      className={cx(
        'ds-card',
        `ds-card--${tone}`,
        `ds-card--padding-${padding}`,
        interactive && 'ds-card--interactive',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function Eyebrow({ children, className = '' }) {
  return <p className={cx('ds-eyebrow', className)}>{children}</p>;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  headingLevel = 2,
  className = '',
}) {
  const Heading = `h${Math.min(6, Math.max(1, headingLevel))}`;
  return (
    <header className={cx('ds-section-header', className)}>
      <div className="min-w-0">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <Heading className="ds-section-header__title">{title}</Heading>
        {description && <p className="ds-section-header__description">{description}</p>}
      </div>
      {action && <div className="ds-section-header__action">{action}</div>}
    </header>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <header className={cx('ds-page-header', className)}>
      <div className="min-w-0">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="ds-page-header__title">{title}</h1>
        {description && <p className="ds-page-header__description">{description}</p>}
      </div>
      {action && <div className="ds-page-header__action">{action}</div>}
    </header>
  );
}

const NOTICE_ICONS = {
  info: InfoIcon,
  success: SparklesIcon,
  warning: InfoIcon,
  error: InfoIcon,
  neutral: InfoIcon,
};

export function StatusNotice({
  title,
  children,
  tone = 'info',
  icon: Icon = NOTICE_ICONS[tone] || InfoIcon,
  action,
  className = '',
  role,
}) {
  const resolvedRole = role || (tone === 'error' ? 'alert' : 'status');
  return (
    <div className={cx('ds-notice', `ds-notice--${tone}`, className)} role={resolvedRole}>
      {Icon && <span className="ds-notice__icon" aria-hidden="true"><Icon width="20" height="20" /></span>}
      <div className="ds-notice__body">
        {title && <p className="ds-notice__title">{title}</p>}
        {children && <div className="ds-notice__content">{children}</div>}
      </div>
      {action && <div className="ds-notice__action">{action}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  className = '',
}) {
  return (
    <div className={cx('ds-empty-state', className)}>
      {Icon && <span className="ds-empty-state__icon" aria-hidden="true"><Icon width="26" height="26" /></span>}
      <h2 className="ds-empty-state__title">{title}</h2>
      {description && <p className="ds-empty-state__description">{description}</p>}
      {action && <div className="ds-empty-state__action">{action}</div>}
    </div>
  );
}

export function SegmentedControl({
  label,
  options,
  value,
  onChange,
  className = '',
  size = 'md',
}) {
  return (
    <fieldset className={cx('ds-segmented-wrap', className)}>
      {label && <legend className="ds-segmented__label">{label}</legend>}
      <div className={cx('ds-segmented', `ds-segmented--${size}`)}>
        {options.map(option => {
          const selected = option.value === value;
          const OptionIcon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              className="ds-segmented__option"
              data-selected={selected ? 'true' : 'false'}
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              disabled={option.disabled}
            >
              {OptionIcon && <OptionIcon width="17" height="17" aria-hidden="true" />}
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ActionMenu({ label = 'Más opciones', items = [], className = '' }) {
  return (
    <details className={cx('ds-action-menu', className)}>
      <summary className="ds-action-menu__trigger">{label}</summary>
      <div className="ds-action-menu__panel" role="menu">
        {items.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id || item.label}
              type="button"
              role="menuitem"
              className={cx('ds-action-menu__item', item.danger && 'ds-action-menu__item--danger')}
              onClick={item.onClick}
              disabled={item.disabled}
            >
              {Icon && <Icon width="18" height="18" aria-hidden="true" />}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </details>
  );
}

export function ActionCard({ title, description, icon: Icon, onClick, badge }) {
  return (
    <button type="button" onClick={onClick} className="ds-action-card group">
      <span className="ds-action-card__icon">{Icon && <Icon width="22" height="22" aria-hidden="true" />}</span>
      <span className="min-w-0 flex-1 text-left">
        <span className="flex items-center gap-2">
          <span className="ds-action-card__title">{title}</span>
          {badge > 0 && <span className="ds-badge ds-badge--accent">{badge}</span>}
        </span>
        <span className="ds-action-card__description">{description}</span>
      </span>
      <ArrowRightIcon width="18" height="18" className="ds-action-card__arrow" aria-hidden="true" />
    </button>
  );
}
