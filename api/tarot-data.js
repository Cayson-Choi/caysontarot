import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Load data (module-level cache) ---

const tarotJson = JSON.parse(
  readFileSync(join(__dirname, '..', 'tarot_interpretations.json'), 'utf-8')
);
const csvRaw = readFileSync(join(__dirname, '..', 'tarot_readings.csv'), 'utf-8');

// --- CSV parser (handles quoted fields with commas) ---

function parseCsv(raw) {
  const lines = raw.split('\n').filter((l) => l.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (const ch of lines[i]) {
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    if (fields.length >= 4) {
      rows.push({ cards: [fields[0], fields[1], fields[2]], reading: fields[3] });
    }
  }
  return rows;
}

const csvReadings = parseCsv(csvRaw);

// --- Name normalization ---
// Frontend uses: "The High Priestess", "Ace of Pentacles", "2 of Cups"
// JSON uses:     "The Papess/High Priestess", "ace of coins", "two of cups"
// CSV uses:      "The high priestess", "Two of Pentacles", "Three of Cups"

const digitToWord = {
  '2': 'two',
  '3': 'three',
  '4': 'four',
  '5': 'five',
  '6': 'six',
  '7': 'seven',
  '8': 'eight',
  '9': 'nine',
  '10': 'ten',
};

function normalize(name) {
  let n = name.toLowerCase().trim();
  // Major arcana: JSON variant names → canonical
  n = n.replace('the papess/high priestess', 'the high priestess');
  n = n.replace('the pope/hierophant', 'the hierophant');
  n = n.replace(/^the wheel$/, 'wheel of fortune');
  // Suit: coins → pentacles
  n = n.replace(/\bcoins\b/, 'pentacles');
  // Digits → words: "2 of cups" → "two of cups"
  n = n.replace(/^(\d+)\s+of\s+/, (_, d) => (digitToWord[d] || d) + ' of ');
  return n;
}

// Build lookup map: normalized name → JSON card data
const cardMap = new Map();
for (const card of tarotJson.tarot_interpretations) {
  cardMap.set(normalize(card.name), card);
}

// Pre-normalize CSV card names for fast matching
const normalizedCsvReadings = csvReadings.map((row) => ({
  normalizedCards: row.cards.map(normalize),
  reading: row.reading,
}));

// --- Exports ---

export function lookupCard(nameEn) {
  const card = cardMap.get(normalize(nameEn));
  if (!card) return null;
  return {
    keywords: card.keywords,
    light: card.meanings.light,
    shadow: card.meanings.shadow,
    fortune_telling: card.fortune_telling,
  };
}

export function findExampleReadings(cardNames, count = 2) {
  const normalized = cardNames.map(normalize);
  const results = [];
  for (const row of normalizedCsvReadings) {
    if (row.normalizedCards.some((c) => normalized.includes(c))) {
      results.push(row.reading);
      if (results.length >= count) break;
    }
  }
  return results;
}

export function buildCardReference(cards) {
  const lines = [];
  for (const card of cards) {
    const data = lookupCard(card.nameEn);
    if (!data) continue;
    const dir = card.reversed ? 'Reversed' : 'Upright';
    const meanings = card.reversed ? data.shadow : data.light;
    lines.push(
      `[${card.nameEn}] (${dir})` +
        `\n  Keywords: ${data.keywords.join(', ')}` +
        `\n  ${dir} meanings: ${meanings.slice(0, 3).join('; ')}` +
        `\n  Fortune telling: ${data.fortune_telling.slice(0, 2).join('; ')}`
    );
  }
  if (lines.length === 0) return '';

  const examples = findExampleReadings(
    cards.map((c) => c.nameEn),
    2
  );

  let ref = `\n\nCard Meaning Reference:\n${lines.join('\n\n')}`;
  if (examples.length > 0) {
    ref += '\n\nExample Readings for Reference:';
    examples.forEach((ex, i) => {
      ref += `\n${i + 1}. ${ex}`;
    });
  }
  ref +=
    '\n\nUse the above reference to inform your interpretation, but write naturally in your own words.';
  return ref;
}
