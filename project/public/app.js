// app.js

const BACKEND_URL = 'https://news-app-ystt.onrender.com'; // Render 배포 주소
const today = new Date().toISOString().slice(0, 10);
const bookmarkKey = 'bookmarkedNews';
let credibilityScores = [];

const lastFetched = localStorage.getItem('lastFetched');
if (lastFetched !== today) {
  fetchNews();
  localStorage.setItem('lastFetched', today);
} else {
  loadFromStorage();
}

function fetchNews(keyword = '한국') {
  fetch(`${BACKEND_URL}/news?q=${encodeURIComponent(keyword)}`)
    .then(res => res.json())
    .then(data => {
      localStorage.setItem('newsapi', JSON.stringify(data.articles));
      credibilityScores = [];
      renderNews(data.articles, []);
    });
}

function searchNews() {
  const keyword = document.getElementById('search-input').value.trim();
  if (!keyword) return alert('검색어를 입력해주세요.');

  fetch(`${BACKEND_URL}/news?q=${encodeURIComponent(keyword)}`)
    .then(res => res.json())
    .then(data => {
      localStorage.setItem('newsapi', JSON.stringify(data.articles));
      credibilityScores = [];
      renderNews(data.articles, []);
    });
}

function loadFromStorage() {
  const articles = JSON.parse(localStorage.getItem('newsapi') || '[]');
  const hackerNews = JSON.parse(localStorage.getItem('hackernews') || '[]');
  renderNews(articles, hackerNews);
}

function renderNews(newsapiArticles, hackerNewsItems) {
  renderSection(newsapiArticles, document.getElementById('newsapi-container'));
  renderSection(hackerNewsItems, document.getElementById('hackernews-container'));
  renderBookmarks();
  document.getElementById('last-updated').innerText = `마지막 업데이트: ${today}`;
}

function renderSection(articles, container) {
  container.innerHTML = '';
  articles.forEach(article => {
    const url = article.url || article.link || '';
    const title = article.title || '';
    const content = article.description || '';

    const div = document.createElement('div');
    div.className = 'article';

    const isBookmarked = getBookmarks().some(b => b.url === url);
    const star = `<span class="bookmark-btn ${isBookmarked ? 'active' : ''}" onclick="toggleBookmark('${encodeURIComponent(url)}', '${encodeURIComponent(title)}', this)">★</span>`;

    const analyzeBtn = `<button class="credibility-btn" onclick="analyzeCredibility('${encodeURIComponent(title)}', '${encodeURIComponent(content)}', this)">🧠 신뢰도 평가</button>`;
    const ratingDisplay = `<div class="rating-display"></div>`;

    div.innerHTML = `
      ${star}
      <strong>${title}</strong><br>
      <a href="${url}" target="_blank">[원문 보기]</a><br>
      ${analyzeBtn}
      ${ratingDisplay}
    `;

    container.appendChild(div);
  });
  updateAverageScore();
}

function analyzeCredibility(titleEncoded, contentEncoded, el) {
  const title = decodeURIComponent(titleEncoded);
  const content = decodeURIComponent(contentEncoded);
  el.disabled = true;
  el.textContent = '🧠 평가 중...';

  fetch(`${BACKEND_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content })
  })
    .then(res => res.json())
    .then(data => {
      const result = data.result;
      el.textContent = `🧠 신뢰도: ${result}`;

      const ratingEl = el.nextElementSibling;
      let stars = '';
      let score = 0;

      if (result.includes('높음')) {
        stars = '⭐⭐⭐⭐⭐'; score = 5;
      } else if (result.includes('중간')) {
        stars = '⭐⭐⭐'; score = 3;
      } else if (result.includes('낮음')) {
        stars = '⭐'; score = 1;
      } else {
        stars = '❓'; score = 0;
      }

      ratingEl.textContent = `별점: ${stars}`;
      credibilityScores.push(score);
      updateAverageScore();
    })
    .catch(err => {
      el.textContent = '❌ 평가 실패';
    });
}

function updateAverageScore() {
  const avgContainer = document.getElementById('average-credibility');
  if (!avgContainer) return;
  if (credibilityScores.length === 0) {
    avgContainer.textContent = '평균 신뢰도: 없음';
    return;
  }
  const sum = credibilityScores.reduce((a, b) => a + b, 0);
  const avg = (sum / credibilityScores.length).toFixed(1);
  avgContainer.textContent = `🧮 평균 신뢰도: ${avg}점`;
}

function getBookmarks() {
  return JSON.parse(localStorage.getItem(bookmarkKey) || '[]');
}

function toggleBookmark(urlEncoded, titleEncoded, el) {
  const url = decodeURIComponent(urlEncoded);
  const title = decodeURIComponent(titleEncoded);
  let bookmarks = getBookmarks();
  const index = bookmarks.findIndex(b => b.url === url);
  if (index >= 0) {
    bookmarks.splice(index, 1);
    el.classList.remove('active');
  } else {
    bookmarks.push({ url, title });
    el.classList.add('active');
  }
  localStorage.setItem(bookmarkKey, JSON.stringify(bookmarks));
  renderBookmarks();
}

function renderBookmarks() {
  const container = document.getElementById('bookmark-container');
  container.innerHTML = '';
  getBookmarks().forEach(({ title, url }) => {
    const div = document.createElement('div');
    div.className = 'article';
    div.innerHTML = `
      <strong>${title}</strong><br>
      <a href="${url}" target="_blank">[원문 보기]</a>
    `;
    container.appendChild(div);
  });
}

function showTab(tab) {
  document.getElementById('main-tab').style.display = (tab === 'main') ? 'block' : 'none';
  document.getElementById('bookmarks-tab').style.display = (tab === 'bookmarks') ? 'block' : 'none';
}
