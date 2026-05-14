const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./barber.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the barber database.');
});

// 初始化数据库
function init() {
  // 创建会员表
  db.run(`CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    birthdate TEXT,
    membership_level TEXT DEFAULT '普通',
    points INTEGER DEFAULT 0,
    balance REAL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // 创建预约表
  db.run(`CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    service TEXT NOT NULL,
    status TEXT DEFAULT '待确认',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id)
  )`);

  // 创建消费记录表
  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT '待处理',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id)
  )`);
}

// 会员管理
function getAllMembers(callback) {
  db.all(`SELECT * FROM members ORDER BY created_at DESC`, callback);
}

function getMemberById(id, callback) {
  db.get(`SELECT * FROM members WHERE id = ?`, [id], callback);
}

function addMember(name, phone, birthdate, membership_level, callback) {
  db.run(`INSERT INTO members (name, phone, birthdate, membership_level) VALUES (?, ?, ?, ?)`, 
    [name, phone, birthdate, membership_level], callback);
}

function updateMember(id, name, phone, birthdate, membership_level, callback) {
  db.run(`UPDATE members SET name = ?, phone = ?, birthdate = ?, membership_level = ? WHERE id = ?`, 
    [name, phone, birthdate, membership_level, id], callback);
}

function deleteMember(id, callback) {
  db.run(`DELETE FROM members WHERE id = ?`, [id], callback);
}

function updateMemberPoints(member_id, points, callback) {
  db.run(`UPDATE members SET points = points + ? WHERE id = ?`, [points, member_id], callback);
}

function updateMemberBalance(member_id, amount, callback) {
  db.run(`UPDATE members SET balance = balance + ? WHERE id = ?`, [amount, member_id], callback);
}

function getMemberBalance(member_id, callback) {
  db.get(`SELECT balance FROM members WHERE id = ?`, [member_id], callback);
}

function searchMembers(keyword, callback) {
  db.all(`SELECT * FROM members WHERE phone LIKE ? OR phone LIKE ? ORDER BY created_at DESC`, [`%${keyword}%`, `%${keyword.slice(-4)}%`], callback);
}

function getMembersWithPagination(page, pageSize, callback) {
  const offset = (page - 1) * pageSize;
  db.all(`SELECT * FROM members ORDER BY created_at DESC LIMIT ? OFFSET ?`, [pageSize, offset], callback);
}

function getMembersCount(callback) {
  db.get(`SELECT COUNT(*) as count FROM members`, callback);
}

function getMemberStats(callback) {
  const stats = {};

  db.get(`SELECT COUNT(*) as totalMembers, SUM(balance) as totalBalance, SUM(points) as totalPoints, AVG(balance) as avgBalance, MAX(balance) as maxBalance FROM members`, (err, result) => {
    if (err) { callback(err); return; }
    stats.totalMembers = result.totalMembers || 0;
    stats.totalBalance = result.totalBalance || 0;
    stats.totalPoints = result.totalPoints || 0;
    stats.avgBalance = result.avgBalance || 0;
    stats.maxBalance = result.maxBalance || 0;

    db.all(`SELECT membership_level, COUNT(*) as count FROM members GROUP BY membership_level`, (err, levelResult) => {
      if (err) { callback(err); return; }
      const levelMap = {};
      (levelResult || []).forEach(item => {
        levelMap[item.membership_level] = item.count;
      });
      stats.normalCount = levelMap['普通'] || 0;
      stats.goldCount = levelMap['黄金'] || 0;
      stats.diamondCount = levelMap['钻石'] || 0;
      callback(null, stats);
    });
  });
}

// 预约管理
function getAllAppointments(callback) {
  db.all(`
    SELECT appointments.*, members.name as member_name 
    FROM appointments 
    LEFT JOIN members ON appointments.member_id = members.id 
    ORDER BY appointments.id DESC
  `, (err, rows) => {
    if (err) {
      callback(err);
    } else {
      // 确保按ID降序排序
      rows.sort((a, b) => parseInt(b.id) - parseInt(a.id));
      callback(null, rows);
    }
  });
}

function addAppointment(member_id, date, time, service, callback) {
  db.run(`INSERT INTO appointments (member_id, date, time, service) VALUES (?, ?, ?, ?)`, 
    [member_id, date, time, service], callback);
}

