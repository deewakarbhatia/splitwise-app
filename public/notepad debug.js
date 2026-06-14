const db = require('./db');
const exps = db.prepare("SELECT * FROM expenses WHERE split_type='percentage'").all();
exps.forEach(e => {
    console.log('EXPENSE:', e);
    console.log('SPLITS:', db.prepare('SELECT * FROM expense_splits WHERE expense_id=?').all(e.id));
    console.log('----------------');
});