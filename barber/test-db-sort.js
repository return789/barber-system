const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./barber.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the barber database.');
});

// 测试数据库查询
console.log('Testing database query...');
db.all(`
  SELECT transactions.*, members.name as member_name 
  FROM transactions 
  LEFT JOIN members ON transactions.member_id = members.id 
  ORDER BY transactions.id DESC
`, (err, rows) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Query result:', rows.map(row => row.id));
    
    // 测试排序
    console.log('\nTesting sorting...');
    const sortedRows = [...rows].sort((a, b) => {
      return parseInt(b.id) - parseInt(a.id);
    });
    console.log('Sorted result:', sortedRows.map(row => row.id));
  }
  db.close();
});
