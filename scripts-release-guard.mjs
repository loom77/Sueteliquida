import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'src/App.jsx','src/main.jsx','src/index.css','src/components/AppShell.jsx',
  'src/components/HomeExperience.jsx','src/components/GeneratorPanel.jsx',
  'src/components/TicketHistory.jsx','src/hooks/useAppController.js',
  'src/utils/monteCarlo.js','src/utils/fusionEngine.js','package.json','vite.config.js'
];
const missing = required.filter(file => !fs.existsSync(path.join(root,file)));
const countFiles = dir => fs.readdirSync(dir,{withFileTypes:true}).reduce((n,e)=>n+(e.isDirectory()?countFiles(path.join(dir,e.name)):1),0);
const srcCount = countFiles(path.join(root,'src'));
const testCount = countFiles(path.join(root,'tests'));
if (missing.length || srcCount < 100 || testCount < 40) {
  console.error('RELEASE BLOCCATA');
  if (missing.length) console.error('File critici mancanti:', missing.join(', '));
  console.error(`File src: ${srcCount} (minimo 100); test: ${testCount} (minimo 40)`);
  process.exit(1);
}
console.log(`Release guard OK: ${srcCount} file src, ${testCount} test, file critici presenti.`);
