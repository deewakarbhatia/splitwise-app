const db = require('./db');

const exps = db.prepare(
  "SELECT * FROM expenses WHERE split_type='percentage'"
).all();

exps.forEach(e => {
  console.log('EXPENSE:', e);

  const splits = db.prepare(
    'SELECT * FROM expense_splits WHERE expense_id=?'
  ).all(e.id);

  console.log('SPLITS:', splits);

  const total = splits.reduce(
    (sum, s) => sum + s.share_amount,
    0
  );

  console.log('Expense Amount:', e.amount);
  console.log('Split Total:', total);
  console.log('Difference:', e.amount - total);
  console.log('----------------');
});