// app.js (AI 판단 기능 제거, 검색 기능 복구)

const NEWS_API_KEY = 'YOUR_API_KEY';
const today = new Date().toISOString().slice(0, 10);
const bookmarkKey = 'bookmarkedNews';

const lastFetched = localStorage.getItem('lastFetched');
if (lastFetched !== today) {
  fetchNews();
  localStorage.setItem('lastFetched', today);
} else {
  loadFromStorage();
}

function fetchNews(query = '한국') {
  fetch(`/news?q=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      localStorage.setItem('newsapi', JSON.stringify(data.articles));
      renderNews(data.articles);
    });
}

function loadFromStorage() {
  const articles = JSON.parse(localStorage.getItem('newsapi') || '[]');
  renderNews(articles);
}

function renderNews(newsapiArticles) {
  const container = document.getElementById('newsapi-container');
  container.innerHTML = '';

  newsapiArticles.forEach(article => {
    const url = article.url || '';
    const title = article.title || '';
    const description = article.description || '';

    const div = document.createElement('div');
    div.className = 'article';

    const star = `<span class="bookmark-btn" onclick="toggleBookmark('${encodeURIComponent(url)}', '${encodeURIComponent(title)}', this)">★</span>`;
    div.innerHTML = `
      ${star}
      <strong>${title}</strong><br>
      <p>${description}</p>
      <a href="${url}" target="_blank">[원문 보기]</a>
    `;
    container.appendChild(div);
  });

  document.getElementById('last-updated').innerText = `마지막 업데이트: ${today}`;
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
  if (tab === 'main') {
    fetchNews('한국');
  }
}

// 검색창 이벤트 복구
document.getElementById('search-form')?.addEventListener('submit', e => {
  e.preventDefault();
  const keyword = document.getElementById('search-input')?.value || '';
  if (keyword.trim()) fetchNews(keyword);
});