function deleteAppointment(id, callback) {
  db.run(`DELETE FROM appointments WHERE id = ?`, [id], callback);
}

function updateAppointmentStatus(id, status, callback) {
  db.run(`UPDATE appointments SET status = ? WHERE id = ?`, [status, id], callback);
}

function getAppointmentById(id, callback) {
  db.get(`SELECT appointments.*, members.name as member_name FROM appointments LEFT JOIN members ON appointments.member_id = members.id WHERE appointments.id = ?`, [id], callback);
}

// 消费记录管理
function getAllTransactions(callback) {
  db.all(`
    SELECT transactions.*, members.name as member_name 
    FROM transactions 
    LEFT JOIN members ON transactions.member_id = members.id 
    ORDER BY transactions.id DESC
  `, (err, rows) => {
    if (err) {
      callback(err);
    } else {
      // 确保按ID降序排序
      rows.sort((a, b) => parseInt(b.id) - parseInt(a.id));
      callback(null, rows);
    }
  });
}

function addTransaction(member_id, amount, date, description, callback) {
  db.run(`INSERT INTO transactions (member_id, amount, date, description) VALUES (?, ?, ?, ?)`, 
    [member_id, amount, date, description], callback);
}

function getTransactionById(id, callback) {
  db.get(`SELECT transactions.*, members.name as member_name FROM transactions LEFT JOIN members ON transactions.member_id = members.id WHERE transactions.id = ?`, [id], callback);
}

function updateTransactionStatus(id, status, callback) {
  db.run(`UPDATE transactions SET status = ? WHERE id = ?`, [status, id], callback);
}

function updateTransactionAmount(id, amount, callback) {
  db.run(`UPDATE transactions SET amount = ? WHERE id = ?`, [amount, id], callback);
}

// 数据统计
function getStats(callback) {
  const stats = {};
  
  db.get(`SELECT COUNT(*) as count FROM members`, (err, result) => {
    if (err) callback(err);
    stats.memberCount = result.count;
    
    const today = new Date().toISOString().split('T')[0];
    db.get(`SELECT COUNT(*) as count FROM appointments WHERE date = ?`, [today], (err, result) => {
      if (err) callback(err);
      stats.todayAppointments = result.count;
      
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      db.get(`SELECT SUM(amount) as total FROM transactions WHERE date >= ?`, [monthStart], (err, result) => {
        if (err) callback(err);
        stats.monthlySales = result.total || 0;
        
        db.all(`SELECT membership_level, COUNT(*) as count FROM members GROUP BY membership_level`, (err, result) => {
          if (err) callback(err);
          stats.membershipDistribution = result;
          
          db.get(`SELECT COUNT(*) as count FROM transactions`, (err, result) => {
            if (err) callback(err);
            stats.totalTransactions = result.count;
            
            db.get(`SELECT SUM(balance) as total FROM members`, (err, result) => {
              if (err) callback(err);
              stats.totalBalance = result.total || 0;
              
              db.get(`SELECT AVG(amount) as avg FROM transactions WHERE status = '已处理'`, (err, result) => {
                if (err) callback(err);
                stats.avgTransaction = result.avg || 0;
                
                db.get(`SELECT COUNT(*) as count FROM appointments WHERE status = '待确认'`, (err, result) => {
                  if (err) callback(err);
                  stats.pendingAppointments = result.count;
                  
                  db.get(`SELECT SUM(points) as total FROM members`, (err, result) => {
                    if (err) callback(err);
                    stats.totalPoints = result.total || 0;
                    
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    db.all(`SELECT date, SUM(amount) as total FROM transactions WHERE date >= ? GROUP BY date ORDER BY date`, [weekAgo], (err, result) => {
                      if (err) callback(err);
                      stats.weeklySales = result;
                      callback(null, stats);
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

module.exports = {
  init,
  getAllMembers,
  getMemberById,
  addMember,
  updateMember,
  deleteMember,
  updateMemberPoints,
  updateMemberBalance,
  getMemberBalance,
  searchMembers,
  getMembersWithPagination,
  getMembersCount,
  getMemberStats,
  getAllAppointments,
  getAppointmentById,
  addAppointment,
  deleteAppointment,
  updateAppointmentStatus,
  getAllTransactions,
  getTransactionById,
  updateTransactionStatus,
  updateTransactionAmount,
  addTransaction,
  getStats
};
