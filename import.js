const fs = require('fs');
const { parse } = require('csv-parse/sync');
const db = require('./db');
const { normalizeName } = require('./normalize');
const { parseAmount } = require('./parseAmount');

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: node import.js <path-to-csv>');
  process.exit(1);
}

const fileContent = fs.readFileSync(csvPath, 'utf-8');
const records = parse(fileContent, { columns: true, skip_empty_lines: true });

const anomalies = [];
const seenExpenseKeys = new Set(); // for duplicate detection

function getOrCreateUser(name) {
  const canonical = normalizeName(name);
  if (!canonical) return null;
  let user = db.prepare('SELECT * FROM users WHERE name = ?').get(canonical);
  if (!user) {
    db.prepare('INSERT INTO users (name) VALUES (?)').run(canonical);
    user = db.prepare('SELECT * FROM users WHERE name = ?').get(canonical);
  }
  return user;
}

records.forEach((row, idx) => {
  const rowNum = idx + 2; // +2 because row 1 is header, idx is 0-based
  const date = row.date?.trim();
  const description = row.description?.trim();
  const amount = parseAmount(row.amount);
  const currency = row.currency?.trim() || 'INR';
  const splitType = row.split_type?.trim();
  const splitWith = row.split_with?.trim();
  const splitDetails = row.split_details?.trim();
  const notes = row.notes?.trim();
  const paidByRaw = row.paid_by?.trim();

  // --- Anomaly: amount parsing ---
  if (amount === null) {
    anomalies.push({ row: rowNum, issue: `Invalid/missing amount "${row.amount}"`, action: 'Row skipped' });
    return;
  }
  if (String(row.amount).includes(',')) {
    anomalies.push({ row: rowNum, issue: `Amount "${row.amount}" had comma separator`, action: `Cleaned to ${amount}` });
  }
  if (String(row.amount).split('.')[1]?.length > 2) {
    anomalies.push({ row: rowNum, issue: `Amount "${row.amount}" had >2 decimal places`, action: `Rounded to ${amount}` });
  }

  // --- Anomaly: missing paid_by ---
  if (!paidByRaw) {
    anomalies.push({ row: rowNum, issue: `Missing paid_by for "${description}"`, action: 'Row skipped (cannot determine payer)' });
    return;
  }

  // --- Detect settlement vs expense ---
  const isSettlement = !splitType && splitWith && !splitWith.includes(';');
  if (isSettlement) {
    const fromUser = getOrCreateUser(paidByRaw);
    const toUser = getOrCreateUser(splitWith);
    db.prepare('INSERT INTO settlements (date, from_user, to_user, amount, currency) VALUES (?, ?, ?, ?, ?)')
      .run(date, fromUser.id, toUser.id, amount, currency);
    anomalies.push({ row: rowNum, issue: `"${description}" looks like a settlement (no split_type, single recipient)`, action: 'Recorded as settlement, not expense' });
    return;
  }

  // --- Duplicate detection ---
  const dupKey = `${date}|${amount}|${paidByRaw.toLowerCase()}`;
  if (seenExpenseKeys.has(dupKey)) {
    anomalies.push({ row: rowNum, issue: `Possible duplicate of an earlier row (same date/amount/payer): "${description}"`, action: 'Row skipped' });
    return;
  }
  seenExpenseKeys.add(dupKey);

  // --- Resolve users ---
  const payer = getOrCreateUser(paidByRaw);
  const participantNames = splitWith ? splitWith.split(';').map(s => s.trim()) : [];
  const participants = participantNames.map(getOrCreateUser);

  // --- Insert expense ---
  const result = db.prepare(
    'INSERT INTO expenses (date, description, paid_by, amount, currency, split_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(date, description, payer.id, amount, currency, splitType, notes);
  const expenseId = result.lastInsertRowid;

  // --- Calculate splits ---
  if (splitType === 'equal') {
    const share = Math.round((amount / participants.length) * 100) / 100;
    participants.forEach(u => {
      db.prepare('INSERT INTO expense_splits (expense_id, user_id, share_amount) VALUES (?, ?, ?)')
        .run(expenseId, u.id, share);
    });
  } else if (splitType === 'unequal') {
    const parts = splitDetails.split(';').map(p => {
      const [name, amt] = p.trim().split(/\s+(?=\d)/); // split "Name 700" -> ["Name","700"]
      return { name: name.trim(), amount: parseAmount(amt) };
    });
    let sum = parts.reduce((s, p) => s + p.amount, 0);
    if (Math.abs(sum - amount) > 0.01) {
      anomalies.push({ row: rowNum, issue: `Unequal split amounts (${sum}) don't match total (${amount})`, action: 'Used as-is from CSV, flagged for review' });
    }
    parts.forEach(p => {
      const u = getOrCreateUser(p.name);
      db.prepare('INSERT INTO expense_splits (expense_id, user_id, share_amount) VALUES (?, ?, ?)')
        .run(expenseId, u.id, p.amount);
    });
  } else if (splitType === 'percentage') {
    const parts = splitDetails.split(';').map(p => {
      const match = p.trim().match(/^(.+?)\s+(\d+(\.\d+)?)%$/);
      return { name: match[1].trim(), pct: parseFloat(match[2]) };
    });
    const totalPct = parts.reduce((s, p) => s + p.pct, 0);
    if (Math.abs(totalPct - 100) > 0.01) {
      anomalies.push({ row: rowNum, issue: `Percentage split totals ${totalPct}%, not 100%`, action: `Normalized proportionally to sum to 100%` });
    }
    parts.forEach(p => {
      const normalizedPct = p.pct / totalPct; // normalize regardless of whether it summed to 100
      const share = Math.round(amount * normalizedPct * 100) / 100;
      const u = getOrCreateUser(p.name);
      db.prepare('INSERT INTO expense_splits (expense_id, user_id, share_amount) VALUES (?, ?, ?)')
        .run(expenseId, u.id, share);
    });
  } else if (splitType === 'share') {
    const parts = splitDetails.split(';').map(p => {
      const match = p.trim().match(/^(.+?)\s+(\d+(\.\d+)?)$/);
      return { name: match[1].trim(), shareCount: parseFloat(match[2]) };
    });
    const totalShares = parts.reduce((s, p) => s + p.shareCount, 0);
    parts.forEach(p => {
      const portion = p.shareCount / totalShares;
      const share = Math.round(amount * portion * 100) / 100;
      const u = getOrCreateUser(p.name);
      db.prepare('INSERT INTO expense_splits (expense_id, user_id, share_amount) VALUES (?, ?, ?)')
        .run(expenseId, u.id, share);
    });
  } else {
    anomalies.push({ row: rowNum, issue: `Unrecognized split_type "${splitType}" for "${description}"`, action: 'Expense recorded but no splits created' });
  }

  // --- Multi-currency flag ---
  if (currency !== 'INR') {
    anomalies.push({ row: rowNum, issue: `Expense "${description}" is in ${currency}, not INR`, action: 'Stored as-is with currency tag; not converted (see DECISIONS.md)' });
  }
});

// --- Write import report ---
fs.writeFileSync('import-report.json', JSON.stringify(anomalies, null, 2));
console.log(`Import complete. ${anomalies.length} anomalies found. See import-report.json`);