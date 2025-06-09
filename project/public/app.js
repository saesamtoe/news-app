const today = new Date().toISOString().slice(0, 10);
const bookmarkKey = 'bookmarkedNews';

const lastFetched = localStorage.getItem('lastFetched');
if (lastFetched !== today) {
  fetchNews();
  localStorage.setItem('lastFetched', today);
} else {
  loadFromStorage();
}

function fetchNews(keyword = '한국') {
  Promise.all([
    fetch(`http://localhost:3000/news?q=${encodeURIComponent(keyword)}`).then(res => res.json()),
    fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
      .then(res => res.json())
      .then(ids => Promise.all(ids.slice(0, 5).map(id =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(res => res.json())
      )))
  ]).then(([newsData, hackerNews]) => {
    localStorage.setItem('newsapi', JSON.stringify(newsData.articles));
    localStorage.setItem('hackernews', JSON.stringify(hackerNews));
    renderNews(newsData.articles, hackerNews);
  });
}

function searchNews() {
  const keyword = document.getElementById('search-input').value.trim();
  if (!keyword) return alert('검색어를 입력해주세요.');

  fetch(`https://news-app-ystt.onrender.com/news?q=한국`)
    .then(res => res.json())
    .then(data => {
      localStorage.setItem('newsapi', JSON.stringify(data.articles));
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
    const isBookmarked = getBookmarks().some(b => b.url === url);
    const star = `<span class="bookmark-btn ${isBookmarked ? 'active' : ''}" onclick="toggleBookmark('${encodeURIComponent(url)}', '${encodeURIComponent(title)}', this)">★</span>`;

    const div = document.createElement('div');
    div.className = 'article';
    div.innerHTML = `
      ${star}
      <strong>${title}</strong><br>
      <a href="${url}" target="_blank">[원문 보기]</a>
    `;
    container.appendChild(div);
  });
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
