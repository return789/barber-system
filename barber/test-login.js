const axios = require('axios');

async function testLogin() {
  try {
    // 测试直接访问首页应该重定向到登录
    console.log('测试1: 直接访问首页');
    const response1 = await axios.get('http://localhost:3000', { 
      maxRedirects: 0,
      validateStatus: false 
    });
    console.log('状态码:', response1.status);
    console.log('重定向到:', response1.headers.location);
    console.log('');

    // 测试登录功能
    console.log('测试2: 尝试登录');
    const response2 = await axios.post('http://localhost:3000/login', {
      username: 'admin',
      password: 'admin123'
    }, {
      maxRedirects: 0,
      validateStatus: false
    });
    console.log('登录状态码:', response2.status);
    console.log('登录后重定向到:', response2.headers.location);
    console.log('');

    // 测试登录失败
    console.log('测试3: 尝试错误登录');
    const response3 = await axios.post('http://localhost:3000/login', {
      username: 'wrong',
      password: 'wrong'
    }, {
      maxRedirects: 0,
      validateStatus: false
    });
    console.log('错误登录状态码:', response3.status);
    console.log('是否返回登录页面:', response3.status === 200);
    console.log('');

  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

testLogin();