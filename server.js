const express = require('express');
const db = require('./db');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const USD_TO_INR = 86;

app.use(express.static('public'));
app.use(express.json());

// API: get balances
app.get('/api/balances', (req, res) => {
  const users = db.prepare('SELECT * FROM users').all();
  const balanceMap = {};
  users.forEach(u => balanceMap[u.id] = 0);

  const expenses = db.prepare('SELECT * FROM expenses').all();
  expenses.forEach(exp => {
    const rate = exp.currency === 'USD' ? USD_TO_INR : 1;
    balanceMap[exp.paid_by] += exp.amount * rate;
    const splits = db.prepare('SELECT * FROM expense_splits WHERE expense_id = ?').all(exp.id);
    splits.forEach(s => {
      balanceMap[s.user_id] -= s.share_amount * rate;
    });
  });

  const settlements = db.prepare('SELECT * FROM settlements').all();
  settlements.forEach(s => {
    const rate = s.currency === 'USD' ? USD_TO_INR : 1;
    balanceMap[s.from_user] += s.amount * rate;
    balanceMap[s.to_user] -= s.amount * rate;
  });

  const result = users.map(u => ({
    name: u.name,
    balance: Math.round(balanceMap[u.id] * 100) / 100
  }));

  res.json(result);
});

// API: get all expenses
app.get('/api/expenses', (req, res) => {
  const expenses = db.prepare(`
    SELECT e.*, u.name as paid_by_name
    FROM expenses e
    JOIN users u ON e.paid_by = u.id
    ORDER BY e.date
  `).all();
  res.json(expenses);
});

// API: get settlements
app.get('/api/settlements', (req, res) => {
  const settlements = db.prepare(`
    SELECT s.*, u1.name as from_name, u2.name as to_name
    FROM settlements s
    JOIN users u1 ON s.from_user = u1.id
    JOIN users u2 ON s.to_user = u2.id
  `).all();
  res.json(settlements);
});

// API: get import report
app.get('/api/import-report', (req, res) => {
  try {
    const report = JSON.parse(fs.readFileSync('import-report.json', 'utf-8'));
    res.json(report);
  } catch {
    res.json([]);
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));