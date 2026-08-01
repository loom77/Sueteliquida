import React from 'react';

const ICONS = {
  budget: '/ui-icons/budget.svg',
  archive: '/ui-icons/archive.svg',
  games: '/ui-icons/games.svg',
  calendar: '/ui-icons/calendar.svg',
  numbers: '/ui-icons/numbers.svg',
  national: '/ui-icons/national.svg',
  sports: '/ui-icons/sports.svg',
  horse: '/ui-icons/horse.svg',
};

export function CreativeUiIcon({ name, className = '', alt = '' }) {
  const src = ICONS[name];
  if (!src) return null;
  return <img src={src} alt={alt} className={`primy-creative-icon ${className}`} loading="eager" decoding="async" />;
}

export function BudgetCreativeIcon(props) { return <CreativeUiIcon name="budget" {...props} />; }
export function ArchiveCreativeIcon(props) { return <CreativeUiIcon name="archive" {...props} />; }
export function GamesCreativeIcon(props) { return <CreativeUiIcon name="games" {...props} />; }
export function CalendarCreativeIcon(props) { return <CreativeUiIcon name="calendar" {...props} />; }
export function NumbersCreativeIcon(props) { return <CreativeUiIcon name="numbers" {...props} />; }
export function NationalCreativeIcon(props) { return <CreativeUiIcon name="national" {...props} />; }
export function SportsCreativeIcon(props) { return <CreativeUiIcon name="sports" {...props} />; }
export function HorseCreativeIcon(props) { return <CreativeUiIcon name="horse" {...props} />; }
