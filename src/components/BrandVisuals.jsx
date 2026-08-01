import React, { useId } from 'react';

export function PrimyMark({ className = '', title = 'Primy' }) {
  const gradientId = `primyMarkGradient-${useId().replace(/:/g, '')}`;
  return (
    <svg className={className} viewBox="0 0 64 64" role="img" aria-label={title}>
      <defs>
        <linearGradient id={gradientId} x1="7" y1="5" x2="58" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#18A566"/>
          <stop offset=".56" stopColor="#0B7A49"/>
          <stop offset="1" stopColor="#075438"/>
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="58" height="58" rx="18" fill={`url(#${gradientId})`}/>
      <path d="M14.5 25.5c0-7.8 6.2-13.8 14-13.8 1.3 0 2.6.2 3.8.5 1.3-.4 2.6-.5 4-.5 7.8 0 13.8 6 13.8 13.8 0 5.7-3.2 10.7-8.1 13.2l-9.8 11.1-9.7-11.1c-4.9-2.5-8-7.5-8-13.2Z" fill="#FFFDF7"/>
      <circle cx="26" cy="25.5" r="7.2" fill="#DDF7E8"/>
      <circle cx="38.5" cy="25.5" r="7.2" fill="#DDF7E8"/>
      <circle cx="27" cy="26" r="3.25" fill="#075438"/>
      <circle cx="37.5" cy="26" r="3.25" fill="#075438"/>
      <circle cx="28.1" cy="24.8" r="1.05" fill="#fff"/>
      <circle cx="38.6" cy="24.8" r="1.05" fill="#fff"/>
      <path d="m32.25 29.2 4.1 4.1-4.1 3.1-4.1-3.1 4.1-4.1Z" fill="#F4C84A"/>
      <path d="M21.5 39.1h12.8c5.1 0 8.2 2.4 8.2 6.2 0 4-3.2 6.5-8.4 6.5h-4.6V56h-8V39.1Zm8 6v2.2h4.1c1.1 0 1.8-.4 1.8-1.1 0-.7-.7-1.1-1.9-1.1h-4Z" fill="#075438"/>
      <circle cx="50.5" cy="13.5" r="4.5" fill="#F4C84A"/>
      <path d="M49.1 13.5h2.8M50.5 12.1v2.8" stroke="#6B4A00" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

export function PrimyWordmark({ compact = false, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <PrimyMark className={compact ? 'h-10 w-10' : 'h-12 w-12'}/>
      <div className="leading-none">
        <p className={`${compact ? 'text-lg' : 'text-xl'} font-display font-bold tracking-[-0.03em] text-primary`}>Primy</p>
        {!compact && <p className="mt-1 text-xs font-medium text-secondary">Tu guía inteligente de juego</p>}
      </div>
    </div>
  );
}


const MASCOT_VARIANTS = {
  welcome: {
    src: '/mascot/primy-welcome.webp',
    label: 'Primy te da la bienvenida',
    motion: 'primy-mascot-float',
    surface: 'from-primy-50 via-ivory to-cream',
    accent: 'bg-gold',
  },
  helper: {
    src: '/mascot/primy-helper.webp',
    label: 'Primy te guía paso a paso',
    motion: 'primy-mascot-helper',
    surface: 'from-sky/60 via-ivory to-primy-50',
    accent: 'bg-sky',
  },
  thinking: {
    src: '/mascot/primy-thinking.webp',
    label: 'Primy está preparando la jugada',
    motion: 'primy-mascot-thinking',
    surface: 'from-lavender via-ivory to-primy-50',
    accent: 'bg-lavender',
  },
  celebration: {
    src: '/mascot/primy-celebration.webp',
    label: 'Primy celebra contigo',
    motion: 'primy-mascot-celebration',
    surface: 'from-amber-50 via-ivory to-peach/50',
    accent: 'bg-gold',
  },
  empty: {
    src: '/mascot/primy-empty.webp',
    label: 'Primy busca tus jugadas',
    motion: 'primy-mascot-empty',
    surface: 'from-sky/40 via-ivory to-primy-50',
    accent: 'bg-sky',
  },
  responsible: {
    src: '/mascot/primy-responsible.webp',
    label: 'Primy te recuerda tus límites',
    motion: 'primy-mascot-responsible',
    surface: 'from-sky/50 via-ivory to-primy-50',
    accent: 'bg-primy-100',
  },
};

export function PrimyMascotGraphic({
  className = '',
  variant = 'welcome',
  size = 'hero',
  caption = 'Tu guía Primy',
  showCaption = true,
  animate = true,
  compact = false,
}) {
  const config = MASCOT_VARIANTS[variant] || MASCOT_VARIANTS.welcome;
  const isHero = size === 'hero';
  const imageMax = compact ? 'max-w-[190px]' : isHero ? 'max-w-[390px]' : 'max-w-[310px]';
  const padding = compact ? 'p-2.5' : isHero ? 'p-4' : 'p-3.5';

  return (
    <div
      className={`relative overflow-hidden rounded-[1.8rem] border border-primy-100 bg-gradient-to-br ${config.surface} ${padding} shadow-soft ${className}`}
      role="img"
      aria-label={config.label}
    >
      <span className={`primy-pulse-ring pointer-events-none absolute right-[14%] top-[13%] h-14 w-14 rounded-full ${config.accent} opacity-20`} aria-hidden="true"/>
      <span className="primy-spark pointer-events-none absolute left-[12%] top-[12%] h-3 w-3 rotate-45 rounded-[3px] bg-gold" aria-hidden="true"/>
      <span className="primy-spark pointer-events-none absolute bottom-[20%] right-[9%] h-2.5 w-2.5 rotate-45 rounded-[3px] bg-primy-400 [animation-delay:-1.1s]" aria-hidden="true"/>

      <img
        src={config.src}
        alt=""
        className={`relative z-10 mx-auto w-full ${imageMax} object-contain drop-shadow-[0_20px_28px_rgba(11,122,73,0.15)] ${animate ? config.motion : ''}`}
        loading={variant === 'welcome' ? 'eager' : 'lazy'}
        decoding="async"
      />

      {showCaption && (
        <div className={`relative z-20 mt-2 flex ${compact ? 'flex-col items-start' : 'items-center justify-between'} gap-3 rounded-2xl border border-white/80 bg-white/70 px-3 py-2.5 backdrop-blur-sm`}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primy-700">Primy</p>
            <p className="mt-0.5 text-xs font-medium leading-5 text-secondary">{caption}</p>
          </div>
          {!compact && (
            <span className="primy-fold-signature" aria-hidden="true">
              <span className="primy-fold-signature__line" />
              <span className="primy-fold-signature__dot" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function PrimyMascotAvatar({ className = '' }) {
  return <img src="/mascot/primy-avatar.webp" alt="" className={`object-contain ${className}`} loading="lazy" decoding="async"/>;
}

const balls = [
  { n: 6, x: 62, y: 74, r: 25, fill: '#FFFFFF', text: '#0B7A49' },
  { n: 14, x: 151, y: 52, r: 31, fill: '#F4C84A', text: '#101828' },
  { n: 23, x: 246, y: 89, r: 27, fill: '#FFFFFF', text: '#0B7A49' },
  { n: 31, x: 330, y: 43, r: 22, fill: '#D7F7E5', text: '#0B7A49' },
  { n: 38, x: 365, y: 154, r: 34, fill: '#FFFFFF', text: '#0B7A49' },
  { n: 45, x: 94, y: 186, r: 29, fill: '#D7F7E5', text: '#0B7A49' },
];

export function LotteryHeroGraphic({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 430 250" role="img" aria-label="Boleto digital con bolas de lotería">
      <defs>
        <linearGradient id="heroPanel" x1="20" y1="20" x2="400" y2="240" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D7F7E5"/>
          <stop offset="1" stopColor="#A8E8C5"/>
        </linearGradient>
        <filter id="heroShadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="9" stdDeviation="8" floodColor="#004E2D" floodOpacity=".16"/>
        </filter>
      </defs>
      <path d="M22 37C52 2 118 2 159 27c44 27 75-11 128-9 53 2 107 33 118 89 10 54-27 112-83 125-48 11-79-12-119-5-54 10-111 15-151-20C8 168-12 78 22 37Z" fill="url(#heroPanel)"/>
      <g transform="rotate(-7 218 142)" filter="url(#heroShadow)">
        <path d="M145 70h178a18 18 0 0 1 18 18v102a18 18 0 0 1-18 18H145a18 18 0 0 1-18-18v-11c10-2 17-11 17-22s-7-20-17-22V88a18 18 0 0 1 18-18Z" fill="#FFFDF6"/>
        <rect x="160" y="91" width="90" height="10" rx="5" fill="#0B7A49"/>
        <rect x="160" y="112" width="137" height="7" rx="3.5" fill="#B9C9C0"/>
        <rect x="160" y="129" width="110" height="7" rx="3.5" fill="#D7E4DD"/>
        <g fill="#D7F7E5">
          <circle cx="174" cy="165" r="13"/><circle cx="208" cy="165" r="13"/><circle cx="242" cy="165" r="13"/><circle cx="276" cy="165" r="13"/><circle cx="310" cy="165" r="13"/>
        </g>
      </g>
      {balls.map((ball, index) => (
        <g key={ball.n} transform={`translate(${ball.x} ${ball.y})`} filter="url(#heroShadow)" className={index % 2 ? 'primy-float primy-float-delay' : 'primy-float'}>
          <circle r={ball.r} fill={ball.fill}/>
          <circle r={ball.r - 2} fill="none" stroke="#0B7A49" strokeOpacity=".12" strokeWidth="2"/>
          <ellipse cx={-ball.r * .28} cy={-ball.r * .32} rx={ball.r * .22} ry={ball.r * .13} fill="#fff" fillOpacity=".7"/>
          <text textAnchor="middle" dominantBaseline="central" fill={ball.text} fontFamily="Sora, sans-serif" fontWeight="700" fontSize={ball.r * .72}>{ball.n}</text>
        </g>
      ))}
      <path d="m378 70 6 14 15 5-15 5-6 14-6-14-15-5 15-5 6-14Z" fill="#F4C84A"/>
      <circle cx="39" cy="148" r="6" fill="#00A85A" opacity=".45"/>
      <circle cx="397" cy="217" r="8" fill="#fff" opacity=".7"/>
    </svg>
  );
}

export function EmptyTicketGraphic({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 220 150" role="img" aria-label="Boleto vacío de Primy">
      <path d="M44 25h132a15 15 0 0 1 15 15v70a15 15 0 0 1-15 15H44a15 15 0 0 1-15-15v-7c9-1 16-9 16-18s-7-17-16-18v-27a15 15 0 0 1 15-15Z" fill="#FFFDF6" stroke="#A8DDBF" strokeWidth="3"/>
      <rect x="60" y="46" width="67" height="9" rx="4.5" fill="#0B7A49"/>
      <rect x="60" y="68" width="100" height="6" rx="3" fill="#D5E3DC"/>
      <rect x="60" y="82" width="78" height="6" rx="3" fill="#E6EEE9"/>
      <circle cx="159" cy="105" r="29" fill="#00A85A"/>
      <text x="159" y="106" textAnchor="middle" dominantBaseline="central" fill="white" fontFamily="Sora, sans-serif" fontWeight="700" fontSize="22">?</text>
      <circle cx="42" cy="26" r="12" fill="#F4C84A"/>
    </svg>
  );
}

export function MailGraphic({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 220 170" role="img" aria-label="Correo de confirmación de Primy">
      <path d="M30 72 110 28l80 44v65a15 15 0 0 1-15 15H45a15 15 0 0 1-15-15V72Z" fill="#D7F7E5" stroke="#0B7A49" strokeWidth="3"/>
      <path d="m31 73 79 58 79-58" fill="#FFFDF6" stroke="#0B7A49" strokeWidth="3" strokeLinejoin="round"/>
      <rect x="58" y="42" width="104" height="78" rx="13" fill="#FFFDF6"/>
      <rect x="78" y="61" width="65" height="8" rx="4" fill="#0B7A49"/>
      <rect x="78" y="79" width="83" height="6" rx="3" fill="#C7D7CF"/>
      <circle cx="161" cy="42" r="22" fill="#00A85A"/>
      <path d="m151 42 7 7 13-15" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="44" cy="42" r="13" fill="#F4C84A"/>
    </svg>
  );
}
