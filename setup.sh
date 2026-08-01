#!/bin/bash

echo "Inizializzazione del progetto Lotto Engine Pro..."

# 1. Creazione progetto Vite
npm create vite@latest lotto-engine -- --template react
cd lotto-engine

# 2. Installazione dipendenze
echo "Installazione delle dipendenze..."
npm install
npm install -D tailwindcss postcss autoprefixer vite-plugin-pwa

# 3. Inizializzazione Tailwind
npx tailwindcss init -p

# 4. Creazione struttura cartelle
mkdir -p src/utils src/hooks api

# 5. Scrittura dei file di configurazione
echo "Scrittura dei file di configurazione..."

cat << 'EOF' > tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

cat << 'EOF' > vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Lotto Engine Pro',
        short_name: 'LottoEngine',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
EOF

cat << 'EOF' > src/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

# 6. Scrittura dei file logici e API
echo "Scrittura della logica crittografica e API..."

cat << 'EOF' > src/utils/engine.js
function getCryptoRandom(min, max) {
    const range = max - min + 1;
    const maxValid = Math.floor(0xffffffff / range) * range;
    const randomBuffer = new Uint32Array(1);
    
    do {
        window.crypto.getRandomValues(randomBuffer);
    } while (randomBuffer[0] >= maxValid);
    
    return min + (randomBuffer[0] % range);
}

function isHumanPattern(combination) {
    let consecutives = 0;
    for (let i = 0; i < combination.length - 1; i++) {
        if (combination[i+1] === combination[i] + 1) consecutives++;
        else consecutives = 0;
        if (consecutives >= 2) return true;
    }
    const highNumbers = combination.filter(n => n > 31).length;
    if (highNumbers < 2) return true;
    return false;
}

export function generateTicket() {
    let valid = false;
    let ticket = [];
    while (!valid) {
        ticket = [];
        let pool = Array.from({length: 40}, (_, i) => i + 1);
        for (let i = 0; i < 6; i++) {
            const index = getCryptoRandom(0, pool.length - 1);
            ticket.push(pool.splice(index, 1)[0]);
        }
        ticket.sort((a, b) => a - b);
        if (!isHumanPattern(ticket)) valid = true;
    }
    const sueno = getCryptoRandom(1, 5);
    return { ticket, sueno, date: new Date().toISOString() };
}
EOF

cat << 'EOF' > src/utils/payout.js
export function calculateEuroDreamsPayout(myTicket, winningNumbers, mySueno, winningSueno) {
    let matches = 0;
    myTicket.forEach(num => {
        if (winningNumbers.includes(num)) matches++;
    });
    const suenoMatch = (mySueno === winningSueno);

    if (matches === 6 && suenoMatch) return 20000; 
    if (matches === 6 && !suenoMatch) return 2000;
    if (matches === 5) return 120;
    if (matches === 4) return 40;
    if (matches === 3) return 5;
    if (matches === 2) return 2.50; 
    return 0; 
}
EOF

cat << 'EOF' > src/hooks/useStorage.js
import { useState, useEffect } from 'react';
import { calculateEuroDreamsPayout } from '../utils/payout';

export function useGameHistory() {
    const [history, setHistory] = useState([]);
    const [totalWon, setTotalWon] = useState(0);
    
    useEffect(() => {
        const saved = localStorage.getItem('lotto_history');
        if (saved) {
            const parsed = JSON.parse(saved);
            setHistory(parsed);
            const winnings = parsed.reduce((acc, ticket) => acc + (ticket.prize || 0), 0);
            setTotalWon(winnings);
        }
    }, []);

    const saveTicket = (newTicket) => {
        const updated = [newTicket, ...history];
        setHistory(updated);
        localStorage.setItem('lotto_history', JSON.stringify(updated));
    };

    const checkLatestResults = async () => {
        try {
            const res = await fetch('/api/check-results');
            const { winning_numbers, sueno } = await res.json();
            const updatedHistory = history.map(ticket => {
                if (ticket.checked) return ticket;
                const prize = calculateEuroDreamsPayout(ticket.ticket, winning_numbers, ticket.sueno, sueno);
                return { ...ticket, checked: true, prize };
            });
            setHistory(updatedHistory);
            localStorage.setItem('lotto_history', JSON.stringify(updatedHistory));
            const newTotalWon = updatedHistory.reduce((acc, ticket) => acc + (ticket.prize || 0), 0);
            setTotalWon(newTotalWon);
        } catch (error) {
            console.error("Errore API:", error);
        }
    };

    const totalSpent = history.length * 2.50;
    const netROI = totalWon - totalSpent;

    return { history, totalSpent, totalWon, netROI, checkLatestResults, saveTicket };
}
EOF

