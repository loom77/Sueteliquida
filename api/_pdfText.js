import { inflateSync } from 'node:zlib';

export class PdfTextExtractionError extends Error {
  constructor(message, { code = 'PDF_TEXT_EXTRACTION_ERROR', details = '' } = {}) {
    super(message);
    this.name = 'PdfTextExtractionError';
    this.code = code;
    this.details = details;
  }
}

function decodePdfLiteral(value) {
  let output = '';
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char !== '\\') {
      output += char;
      continue;
    }
    const next = value[index + 1];
    if (next == null) break;
    if (/[0-7]/.test(next)) {
      const octal = value.slice(index + 1).match(/^[0-7]{1,3}/)?.[0] || next;
      output += String.fromCharCode(parseInt(octal, 8));
      index += octal.length;
      continue;
    }
    const escaped = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', '(': '(', ')': ')', '\\': '\\' }[next];
    if (escaped != null) output += escaped;
    else if (next === '\n') output += '';
    else output += next;
    index += 1;
  }
  return output;
}

function decodeHex(value) {
  const cleaned = String(value || '').replace(/\s+/g, '');
  if (!cleaned || /[^0-9a-f]/i.test(cleaned)) return '';
  const even = cleaned.length % 2 === 0 ? cleaned : `${cleaned}0`;
  const bytes = Buffer.from(even, 'hex');
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    let output = '';
    for (let index = 2; index + 1 < bytes.length; index += 2) output += String.fromCharCode(bytes.readUInt16BE(index));
    return output;
  }
  return bytes.toString('latin1');
}

function stringsFromArray(value) {
  const parts = [];
  const pattern = /\((?:\\.|[^\\)])*\)|<([0-9a-f\s]+)>/gi;
  for (const match of value.matchAll(pattern)) {
    const token = match[0];
    parts.push(token.startsWith('(') ? decodePdfLiteral(token.slice(1, -1)) : decodeHex(match[1]));
  }
  return parts.join('');
}

function extractTextOperators(content) {
  const blocks = String(content || '').match(/BT[\s\S]*?ET/g) || [String(content || '')];
  const lines = [];
  for (const block of blocks) {
    let current = '';
    const operatorPattern = /(\((?:\\.|[^\\)])*\)|<([0-9a-f\s]+)>|\[((?:\\.|[^\]])*)\])\s*(Tj|TJ|'|")|(?:T\*|Td|TD|Tm)\b/gi;
    let lastIndex = 0;
    for (const match of block.matchAll(operatorPattern)) {
      const between = block.slice(lastIndex, match.index);
      if (/\b(?:T\*|Td|TD|Tm)\b/.test(between) && current.trim()) {
        lines.push(current.trim());
        current = '';
      }
      if (match[4]) {
        const token = match[1] || '';
        const text = token.startsWith('(')
          ? decodePdfLiteral(token.slice(1, -1))
          : token.startsWith('<')
            ? decodeHex(match[2])
            : stringsFromArray(match[3] || '');
        current += text;
        if (match[4] === "'" || match[4] === '"') {
          if (current.trim()) lines.push(current.trim());
          current = '';
        }
      } else if (current.trim()) {
        lines.push(current.trim());
        current = '';
      }
      lastIndex = (match.index || 0) + match[0].length;
    }
    if (current.trim()) lines.push(current.trim());
  }
  return lines;
}

function streamBuffers(pdf) {
  const source = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);
  const binary = source.toString('latin1');
  const streams = [];
  const pattern = /stream\r?\n/g;
  for (const match of binary.matchAll(pattern)) {
    const start = (match.index || 0) + match[0].length;
    const end = binary.indexOf('endstream', start);
    if (end < 0) continue;
    let rawEnd = end;
    while (rawEnd > start && /[\r\n]/.test(binary[rawEnd - 1])) rawEnd -= 1;
    const dictionary = binary.slice(Math.max(0, (match.index || 0) - 700), match.index || 0);
    const raw = source.subarray(start, rawEnd);
    try {
      if (/\/FlateDecode\b/.test(dictionary)) streams.push(inflateSync(raw));
      else streams.push(raw);
    } catch {
      streams.push(raw);
    }
  }
  return streams;
}

function normalizeOutput(lines) {
  return lines
    .map(line => String(line || '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/\s+/g, ' ').trim())
    .filter(line => line.length > 0 && /[\p{L}\p{N}]/u.test(line))
    .join('\n');
}

export function extractPdfText(pdfBytes) {
  const bytes = Buffer.isBuffer(pdfBytes) ? pdfBytes : Buffer.from(pdfBytes || []);
  if (bytes.length < 8 || !bytes.subarray(0, 5).toString('ascii').startsWith('%PDF-')) {
    throw new PdfTextExtractionError('El documento oficial no es un PDF válido.', { code: 'INVALID_PDF' });
  }
  const lines = [];
  for (const stream of streamBuffers(bytes)) lines.push(...extractTextOperators(stream.toString('latin1')));
  if (lines.length === 0) {
    const raw = bytes.toString('latin1');
    lines.push(...extractTextOperators(raw));
  }
  const output = normalizeOutput(lines);
  if (output.length < 20) {
    throw new PdfTextExtractionError('El PDF oficial no contiene texto extraíble suficiente.', {
      code: 'PDF_TEXT_UNAVAILABLE',
      details: 'Puede tratarse de un documento escaneado o de una fuente con codificación no compatible.',
    });
  }
  return output;
}
