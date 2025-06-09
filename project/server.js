// server.js
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.NEWS_API_KEY;

app.use(express.static(path.join(__dirname, 'public')));

// 뉴스 API 프록시
app.get('/news', async (req, res) => {
  const query = req.query.q || '한국';
  try {
    const response = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=ko&pageSize=10&sortBy=publishedAt&apiKey=${API_KEY}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('뉴스 요청 실패:', err);
    res.status(500).json({ error: '뉴스 요청 실패' });
  }
});

// 기본 라우트
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
