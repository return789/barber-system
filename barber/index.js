const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const db = require('./db');

const app = express();
const port = 3001;

// 中间件
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'barber-secret',
  resave: false,
  saveUninitialized: true
}));

// 静态文件
app.use(express.static('public'));

// 视图引擎
app.set('view engine', 'ejs');

// 初始化数据库
db.init();

// 登录验证中间件
function requireLogin(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

// 路由
app.get('/login', (req, res) => {
  res.render('login', { error: undefined });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // 简单的硬编码验证（实际项目中应该从数据库读取）
  if (username === 'admin' && password === 'admin123') {
    req.session.user = { username: 'admin' };
    res.redirect('/');
  } else {
    res.render('login', { error: '用户名或密码错误' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.get('/', requireLogin, (req, res) => {
  res.render('index');
});

// 会员管理路由
app.get('/members', requireLogin, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 10;

  db.getMembersCount((err, countResult) => {
    if (err) throw err;
    const totalMembers = countResult.count;
    const totalPages = Math.ceil(totalMembers / pageSize);

    db.getMembersWithPagination(page, pageSize, (err, members) => {
      if (err) throw err;

      db.getMemberStats((err, memberStats) => {
        if (err) throw err;

        res.render('members', {
          members,
          pagination: {
            page,
            pageSize,
            totalMembers,
            totalPages
          },
          memberStats
        });
      });
    });
  });
});

app.get('/members/add', requireLogin, (req, res) => {
  res.render('add-member');
});

app.post('/members/add', requireLogin, (req, res) => {
  const { name, phone, birthdate, membership_level } = req.body;
  db.addMember(name, phone, birthdate, membership_level, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('服务器错误');
      return;
    }
    res.redirect('/members');
  });
});

app.get('/members/edit/:id', requireLogin, (req, res) => {
  const id = req.params.id;
  db.getMemberById(id, (err, member) => {
    if (err) throw err;
    res.render('edit-member', { member });
  });
});

app.post('/members/edit/:id', requireLogin, (req, res) => {
  const id = req.params.id;
  const { name, phone, birthdate, membership_level } = req.body;
  db.updateMember(id, name, phone, birthdate, membership_level, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('服务器错误');
      return;
    }
    res.redirect('/members');
  });
});

app.get('/members/delete/:id', requireLogin, (req, res) => {
  const id = req.params.id;
  db.deleteMember(id, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('服务器错误');
      return;
    }
    res.redirect('/members');
  });
});

// 预约管理路由
app.get('/appointments', requireLogin, (req, res) => {
  db.getAllAppointments((err, appointments) => {
    if (err) throw err;
    // 确保按ID降序排序
    appointments.sort((a, b) => parseInt(b.id) - parseInt(a.id));
    res.render('appointments', { appointments });
  });
});

app.get('/appointments/add', requireLogin, (req, res) => {
  db.getAllMembers((err, members) => {
    if (err) throw err;
    res.render('add-appointment', { members });
  });
});

app.post('/appointments/add', requireLogin, (req, res) => {
  const { member_id, date, time, service } = req.body;
  db.addAppointment(member_id, date, time, service, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('服务器错误');
      return;
    }
    res.redirect('/appointments');
  });
});

app.get('/appointments/delete/:id', requireLogin, (req, res) => {
  const id = req.params.id;
  db.deleteAppointment(id, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('服务器错误');
      return;
    }
    res.redirect('/appointments');
  });
});

app.get('/appointments/confirm/:id', requireLogin, (req, res) => {
  console.log('预约确认路由被触发，ID:', req.params.id);
  const id = req.params.id;

  // 首先获取预约信息
  db.getAppointmentById(id, (err, appointment) => {
    if (err) {
      console.error('获取预约信息失败:', err);
      res.status(500).send('服务器错误');
      return;
    }

    if (!appointment) {
      res.status(404).send('预约不存在');
      return;
    }

    // 更新预约状态为已确认
    db.updateAppointmentStatus(id, '已确认', (err) => {
      if (err) {
        console.error('更新预约状态失败:', err);
        res.status(500).send('服务器错误');
        return;
      }

      console.log('预约状态更新成功，ID:', id);

      // 将预约转换为订单（默认金额为0，实际应用中可能需要根据服务类型设置金额）
      const amount = 0; // 可以根据服务类型设置不同的金额
      const description = `预约服务：${appointment.service} (${appointment.date} ${appointment.time})`;

      db.addTransaction(appointment.member_id, amount, appointment.date, description, (err) => {
        if (err) {
          console.error('添加订单失败:', err);
          res.status(500).send('服务器错误');
          return;
        }

        // 注意：此处请求的“窗口防抖”通常用于前端浏览器环境，而后端 Node.js (Express) 环境中没有 window 对象。
        // 如果这是为了测试或占位，以下是一个标准的防抖函数实现。
        // 在实际后端逻辑中，防抖通常不直接应用于路由处理，除非有特定的并发控制需求。
        function debounce(func, wait) {
          let timeout;
          return function executedFunction(...args) {
            const later = () => {
              clearTimeout(timeout);
              func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
          };
        }


        console.log('预约转换为订单成功');
        res.redirect('/appointments');
      });
    });
  });
});

// 消费记录路由
app.get('/transactions', requireLogin, (req, res) => {
  db.getAllTransactions((err, transactions) => {
    if (err) throw err;
    res.render('transactions', { transactions });
  });
});

app.get('/transactions/add', requireLogin, (req, res) => {
  db.getAllMembers((err, members) => {
    if (err) throw err;
    res.render('add-transaction', { members });
  });
});

app.post('/transactions/add', requireLogin, (req, res) => {
  const { member_id, amount, date, description } = req.body;
  db.addTransaction(member_id, amount, date, description, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('服务器错误');
      return;
    }
    // 更新会员积分
    db.updateMemberPoints(member_id, amount * 0.1, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send('服务器错误');
        return;
      }
      res.redirect('/transactions');
    });
  });
});

