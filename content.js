// =====================
// Create Sidebar
// =====================
function createSidebar() {
  // Sidebar container
  const sidebar = document.createElement('div');
  sidebar.id = 'chatgpt-sidebar';
  sidebar.classList.add('hidden');
  sidebar.innerHTML = `
    <div style="padding: 10px; font-weight: bold;">Navigator</div>
    <button id="chatgpt-scroll-top">⬆️ Scroll to Top</button><br><br>
    <button id="chatgpt-scroll-bottom">⬇️ Scroll to Bottom</button><br><br>
    <input type="text" id="chatgpt-search" placeholder="Search..." style="width: 90%;"/>
    <button id="chatgpt-search-btn">🔍</button>
    <div id="chatgpt-results"></div>
  `;
  document.body.appendChild(sidebar);

  // Toggle button
  const toggle = document.createElement('button');
  toggle.id = 'chatgpt-toggle';
  toggle.title = 'Open navigator';
  toggle.innerText = '≡'; // Hamburger icon
  document.body.appendChild(toggle);

  // Toggle behavior
  function showSidebar(show) {
    if (show) {
      sidebar.classList.remove('hidden');
      toggle.title = 'Close navigator';
    } else {
      sidebar.classList.add('hidden');
      toggle.title = 'Open navigator';
    }
  }

  // Initially hidden
  showSidebar(false);

  toggle.addEventListener('click', () => {
    showSidebar(sidebar.classList.contains('hidden'));
  });

  // Scroll to top
  document.getElementById('chatgpt-scroll-top').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Scroll to bottom
  document.getElementById('chatgpt-scroll-bottom').addEventListener('click', () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  });

  // Search
  const input = document.getElementById('chatgpt-search');
  const searchBtn = document.getElementById('chatgpt-search-btn');
  const results = document.getElementById('chatgpt-results');

  function runSearch() {
    const q = input.value.trim().toLowerCase();
    results.innerHTML = '';
    if (!q) return;

    const nodes = document.querySelectorAll('div, p, span');
    nodes.forEach((n) => {
      if (n.innerText && n.innerText.toLowerCase().includes(q)) {
        n.style.background = 'yellow';
        const snippet = document.createElement('div');
        snippet.innerText = n.innerText.slice(0, 100);
        results.appendChild(snippet);
      }
    });
  }

  searchBtn.addEventListener('click', runSearch);
}

// =====================
// Wait for ChatGPT page to load
// =====================
function start() {
  if (document.body) {
    console.log("✅ Sidebar script loaded");
    createSidebar();
  } else {
    setTimeout(start, 1000);
  }
}

start();
