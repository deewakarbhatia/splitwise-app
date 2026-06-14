const db = require('./db');
const exps = db.prepare("SELECT * FROM expenses").all();
let totalAmount = 0;
let totalSplits = 0;

exps.forEach(e => {
  const rate = e.currency === 'USD' ? 86 : 1;
  const splits = db.prepare('SELECT * FROM expense_splits WHERE expense_id=?').all(e.id);
  const splitSum = splits.reduce((s, x) => s + x.share_amount, 0);
  const amtINR = e.amount * rate;
  const splitSumINR = splitSum * rate;

  totalAmount += amtINR;
  totalSplits += splitSumINR;

  const diff = amtINR - splitSumINR;
  if (Math.abs(diff) > 1) {
    console.log(`MISMATCH id=${e.id} "${e.description}" amount=${amtINR} splitSum=${splitSumINR} diff=${diff} (split_type=${e.split_type}, participants=${splits.length})`);
  }
});

console.log('TOTAL AMOUNT (INR):', totalAmount);
console.log('TOTAL SPLITS (INR):', totalSplits);
console.log('DIFF:', totalAmount - totalSplits);