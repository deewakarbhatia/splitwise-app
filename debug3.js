const fs = require('fs');
const { parse } = require('csv-parse/sync');
const recs = parse(fs.readFileSync('Expenses Export.csv', 'utf-8'), { columns: true, skip_empty_lines: true });

recs.forEach((r, i) => {
  if (r.split_type === 'share') {
    console.log('ROW', i + 2, r);
  }
});