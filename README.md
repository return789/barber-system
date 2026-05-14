# 理发店管理系统 (Barber Management System)

一个基于 Node.js + Express + SQLite 的理发店管理系统，提供会员管理、订单处理、预约管理等功能。

## 功能特性

- **会员管理** - 新增、编辑、查看会员信息，支持余额管理
- **订单管理** - 创建订单、处理订单、订单列表展示
- **预约管理** - 预约记录的创建与管理
- **交易记录** - 查看所有交易流水
- **数据统计** - 销售统计与数据可视化
- **用户认证** - 登录系统保护

## 技术栈

- **框架**: Express.js 5.x
- **模板引擎**: EJS
- **数据库**: SQLite3
- **会话管理**: express-session
- **请求解析**: body-parser

## 项目结构

```
barber/
├── views/                 # EJS 视图模板
│   ├── login.ejs          # 登录页面
│   ├── index.ejs          # 首页
│   ├── members.ejs        # 会员列表
│   ├── add-member.ejs     # 添加会员
│   ├── edit-member.ejs    # 编辑会员
│   ├── orders.ejs         # 订单列表
│   ├── add-order.ejs      # 添加订单
│   ├── process-order.ejs  # 处理订单
│   ├── appointments.ejs   # 预约管理
│   ├── add-appointment.ejs# 添加预约
│   ├── balance.ejs        # 余额管理
│   ├── edit-balance.ejs   # 编辑余额
│   ├── transactions.ejs   # 交易记录
│   └── stats.ejs          # 统计页面
├── public/                # 静态资源
│   ├── style.css          # 样式文件
│   └── confirm.js         # 确认对话框脚本
├── barber.db              # SQLite 数据库文件
├── db.js                  # 数据库操作模块
├── index.js               # 应用入口文件
└── package.json           # 项目配置
```

## 安装运行

### 环境要求

- Node.js >= 14.0.0
- npm >= 6.0.0

### 安装依赖

```bash
cd barber
npm install
```

### 启动服务

```bash
node index.js
```

服务器将在 `http://localhost:3000` 启动。

## 使用说明

### 登录系统

1. 访问 `http://localhost:3000`
2. 使用默认管理员账号登录（如需修改密码，请查看 `index.js` 文件）

### 功能模块

1. **首页** - 展示系统概览和快捷操作
2. **会员管理** - 管理会员信息和余额
3. **订单管理** - 创建和处理服务订单
4. **预约管理** - 管理客户预约
5. **交易记录** - 查看所有交易历史
6. **数据统计** - 查看业务统计数据

## 数据库结构

### 会员表 (members)
- id: 会员ID
- name: 会员姓名
- phone: 联系电话
- balance: 余额
- created_at: 创建时间

### 订单表 (orders)
- id: 订单ID
- member_id: 会员ID
- service: 服务项目
- price: 价格
- status: 状态
- created_at: 创建时间

### 预约表 (appointments)
- id: 预约ID
- member_id: 会员ID
- date: 预约日期
- time: 预约时间
- service: 服务项目
- status: 状态

### 交易表 (transactions)
- id: 交易ID
- member_id: 会员ID
- type: 交易类型
- amount: 金额
- description: 描述
- created_at: 交易时间

## 开发说明

### 添加新功能

1. 在 `db.js` 中添加数据库操作函数
2. 在 `index.js` 中添加路由
3. 在 `views/` 中创建对应的 EJS 模板

### 测试

```bash
npm test
```

## 许可证

MIT License

## 作者

理发店管理系统开发团队