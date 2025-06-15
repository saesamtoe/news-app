// server.js (OpenAI v4 적용 + 이미지 카테고리 분석 포함)
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.NEWS_API_KEY;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

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

// 이미지 업로드용 폴더
const upload = multer({ dest: 'uploads/' });

// 이미지 카테고리 분석
app.post('/analyze-image', upload.single('image'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const imageData = fs.readFileSync(filePath);

    const response = await openai.images.createVariation({
      image: imageData,
      n: 1,
      size: "256x256"
    });

    // 향후 이미지 분류 API나 모델 연결 가능
    res.json({ category: '분류 모델 미연결', preview: response.data[0]?.url });

    fs.unlinkSync(filePath);
  } catch (err) {
    console.error('이미지 분석 실패:', err);
    res.status(500).json({ error: '이미지 분석 실패' });
  }
});

// 기본 라우트
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
