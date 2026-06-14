const db = require('./db');

// Get all users
const users = db.prepare('SELECT * FROM users').all();
const balanceMap = {}; // user_id -> net balance (positive = others owe them)
users.forEach(u => balanceMap[u.id] = 0);

// For each expense: payer gets credited full amount, each participant gets debited their share
const USD_TO_INR = 86; // fixed rate as of June 2026 — see DECISIONS.md

const expenses = db.prepare('SELECT * FROM expenses').all();
expenses.forEach(exp => {
    const rate = exp.currency === 'USD' ? USD_TO_INR : 1;
    balanceMap[exp.paid_by] += exp.amount * rate;
    const splits = db.prepare('SELECT * FROM expense_splits WHERE expense_id = ?').all(exp.id);
    splits.forEach(s => {
        balanceMap[s.user_id] -= s.share_amount * rate;
    });
});
// Apply settlements: from_user paid to_user, so from_user's "owed" decreases, to_user's "owed" increases
const settlements = db.prepare('SELECT * FROM settlements').all();
settlements.forEach(s => {
    const rate = s.currency === 'USD' ? USD_TO_INR : 1;
    balanceMap[s.from_user] += s.amount * rate;
    balanceMap[s.to_user] -= s.amount * rate;
});
// Print results
console.log('--- Net Balances (INR) ---');
users.forEach(u => {
    const bal = Math.round(balanceMap[u.id] * 100) / 100;
    if (bal > 0) {
        console.log(`${u.name} is owed ₹${bal} overall`);
    } else if (bal < 0) {
        console.log(`${u.name} owes ₹${Math.abs(bal)} overall`);
    } else {
        console.log(`${u.name} is settled up`);
    }
});

// USD-only summary (flagged, not converted)
console.log('\n--- USD Expenses (not converted, see DECISIONS.md) ---');
const usdExpenses = db.prepare("SELECT * FROM expenses WHERE currency != 'INR'").all();
usdExpenses.forEach(e => {
    console.log(`${e.description}: ${e.amount} ${e.currency} (paid by user_id ${e.paid_by})`);
});