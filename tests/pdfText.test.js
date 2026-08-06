import test from 'node:test';
import assert from 'node:assert/strict';
import { deflateSync } from 'node:zlib';
import { extractPdfText } from '../api/_pdfText.js';

function fakePdf(content, compressed = false) {
  const bytes = compressed ? deflateSync(Buffer.from(content, 'latin1')) : Buffer.from(content, 'latin1');
  const dictionary = compressed ? `<< /Length ${bytes.length} /Filter /FlateDecode >>` : `<< /Length ${bytes.length} >>`;
  return Buffer.concat([
    Buffer.from('%PDF-1.4\n1 0 obj\n', 'latin1'),
    Buffer.from(`${dictionary}\nstream\n`, 'latin1'),
    bytes,
    Buffer.from('\nendstream\nendobj\n%%EOF', 'latin1'),
  ]);
}

test('extrae texto de un PDF con stream literal', () => {
  const pdf = fakePdf('BT\n(Programa Lototurf) Tj\nT*\n(1 CABALLO UNO 4 anos 58) Tj\nET');
  const text = extractPdfText(pdf);
  assert.match(text, /Programa Lototurf/);
  assert.match(text, /CABALLO UNO/);
});

test('extrae texto de un stream FlateDecode', () => {
  const pdf = fakePdf('BT\n(Quintuple Plus Jornada 44) Tj\nET', true);
  assert.match(extractPdfText(pdf), /Jornada 44/);
});
