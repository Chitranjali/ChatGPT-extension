// ChatGPT Single-Chat Navigator
(() => {
  "use strict";

  if (window.__cgn_initialized) return;
  window.__cgn_initialized = true;

  // State
  let highlights = [];
  let currentIndex = -1;
  let currentQuery = "";

  // Utility: log
  const log = (...args) => console.log("[cgn]", ...args);

  // Find the active chat container (single chat only)
  function getChatContainer() {
    // 1) Preferred: conversation turns container
    let root =
      document.querySelector('[data-testid="conversation-turns"]') ||
      document.querySelector('main [data-testid="conversation-turns"]');

    // 2) Other known containers with many messages
    if (!root) {
      root =
        document.querySelector('main .overflow-y-auto') ||
        document.querySelector('main [class*="overflow-y-auto"]') ||
        document.querySelector('main section') ||
        document.querySelector('main');
    }

    // Fallback: body/scrolling element
    if (!root) root = document.scrollingElement || document.documentElement;

    // Find the closest scrollable ancestor for the root
    const scrollable = findScrollableAncestor(root) || document.scrollingElement || document.documentElement;
    return { root, scrollable };
  }

  function findScrollableAncestor(el) {
    if (!el) return null;
    let node = el;
    while (node && node !== document.body) {
      const style = window.getComputedStyle(node);
      const overflowY = style.overflowY;
      const canScroll = node.scrollHeight > node.clientHeight;
      if (canScroll && (overflowY === "auto" || overflowY === "scroll")) {
        return node;
      }
      node = node.parentElement;
    }
    return null;
  }

  // Scroll controls (independent of search)
  function scrollToTop() {
    const { scrollable } = getChatContainer();
    if (!scrollable) return;
    try {
      scrollable.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      scrollable.scrollTop = 0;
    }
  }

  function scrollToBottom() {
    const { root, scrollable } = getChatContainer();
    if (!scrollable) return;

    // Try to scroll the container
    const targetTop = scrollable.scrollHeight - scrollable.clientHeight;
    try {
      scrollable.scrollTo({ top: targetTop, behavior: "smooth" });
    } catch {
      scrollable.scrollTop = targetTop;
    }

    // Also attempt to bring the last visible message into view as a fallback
    const lastMsg = findAllMessageBlocks(root).pop();
    if (lastMsg) {
      lastMsg.scrollIntoView({ block: "end", behavior: "smooth" });
    }
  }

  // Message detection (single chat only)
  function findAllMessageBlocks(root) {
    if (!root) return [];
    const selectors = [
      '[data-testid^="conversation-turn-"]',
      'div[data-message-author-role]',
      'article', // many ChatGPT messages render as articles
      '.markdown',
      '.prose'
    ];
    const set = new Set();
    selectors.forEach(sel => root.querySelectorAll(sel).forEach(el => set.add(el)));
    // Filter out empty elements
    return Array.from(set).filter(el => (el.textContent || "").trim().length > 0);
  }

  // Search and highlight within single chat
  function clearHighlights() {
    highlights.forEach(span => {
      const parent = span.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(span.textContent), span);
      parent.normalize();
    });
    highlights = [];
    currentIndex = -1;
    updateInfo();
  }

  function searchInChat(query) {
    const q = (query || "").trim();
    if (!q) {
      clearHighlights();
      currentQuery = "";
      return;
    }
    currentQuery = q;

    clearHighlights();

    const { root } = getChatContainer();
    const blocks = findAllMessageBlocks(root);
    if (blocks.length === 0) {
      updateInfo();
      return;
    }

    const regex = new RegExp(escapeRegExp(q), "gi");
    blocks.forEach(block => highlightInElement(block, regex));

    // Move to first match
    if (highlights.length > 0) {
      currentIndex = 0;
      focusCurrent();
    }
    updateInfo();
  }

  function highlightInElement(root, regex) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        // Skip code/links/styles/scripts
        let p = node.parentElement;
        while (p) {
          const tag = p.tagName?.toLowerCase();
          if (tag === "code" || tag === "pre" || tag === "script" || tag === "style") {
            return NodeFilter.FILTER_REJECT;
          }
          p = p.parentElement;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const toProcess = [];
    let textNode;
    while ((textNode = walker.nextNode())) {
      if (regex.test(textNode.nodeValue)) {
        // Reset regex lastIndex for each node since we're reusing it
        regex.lastIndex = 0;
        toProcess.push(textNode);
      }
    }

    toProcess.forEach(node => {
      const frag = document.createDocumentFragment();
      let lastIndex = 0;
      let m;
      const text = node.nodeValue;
      regex.lastIndex = 0;

      while ((m = regex.exec(text)) !== null) {
        const before = text.slice(lastIndex, m.index);
        if (before) frag.appendChild(document.createTextNode(before));

        const mark = document.createElement("span");
        mark.className = "cgn-highlight";
        mark.textContent = m[0];
        frag.appendChild(mark);
        highlights.push(mark);

        lastIndex = m.index + m[0].length;
      }

      const after = text.slice(lastIndex);
      if (after) frag.appendChild(document.createTextNode(after));

      node.parentNode.replaceChild(frag, node);
    });
  }

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function focusCurrent() {
    if (highlights.length === 0 || currentIndex < 0) return;
    document.querySelectorAll(".cgn-highlight.cgn-active").forEach(el => el.classList.remove("cgn-active"));
    const el = highlights[currentIndex];
    el.classList.add("cgn-active");
    el.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  function nextResult() {
    if (highlights.length === 0) return;
    currentIndex = (currentIndex + 1) % highlights.length;
    focusCurrent();
    updateInfo();
  }

  function prevResult() {
    if (highlights.length === 0) return;
    currentIndex = (currentIndex - 1 + highlights.length) % highlights.length;
    focusCurrent();
    updateInfo();
  }

  function updateInfo() {
    const info = document.getElementById("cgn-info");
    if (!info) return;
    if (highlights.length === 0) {
      info.textContent = currentQuery ? "0 of 0" : "";
    } else {
      info.textContent = `${currentIndex + 1} of ${highlights.length}`;
    }
  }

  // UI
  function createUI() {
    if (document.getElementById("cgn-root")) return;

    const root = document.createElement("div");
    root.id = "cgn-root";
    root.innerHTML = `
      <div class="cgn-toolbar">
        <button id="cgn-top" class="cgn-fab" title="Scroll to top of chat" aria-label="Scroll to top">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 4l-6 6h4v6h4v-6h4z"></path>
          </svg>
        </button>
        <button id="cgn-bottom" class="cgn-fab" title="Scroll to bottom of chat" aria-label="Scroll to bottom">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 20l6-6h-4V8h-4v6H6z"></path>
          </svg>
        </button>
      </div>

      <div class="cgn-search">
        <div class="cgn-search-row">
          <input id="cgn-input" class="cgn-input" type="text" placeholder="Search in this chat..." aria-label="Search this chat" />
          <button id="cgn-go" class="cgn-btn" title="Search" aria-label="Search">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.398 1.398l3.85 3.85a1 1 0 0 0 1.414-1.414l-3.85-3.85h-.016zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"></path>
            </svg>
          </button>
        </div>
        <div class="cgn-controls">
          <span id="cgn-info" class="cgn-info"></span>
          <div class="cgn-arrows">
            <button id="cgn-prev" class="cgn-mini" title="Previous" aria-label="Previous result">↑</button>
            <button id="cgn-next" class="cgn-mini" title="Next" aria-label="Next result">↓</button>
            <button id="cgn-clear" class="cgn-mini" title="Clear" aria-label="Clear search">×</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(root);

    // Events
    document.getElementById("cgn-top")?.addEventListener("click", scrollToTop);
    document.getElementById("cgn-bottom")?.addEventListener("click", scrollToBottom);

    const input = document.getElementById("cgn-input");
    const go = document.getElementById("cgn-go");
    const prev = document.getElementById("cgn-prev");
    const next = document.getElementById("cgn-next");
    const clear = document.getElementById("cgn-clear");

    go?.addEventListener("click", () => searchInChat(input.value));
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") searchInChat(input.value);
    });
    prev?.addEventListener("click", prevResult);
    next?.addEventListener("click", nextResult);
    clear?.addEventListener("click", () => {
      input.value = "";
      currentQuery = "";
      clearHighlights();
    });

    // Keyboard shortcuts (scoped to single chat navigation)
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "Home") {
          e.preventDefault();
          scrollToTop();
        } else if (e.key === "End") {
          e.preventDefault();
          scrollToBottom();
        } else if (e.key.toLowerCase() === "f" && e.shiftKey) {
          e.preventDefault();
          input?.focus();
        }
      }
      if (e.key === "F3") {
        e.preventDefault();
        if (e.shiftKey) {
          prevResult();
        } else {
          nextResult();
        }
      }
    });
  }

  // Re-init on SPA navigation or content changes
  function setupObservers() {
    // If UI is removed or route changes, restore
    const mo = new MutationObserver(() => {
      if (!document.getElementById("cgn-root")) {
        createUI();
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });

    // Hook into history changes for chat route updates
    const pushState = history.pushState;
    history.pushState = function (...args) {
      const ret = pushState.apply(this, args);
      setTimeout(createUI, 250);
      return ret;
    };
    window.addEventListener("popstate", () => setTimeout(createUI, 250));
  }

  // Init
  function init() {
    createUI();
    setupObservers();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();