// 订单管理路由
app.get('/orders', requireLogin, (req, res) => {
  db.getAllTransactions((err, transactions) => {
    if (err) throw err;
    res.render('orders', { transactions });
  });
});

app.get('/orders/add', requireLogin, (req, res) => {
  db.getAllMembers((err, members) => {
    if (err) throw err;
    res.render('add-order', { members });
  });
});

app.post('/orders/add', requireLogin, (req, res) => {
  const { member_id, amount, date, description } = req.body;
  db.addTransaction(member_id, amount, date, description, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('服务器错误');
      return;
    }
    // 更新会员积分
    db.updateMemberPoints(member_id, amount * 0.1, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send('服务器错误');
        return;
      }
      res.redirect('/orders');
    });
  });
});

// 搜索会员API
app.get('/api/search-members', requireLogin, (req, res) => {
  const keyword = req.query.keyword || '';
  if (!keyword) {
    res.json([]);
    return;
  }
  db.searchMembers(keyword, (err, members) => {
    if (err) {
      console.error(err);
      res.status(500).json([]);
      return;
    }
    res.json(members);
  });
});

app.get('/orders/process/:id', requireLogin, (req, res) => {
  const id = req.params.id;
  // 获取订单信息
  db.getTransactionById(id, (err, transaction) => {
    if (err) {
      console.error(err);
      res.status(500).send('服务器错误');
      return;
    }
    if (!transaction) {
      res.status(404).send('订单不存在');
      return;
    }
    res.render('process-order', { transaction });
  });
});

app.post('/orders/process/:id', requireLogin, (req, res) => {
  const id = req.params.id;
  const { amount } = req.body;

  // 验证金额
  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) < 0) {
    res.status(400).send('无效的金额');
    return;
  }

  const newAmount = parseFloat(amount);

  // 获取订单信息
  db.getTransactionById(id, (err, transaction) => {
    if (err) {
      console.error(err);
      res.status(500).send('服务器错误');
      return;
    }
    if (!transaction) {
      res.status(404).send('订单不存在');
      return;
    }

    // 更新订单金额
    db.updateTransactionAmount(id, newAmount, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send('服务器错误');
        return;
      }

      // 扣除会员余额
      db.updateMemberBalance(transaction.member_id, -newAmount, (err) => {
        if (err) {
          console.error(err);
          res.status(500).send('服务器错误');
          return;
        }
        // 更新订单状态
        db.updateTransactionStatus(id, '已处理', (err) => {
          if (err) {
            console.error(err);
            res.status(500).send('服务器错误');
            return;
          }
          // 更新会员积分（消费后获得积分）
          db.updateMemberPoints(transaction.member_id, newAmount * 0.1, (err) => {
            if (err) {
              console.error(err);
              res.status(500).send('服务器错误');
              return;
            }
            console.log('订单处理完成，会员积分已更新');
            res.redirect('/orders');
          });
        });
      });
    });
  });
});

app.get('/orders/cancel/:id', requireLogin, (req, res) => {
  const id = req.params.id;
  // 更新订单状态为已取消
  db.updateTransactionStatus(id, '已取消', (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('服务器错误');
      return;
    }
    res.redirect('/orders');
  });
});

// 余额管理路由
app.get('/balance', requireLogin, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 10;

  db.getMembersCount((err, countResult) => {
    if (err) throw err;
    const totalMembers = countResult.count;
    const totalPages = Math.ceil(totalMembers / pageSize);

    db.getMembersWithPagination(page, pageSize, (err, members) => {
      if (err) throw err;

      db.getMemberStats((err, memberStats) => {
        if (err) throw err;

        res.render('balance', {
          members,
          pagination: {
            page,
            pageSize,
            totalMembers,
            totalPages
          },
          balanceStats: {
            totalMembers: memberStats.totalMembers,
            totalBalance: memberStats.totalBalance,
            maxBalance: memberStats.maxBalance,
            avgBalance: memberStats.avgBalance
          }
        });
      });
    });
  });
});

app.get('/balance/edit/:id', requireLogin, (req, res) => {
  const id = req.params.id;
  db.getMemberById(id, (err, member) => {
    if (err) throw err;
    res.render('edit-balance', { member });
  });
});

app.post('/balance/edit/:id', requireLogin, (req, res) => {
  const id = req.params.id;
  const { amount, type } = req.body;
  // 根据类型确定金额正负
  const balanceChange = type === 'add' ? parseFloat(amount) : -parseFloat(amount);

  db.updateMemberBalance(id, balanceChange, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('服务器错误');
      return;
    }
    res.redirect('/balance');
  });
});

// 数据统计路由
app.get('/stats', requireLogin, (req, res) => {
  db.getStats((err, stats) => {
    if (err) throw err;
    res.render('stats', { stats });
  });
});

// 测试排序路由
app.get('/test-sort', requireLogin, (req, res) => {
  db.getAllTransactions((err, transactions) => {
    if (err) throw err;
    console.log('Original:', transactions.map(t => t.id));
    transactions.sort((a, b) => parseInt(b.id) - parseInt(a.id));
    console.log('Sorted:', transactions.map(t => t.id));
    res.json({
      original: transactions.map(t => t.id),
      sorted: transactions.sort((a, b) => parseInt(b.id) - parseInt(a.id)).map(t => t.id)
    });
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
