const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./barber.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the barber database.');
});

// 测试预约数据排序
db.all(`
  SELECT appointments.*, members.name as member_name 
  FROM appointments 
  LEFT JOIN members ON appointments.member_id = members.id 
  ORDER BY appointments.id DESC
`, (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Appointments ordered by ID DESC:');
    rows.forEach(row => {
      console.log(`ID: ${row.id}, Name: ${row.member_name}, Date: ${row.date}`);
    });
  }
  db.close();
});
