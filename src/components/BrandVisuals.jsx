import React from 'react';

export function PrimyMark({ className = '', title = 'Primy' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" role="img" aria-label={title}>
      <defs>
        <linearGradient id="primyMarkGradient" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00B968"/>
          <stop offset="1" stopColor="#007A46"/>
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="58" height="58" rx="20" fill="url(#primyMarkGradient)"/>
      <circle cx="31" cy="28" r="15" fill="#fff" fillOpacity=".98"/>
      <path d="M23 47V20h10.5c8.5 0 13.5 4.2 13.5 11 0 7-5.2 11.5-13.7 11.5H31V47h-8Zm8-12h2.1c3.7 0 5.8-1.4 5.8-4.2 0-2.6-1.9-4-5.5-4H31V35Z" fill="#007A46"/>
      <circle cx="49" cy="13" r="5" fill="#FFC83D"/>
    </svg>
  );
}

export function PrimyWordmark({ compact = false, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <PrimyMark className={compact ? 'h-10 w-10' : 'h-12 w-12'}/>
      <div className="leading-none">
        <p className={`${compact ? 'text-lg' : 'text-xl'} font-display font-bold tracking-[-0.03em] text-primary`}>Primy</p>
        {!compact && <p className="mt-1 text-xs font-medium text-secondary">Tus jugadas, a tu manera</p>}
      </div>
    </div>
  );
}

const balls = [
  { n: 6, x: 62, y: 74, r: 25, fill: '#FFFFFF', text: '#007A46' },
  { n: 14, x: 151, y: 52, r: 31, fill: '#FFC83D', text: '#101828' },
  { n: 23, x: 246, y: 89, r: 27, fill: '#FFFFFF', text: '#007A46' },
  { n: 31, x: 330, y: 43, r: 22, fill: '#D7F7E5', text: '#007A46' },
  { n: 38, x: 365, y: 154, r: 34, fill: '#FFFFFF', text: '#007A46' },
  { n: 45, x: 94, y: 186, r: 29, fill: '#D7F7E5', text: '#007A46' },
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
        <rect x="160" y="91" width="90" height="10" rx="5" fill="#007A46"/>
        <rect x="160" y="112" width="137" height="7" rx="3.5" fill="#B9C9C0"/>
        <rect x="160" y="129" width="110" height="7" rx="3.5" fill="#D7E4DD"/>
        <g fill="#D7F7E5">
          <circle cx="174" cy="165" r="13"/><circle cx="208" cy="165" r="13"/><circle cx="242" cy="165" r="13"/><circle cx="276" cy="165" r="13"/><circle cx="310" cy="165" r="13"/>
        </g>
      </g>
      {balls.map((ball, index) => (
        <g key={ball.n} transform={`translate(${ball.x} ${ball.y})`} filter="url(#heroShadow)" className={index % 2 ? 'primy-float primy-float-delay' : 'primy-float'}>
          <circle r={ball.r} fill={ball.fill}/>
          <circle r={ball.r - 2} fill="none" stroke="#007A46" strokeOpacity=".12" strokeWidth="2"/>
          <ellipse cx={-ball.r * .28} cy={-ball.r * .32} rx={ball.r * .22} ry={ball.r * .13} fill="#fff" fillOpacity=".7"/>
          <text textAnchor="middle" dominantBaseline="central" fill={ball.text} fontFamily="Sora, sans-serif" fontWeight="700" fontSize={ball.r * .72}>{ball.n}</text>
        </g>
      ))}
      <path d="m378 70 6 14 15 5-15 5-6 14-6-14-15-5 15-5 6-14Z" fill="#FFC83D"/>
      <circle cx="39" cy="148" r="6" fill="#00A85A" opacity=".45"/>
      <circle cx="397" cy="217" r="8" fill="#fff" opacity=".7"/>
    </svg>
  );
}

export function EmptyTicketGraphic({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 220 150" role="img" aria-label="Boleto vacío de Primy">
      <path d="M44 25h132a15 15 0 0 1 15 15v70a15 15 0 0 1-15 15H44a15 15 0 0 1-15-15v-7c9-1 16-9 16-18s-7-17-16-18v-27a15 15 0 0 1 15-15Z" fill="#FFFDF6" stroke="#A8DDBF" strokeWidth="3"/>
      <rect x="60" y="46" width="67" height="9" rx="4.5" fill="#007A46"/>
      <rect x="60" y="68" width="100" height="6" rx="3" fill="#D5E3DC"/>
      <rect x="60" y="82" width="78" height="6" rx="3" fill="#E6EEE9"/>
      <circle cx="159" cy="105" r="29" fill="#00A85A"/>
      <text x="159" y="106" textAnchor="middle" dominantBaseline="central" fill="white" fontFamily="Sora, sans-serif" fontWeight="700" fontSize="22">?</text>
      <circle cx="42" cy="26" r="12" fill="#FFC83D"/>
    </svg>
  );
}

export function MailGraphic({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 220 170" role="img" aria-label="Correo de confirmación de Primy">
      <path d="M30 72 110 28l80 44v65a15 15 0 0 1-15 15H45a15 15 0 0 1-15-15V72Z" fill="#D7F7E5" stroke="#007A46" strokeWidth="3"/>
      <path d="m31 73 79 58 79-58" fill="#FFFDF6" stroke="#007A46" strokeWidth="3" strokeLinejoin="round"/>
      <rect x="58" y="42" width="104" height="78" rx="13" fill="#FFFDF6"/>
      <rect x="78" y="61" width="65" height="8" rx="4" fill="#007A46"/>
      <rect x="78" y="79" width="83" height="6" rx="3" fill="#C7D7CF"/>
      <circle cx="161" cy="42" r="22" fill="#00A85A"/>
      <path d="m151 42 7 7 13-15" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="44" cy="42" r="13" fill="#FFC83D"/>
    </svg>
  );
}
