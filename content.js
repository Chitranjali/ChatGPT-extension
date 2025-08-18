// -------------------------------
// ChatGPT Sidebar Navigator - content.js
// -------------------------------

/* Utility: safe query for message nodes.
   Tries multiple selectors so it's a bit robust to small DOM changes. */
function getMessageNodes() {
  // Primary selector used by ChatGPT UI (common): 'div.text-base'
  let nodes = Array.from(document.querySelectorAll('div.text-base'));
  if (nodes.length) return nodes;

  // Fallbacks: try common container classes
  nodes = Array.from(document.querySelectorAll('[role="listitem"], .message, .group'));
  // Filter out nodes that have little text
  nodes = nodes.filter(n => (n.innerText || '').trim().length > 2);
  return nodes;
}

/* Remove previous highlight spans safely */
function removeHighlights() {
  document.querySelectorAll('.chatgpt-highlight').forEach(span => {
    const txt = document.createTextNode(span.textContent);
    span.replaceWith(txt);
  });
}

/* Highlight occurrences of query inside a node (case-insensitive) */
function highlightNodeText(node, query) {
  if (!query) return;
  const text = node.innerHTML; // we operate on HTML to preserve inline tags
  // escape special regex chars in query
  const q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${q})`, 'ig');
  if (regex.test(text)) {
    node.innerHTML = text.replace(regex, '<span class="chatgpt-highlight">$1</span>');
  }
}

/* Scroll smoothly to element and add a brief pulse */
function scrollToMessage(node) {
  node.scrollIntoView({ behavior: 'smooth', block: 'center' });
  // optional brief flash: add class then remove (keeps it simple, rely on highlight)
}

/* Create the sidebar DOM if not present */
function createSidebar() {
  if (document.getElementById('chatgpt-sidebar')) return;

  // sidebar container
  const sidebar = document.createElement('div');
  sidebar.id = 'chatgpt-sidebar';
  sidebar.className = 'hidden'; // start hidden (user clicks toggle to open)
  sidebar.innerHTML = `
    <h3>Navigator</h3>
    <input type="text" id="chatgpt-search" placeholder="Search (press Enter)..." />
    <button class="btn" id="chatgpt-search-btn">🔎 Search</button>
    <button class="btn" id="chatgpt-scroll-top">⬆ Scroll to Top</button>
    <button class="btn" id="chatgpt-scroll-bottom">⬇ Scroll to Bottom</button>
    <div id="chatgpt-results"></div>
  `;
  document.body.appendChild(sidebar);

  // toggle button
  const toggle = document.createElement('button');
  toggle.id = 'chatgpt-toggle';
  toggle.title = 'Open navigator';
  toggle.innerText = '≡';
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
  // initial
  showSidebar(false);

  toggle.addEventListener('click', () => {
    showSidebar(!sidebar.classList.contains('hidden'));
  });

  // Scroll to top / bottom
  document.getElementById('chatgpt-scroll-top').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.getElementById('chatgpt-scroll-bottom').addEventListener('click', () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  });

  // Search triggers
  const input = document.getElementById('chatgpt-search');
  const searchBtn = document.getElementById('chatgpt-search-btn');
  const resultsDiv = document.getElementById('chatgpt-results');

  function performSearch() {
    const query = (input.value || '').trim();
    removeHighlights();
    resultsDiv.innerHTML = '';

    if (!query) {
      resultsDiv.innerHTML = '<div style="opacity:.8;font-size:13px">Type something and press Enter or Search.</div>';
      return;
    }

    const nodes = getMessageNodes();
    let found = 0;
    nodes.forEach((n, idx) => {
      if ((n.innerText || '').toLowerCase().includes(query.toLowerCase())) {
        found++;
        // highlight matches
        highlightNodeText(n, query);

        // create result item with snippet
        const snippet = (n.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 120);
        const btn = document.createElement('div');
        btn.className = 'result-item';
        btn.title = snippet;
        btn.innerText = `${found}. ${snippet}`;
        btn.addEventListener('click', () => scrollToMessage(n));
        resultsDiv.appendChild(btn);
      }
    });

    if (!found) {
      resultsDiv.innerHTML = '<div style="opacity:.8;font-size:13px">No matches found.</div>';
    }
  }

  // Enter key
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
  });
  // Search button
  searchBtn.addEventListener('click', performSearch);

  // Optional: clear highlights when input cleared
  input.addEventListener('input', () => {
    if (!input.value.trim()) removeHighlights();
  });
}

/* Wait for page to be interactive, then add sidebar.
   ChatGPT loads dynamic content; allow a few attempts */
function start() {
  // Try to create sidebar after small delay
  createSidebar();

  // Observe DOM for new messages: re-highlight if a search query is active
  const observer = new MutationObserver((mutations) => {
    const input = document.getElementById('chatgpt-search');
    const q = input ? input.value.trim() : '';
    if (q) {
      // attempt to re-run highlight lightly (no UI result rebuild)
      const nodes = getMessageNodes();
      nodes.forEach(n => {
        if ((n.innerText || '').toLowerCase().includes(q.toLowerCase())) {
          // if it doesn't already contain highlight, add highlights
          if (!n.querySelector('.chatgpt-highlight')) highlightNodeText(n, q);
        }
      });
    }
  });

  // Observe the whole body for new messages
  observer.observe(document.body, { childList: true, subtree: true });
}

/* Delay start to let ChatGPT UI bootstrap */
setTimeout(start, 1800);