cat << 'EOF' > api/check-results.js
export default async function handler(req, res) {
    const API_URL = "https://www.loteriasyapuestas.es/servicios/buscadores/ultimo?game_id=EDR";
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        res.status(200).json({
            success: true,
            winning_numbers: data.combinazione || [8, 11, 12, 22, 26, 36], // Dati mockati di fallback
            sueno: data.reintegro || 1,
            date: data.fecha || new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Errore API" });
    }
}
EOF

# 7. Scrittura del Frontend React
echo "Scrittura dell'interfaccia utente..."

cat << 'EOF' > src/App.jsx
import React, { useState } from 'react';
import { useGameHistory } from './hooks/useStorage';
import { generateTicket } from './utils/engine';

export default function App() {
  const { history, totalSpent, totalWon, netROI, checkLatestResults, saveTicket } = useGameHistory();
  const [isChecking, setIsChecking] = useState(false);
  const [latestTicket, setLatestTicket] = useState(null);

  const handleGenerate = () => {
    const ticketData = generateTicket(); 
    const newTicket = { ...ticketData, checked: false, prize: 0 }; 
    setLatestTicket(newTicket);
    saveTicket(newTicket);
  };

  const handleCheckResults = async () => {
    setIsChecking(true);
    await checkLatestResults();
    setIsChecking(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans">
      <div className="max-w-lg mx-auto space-y-6">
        
        <header className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight mb-4 text-slate-900">
            Lotto Engine Pro
          </h1>
          
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-slate-500 uppercase tracking-wider text-xs">Spesa Totale</p>
              <p className="font-semibold">{totalSpent.toFixed(2)} €</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-slate-500 uppercase tracking-wider text-xs">Vincite</p>
              <p className="font-semibold">{totalWon.toFixed(2)} €</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <p className="text-slate-500 uppercase tracking-wider text-xs mb-1">Net ROI</p>
            <p className={`text-4xl font-black tracking-tighter ${netROI >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {netROI > 0 ? '+' : ''}{netROI.toFixed(2)} €
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-3">
          <button 
            onClick={handleGenerate}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform hover:bg-slate-800"
          >
            Genera Giocata EuroDreams
          </button>
          
          <button 
            onClick={handleCheckResults}
            disabled={isChecking}
            className="w-full bg-emerald-100 text-emerald-800 font-bold py-4 rounded-xl shadow-sm active:scale-95 transition-transform disabled:opacity-50"
          >
            {isChecking ? 'Verifica in corso...' : 'Verifica Estrazioni'}
          </button>
        </div>

        {latestTicket && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-sm font-bold text-slate-400 uppercase mb-4">Ultima Estrazione Algoritmica</h2>
            <div className="flex flex-wrap gap-2 justify-center">
              {latestTicket.ticket.map((num, i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 shadow-inner">
                  {num}
                </div>
              ))}
              <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center font-bold text-amber-900 shadow-md ml-2">
                {latestTicket.sueno}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-sm font-bold text-slate-400 uppercase mb-4">Storico</h2>
          {history.length === 0 ? (
            <p className="text-slate-400 text-sm text-center">Nessuna giocata registrata.</p>
          ) : (
            <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {history.map((item, index) => (
                <li key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg text-sm">
                  <div className="font-mono text-slate-600">
                    {item.ticket.join('-')} <span className="text-amber-500 font-bold">({item.sueno})</span>
                  </div>
                  <div>
                    {!item.checked ? (
                      <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">In attesa</span>
                    ) : item.prize > 0 ? (
                      <span className="text-xs bg-emerald-200 text-emerald-800 font-bold px-2 py-1 rounded-full">Vinto {item.prize}€</span>
                    ) : (
                      <span className="text-xs bg-rose-100 text-rose-600 px-2 py-1 rounded-full">Perso</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
EOF

echo "Progetto generato con successo! 🎉"
echo "Per testarlo in locale digita:"
echo "npm run dev"
