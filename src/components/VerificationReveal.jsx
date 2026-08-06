import React from 'react';
import { NumberBall } from './TicketUI.jsx';

function scoreLabel(score) {
  return score && Number.isInteger(Number(score.home)) && Number.isInteger(Number(score.away))
    ? `${Number(score.home)}–${Number(score.away)}`
    : '—';
}

function RevealStatus({ hit }) {
  return (
    <span className={`primy-verification-reveal__status ${hit ? 'is-hit' : 'is-miss'}`}>
      <span aria-hidden="true">{hit ? '✓' : '×'}</span>
      {hit ? 'Coincide' : 'No coincide'}
    </span>
  );
}

export function SportsVerificationReveal({ play }) {
  if (play?.computedStatus !== 'checked') return null;
  const column = play.columns?.[0] || {};
  const matches = [...(play.result?.matches || play.matches || [])].sort((left, right) => Number(left.position) - Number(right.position));
  if (!matches.length) return null;
  const details = column.verificationDetails || {};
  const isQuiniela = play.gameId === 'quiniela';
  const officialSigns = details.officialSigns || [];
  const officialPleno = details.officialPleno || {};
  const officialOutcomes = details.officialOutcomes || [];

  return (
    <section className="primy-verification-reveal" aria-label="Comprobación partido a partido">
      <header className="primy-verification-reveal__header">
        <div>
          <p className="primy-verification-reveal__eyebrow">Comprobación oficial</p>
          <h4>{isQuiniela ? 'Pronósticos frente al resultado' : 'Marcadores frente al resultado'}</h4>
          <p>Las coincidencias se resaltan; los pronósticos que no coinciden permanecen visibles pero atenuados.</p>
        </div>
        <span className="primy-verification-reveal__counter">
          <strong>{Number(column.matches || 0)}</strong>
          <span>{Number(column.matches || 0) === 1 ? 'acierto' : 'aciertos'}</span>
        </span>
      </header>

      <div className="primy-verification-reveal__grid">
        {matches.map((match, index) => {
          const isPleno = isQuiniela && (match.predictionType === 'pleno15' || Number(match.position) === 15);
          const played = isQuiniela
            ? isPleno
              ? `${column.pleno?.home || '—'}–${column.pleno?.away || '—'}`
              : column.signs?.[Number(match.position) - 1] || '—'
            : column.outcomes?.[index] || '—';
          const official = isQuiniela
            ? isPleno
              ? `${officialPleno.home || '—'}–${officialPleno.away || '—'}`
              : officialSigns[Number(match.position) - 1] || '—'
            : officialOutcomes[index] || '—';
          const hit = played !== '—' && official !== '—' && played === official;
          return (
            <article
              key={match.matchId || `${play.gameId}-${index}`}
              className={`primy-verification-reveal__row ${hit ? 'is-hit' : 'is-miss'}`}
              style={{ '--reveal-index': index }}
            >
              <span className="primy-verification-reveal__position">{isPleno ? 'P15' : match.position || index + 1}</span>
              <div className="primy-verification-reveal__teams">
                <strong>{match.homeTeam}</strong>
                <span>{match.awayTeam}</span>
                <small>Marcador real: {scoreLabel(match.officialScore)}</small>
              </div>
              <div className="primy-verification-reveal__values">
                <span className={`primy-verification-reveal__played ${hit ? 'is-hit' : 'is-dimmed'}`}><small>Tu pronóstico</small><strong>{played}</strong></span>
                <span className="primy-verification-reveal__official"><small>Oficial</small><strong>{official}</strong></span>
              </div>
              <RevealStatus hit={hit}/>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function OfficialRunner({ number, label, hit, index }) {
  return (
    <span className={`primy-official-runner ${hit ? 'is-hit' : ''}`} style={{ '--reveal-index': index }}>
      <span>{number}</span>
      <strong>{label}</strong>
      {hit && <i aria-hidden="true">✓</i>}
    </span>
  );
}

export function HorseVerificationReveal({ play }) {
  if (play?.computedStatus !== 'checked') return null;
  const official = play.result?.result;
  if (!official?.valid) return null;
  const isLototurf = play.gameId === 'lototurf';
  const selection = play.selection || {};

  if (isLototurf) {
    const playedNumbers = new Set((selection.numbers || []).map(Number));
    const playedHorses = new Set((selection.horses || []).map(Number));
    const numberHits = (official.winningNumbers || []).filter(number => playedNumbers.has(Number(number))).length;
    const horseHit = playedHorses.has(Number(official.winningHorse));
    const reintegroHit = Number(play.receiptExtra) === Number(official.reintegro);
    return (
      <section className="primy-verification-reveal primy-verification-reveal--horse" aria-label="Resultado oficial de Lototurf">
        <header className="primy-verification-reveal__header">
          <div><p className="primy-verification-reveal__eyebrow">Resultado oficial</p><h4>Lototurf comprobado</h4><p>Números, caballo ganador y reintegro se verifican por separado.</p></div>
          <span className="primy-verification-reveal__counter"><strong>{numberHits}</strong><span>números</span></span>
        </header>
        <div className="primy-verification-reveal__official-block">
          <span className="primy-verification-reveal__label">Combinación ganadora</span>
          <div className="primy-official-result__balls">
            {(official.winningNumbers || []).map((number, index) => <NumberBall key={number} compact winning hit={playedNumbers.has(Number(number))} dimmed={!playedNumbers.has(Number(number))} style={{ '--reveal-index': index }}>{number}</NumberBall>)}
          </div>
        </div>
        <div className="primy-verification-reveal__horse-grid">
          <OfficialRunner number={official.winningHorse} label="Caballo ganador" hit={horseHit} index={6}/>
          <OfficialRunner number={official.reintegro} label="Reintegro" hit={reintegroHit} index={7}/>
        </div>
      </section>
    );
  }

  const rows = selection.rows || [];
  const officialRows = [...(official.winners || []), official.secondFifth];
  const hits = officialRows.reduce((sum, number, index) => sum + ((rows[index] || []).map(Number).includes(Number(number)) ? 1 : 0), 0);
  return (
    <section className="primy-verification-reveal primy-verification-reveal--horse" aria-label="Resultado oficial de Quíntuple Plus">
      <header className="primy-verification-reveal__header">
        <div><p className="primy-verification-reveal__eyebrow">Resultado oficial</p><h4>Quíntuple Plus comprobado</h4><p>Se comparan los cinco ganadores y el segundo clasificado de la quinta carrera.</p></div>
        <span className="primy-verification-reveal__counter"><strong>{hits}</strong><span>coincidencias</span></span>
      </header>
      <div className="primy-verification-reveal__horse-grid">
        {officialRows.map((number, index) => (
          <OfficialRunner
            key={`${index}-${number}`}
            number={number}
            label={index < 5 ? `Ganador carrera ${index + 1}` : 'Segundo carrera 5'}
            hit={(rows[index] || []).map(Number).includes(Number(number))}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}
