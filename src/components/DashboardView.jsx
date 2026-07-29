import React, { useMemo } from 'react';
import { getNextDrawInfo } from '../utils/drawSchedule.js';
import { HomeFooter, HomeHero, HomeQuickActions, PendingDraws } from './HomeExperience.jsx';

const DAILY_LINES = [
  'Crea, guarda y controla tus jugadas desde un único lugar.',
  'Una experiencia clara para preparar tu próxima jugada.',
  'Tus jugadas, organizadas a tu manera.',
  'Cada sorteo empieza con una elección sencilla.',
];

export default function DashboardView({ now, history, dueByGame, drawOverview, onGenerate, onAddExternal, onOpenPlays, onExplore, onCheckAll, checking }) {
  const dueTotal = Object.values(dueByGame).reduce((sum, count) => sum + count, 0);
  const nextDraw = useMemo(() => getNextDrawInfo('primitiva', now), [now]);
  const dailyLine = DAILY_LINES[new Date(now).getDate() % DAILY_LINES.length];

  return (
    <div className="primy-home mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <HomeHero nextDraw={nextDraw} dailyLine={dailyLine} onGenerate={onGenerate} onAddExternal={onAddExternal} />
      <PendingDraws dueTotal={dueTotal} checking={checking} onCheckAll={onCheckAll} />
      <HomeQuickActions historyCount={history.length} dueTotal={dueTotal} onExplore={onExplore} onOpenPlays={onOpenPlays} onAddExternal={onAddExternal} />
      <HomeFooter drawOverview={drawOverview} />
    </div>
  );
}
