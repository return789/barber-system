// 测试排序逻辑
const transactions = [
  { id: 4, name: '张三', amount: 200, date: '2026-03-18' },
  { id: 5, name: '李四', amount: 100, date: '2026-03-18' },
  { id: 6, name: '李四', amount: 200, date: '2026-03-18' },
  { id: 1, name: '朱牛弟', amount: 20, date: '2026-03-17' },
  { id: 2, name: '小赖', amount: 50, date: '2026-03-17' },
  { id: 3, name: '小赖', amount: 68, date: '2026-03-17' }
];

console.log('原始数据:', transactions.map(t => t.id));

// 测试排序逻辑
transactions.sort((a, b) => parseInt(b.id) - parseInt(a.id));

console.log('排序后数据:', transactions.map(t => t.id));

// 测试另一种排序方法
const sortedTransactions = [...transactions].sort((a, b) => {
  return parseInt(b.id) - parseInt(a.id);
});

console.log('另一种排序方法:', sortedTransactions.map(t => t.id));
