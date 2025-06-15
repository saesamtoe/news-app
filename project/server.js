// server.js
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { Configuration, OpenAIApi } = require("openai");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.NEWS_API_KEY;
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

const upload = multer({ dest: 'uploads/' });

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

// 이미지 분류 API
app.post('/classify-image', upload.single('image'), async (req, res) => {
  try {
    const imagePath = req.file.path;
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    const response = await openai.createChatCompletion({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "이 이미지의 주제를 짧게 분류해주세요. (예: 뉴스, 음식, 동물 등)" },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
          ],
        },
      ],
    });

    fs.unlinkSync(imagePath); // 임시 이미지 삭제
    res.json({ category: response.data.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "이미지 분류 실패" });
  }
});

// 기본 라우트
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
