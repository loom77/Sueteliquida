import React, { useState } from 'react';
import { HomeFooter, HomeHero, HomeOverview, HomeQuickActions, PendingDraws, RecentPlays } from './HomeExperience.jsx';
import PrimyCoreDialog from './PrimyCoreDialog.jsx';

const DAILY_LINES = [
  'Crea, guarda y controla tus jugadas desde un único lugar.',
  'Una experiencia clara para preparar tu próxima jugada.',
  'Tus jugadas, organizadas a tu manera.',
  'Cada sorteo empieza con una elección sencilla.',
];

export default function DashboardView({ now, history, monthlyStats, totals, dueByGame, drawOverview, onGenerate, onAddExternal, onOpenPlays, onExplore, onCheckAll, checking, displayName = '' }) {
  const dueTotal = Object.values(dueByGame).reduce((sum, count) => sum + count, 0);
  const dailyLine = DAILY_LINES[new Date(now).getDate() % DAILY_LINES.length];
  const [coreOpen, setCoreOpen] = useState(false);

  return (
    <div className="primy-home-v16 primy-home-page-v18 mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <HomeHero dailyLine={dailyLine} displayName={displayName} onGenerate={onGenerate} onAddExternal={onAddExternal} onOpenCore={() => setCoreOpen(true)} onExplore={onExplore} />
      <PendingDraws dueTotal={dueTotal} checking={checking} onCheckAll={onCheckAll} />
      <HomeOverview monthlyStats={monthlyStats} totals={totals} onOpenPlays={onOpenPlays} />
      <RecentPlays plays={history} onOpenPlays={onOpenPlays} />
      <HomeQuickActions historyCount={history.length} dueTotal={dueTotal} onExplore={onExplore} onOpenPlays={onOpenPlays} />
      <HomeFooter drawOverview={drawOverview} />
      <PrimyCoreDialog open={coreOpen} onClose={() => setCoreOpen(false)} />
    </div>
  );
}
