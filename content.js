
;(() => {
  let searchIndex = 0
  let searchResults = []
  let currentSearchTerm = ""

  function createNavigationPanel() {
    const panel = document.createElement("div")
    panel.id = "chatgpt-navigator"
    panel.innerHTML = `
      <div class="nav-header">
        <span class="nav-title">Chat Navigator</span>
        <button class="nav-toggle" id="nav-toggle">−</button>
      </div>
      <div class="nav-content" id="nav-content">
        <div class="nav-buttons">
          <button class="nav-btn" id="scroll-top" title="Scroll to Top of Chat">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2L4 6h8L8 2zM8 14V6"/>
            </svg>
            Top
          </button>
          <button class="nav-btn" id="scroll-bottom" title="Scroll to Bottom of Chat">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 14l4-4H4l4 4zM8 2v8"/>
            </svg>
            Bottom
          </button>
        </div>
        <div class="search-container">
          <div class="search-input-container">
            <input type="text" id="search-input" placeholder="Search in this chat..." />
            <button class="search-btn" id="search-btn" title="Search">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
              </svg>
            </button>
          </div>
          <div class="search-controls" id="search-controls" style="display: none;">
            <span class="search-info" id="search-info">0 of 0</span>
            <button class="search-nav-btn" id="search-prev" title="Previous">↑</button>
            <button class="search-nav-btn" id="search-next" title="Next">↓</button>
            <button class="search-nav-btn" id="search-clear" title="Clear">×</button>
          </div>
        </div>
      </div>
    `

    document.body.appendChild(panel)
    return panel
  }

  function getScrollableAncestor(el) {
    let node = el
    while (node && node !== document.body) {
      const style = window.getComputedStyle(node)
      const canScroll = node.scrollHeight > node.clientHeight
      if (canScroll && (style.overflowY === "auto" || style.overflowY === "scroll")) {
        return node
      }
      node = node.parentElement
    }
    return document.scrollingElement || document.documentElement
  }

  function findChatContainer() {
    // Prefer the single-chat conversation turns root
    const turns = document.querySelector('[data-testid="conversation-turns"]')
    if (turns) {
      const scrollable = getScrollableAncestor(turns)
      console.log("[v0] Using scrollable ancestor of conversation turns:", scrollable)
      return scrollable
    }

    // Fallbacks (kept from previous logic)
    const selectors = [
      'main[class*="main"]',
      'div[class*="conversation"]',
      'div[class*="chat"]',
      "div.flex-1.overflow-hidden",
      "div.h-full.overflow-auto",
      "div.overflow-y-auto",
      "main",
      '[role="main"]',
    ]

    for (const selector of selectors) {
      const container = document.querySelector(selector)
      if (container && (container.scrollHeight > container.clientHeight || selector === "main")) {
        console.log("[v0] Found chat container via fallback:", selector, container)
        return container
      }
    }

    console.log("[v0] No specific container found, using document.scrollingElement")
    return document.scrollingElement || document.documentElement
  }

  function scrollToTop() {
    console.log("[v0] Scroll to top initiated - independent of search")

    const container = findChatContainer()

    try {
      if (container && container !== document.documentElement) {
        console.log("[v0] Scrolling container to top")
        container.scrollTo({ top: 0, behavior: "smooth" })

        // Immediate fallback
        setTimeout(() => {
          container.scrollTop = 0
        }, 50)
      }

      // Always try window scroll as well
      console.log("[v0] Also scrolling window to top")
      window.scrollTo({ top: 0, behavior: "smooth" })

      // Force scroll fallback
      setTimeout(() => {
        window.scrollTo(0, 0)
        if (container && container !== document.documentElement) {
          container.scrollTop = 0
        }
      }, 100)
    } catch (error) {
      console.error("[v0] Error in scrollToTop:", error)
      // Emergency fallback
      window.scrollTo(0, 0)
    }
  }

  function scrollToBottom() {
    console.log("[v0] Scroll to bottom initiated - independent of search")
    const container = findChatContainer()

    try {
      const toBottom = () => {
        const target = container.scrollHeight - container.clientHeight
        container.scrollTo({ top: target, behavior: "smooth" })
      }

      toBottom()
      // nudge after layout settles (images/latex/ascii math can expand)
      setTimeout(toBottom, 120)
      setTimeout(() => {
        container.scrollTop = container.scrollHeight // hard set
        // also try last message as a final fallback
        const root = document.querySelector('[data-testid="conversation-turns"]') || document.querySelector("main")
        const candidates = root
          ? root.querySelectorAll('[data-testid^="conversation-turn-"], article, .markdown, .prose')
          : []
        const last = candidates.length ? candidates[candidates.length - 1] : null
        if (last) last.scrollIntoView({ behavior: "smooth", block: "end" })
      }, 300)
    } catch (error) {
      console.error("[v0] Error in scrollToBottom:", error)
      const docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
      window.scrollTo(0, docHeight)
    }
  }

  function findChatMessages() {
    // ChatGPT-specific message selectors
    const messageSelectors = [
      "[data-message-author-role]",
      'div[class*="group"]',
      'div[class*="message"]',
      ".conversation-turn",
      "div.flex.flex-col.items-start",
      "div.markdown",
    ]

    let messages = []

    for (const selector of messageSelectors) {
      const elements = document.querySelectorAll(selector)
      if (elements.length > 0) {
        console.log("[v0] Found messages with selector:", selector, elements.length)
        messages = Array.from(elements)
        break
      }
    }

    // Filter out non-message elements
    messages = messages.filter((msg) => {
      const text = msg.textContent.trim()
      return text.length > 10 // Only include substantial content
    })

    console.log("[v0] Total valid messages found:", messages.length)
    return messages
  }

  function highlightText(element, term) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) =>
        node.textContent.toLowerCase().includes(term.toLowerCase())
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT,
    })

    const textNodes = []
    let node
    while ((node = walker.nextNode())) {
      textNodes.push(node)
    }

    textNodes.forEach((textNode) => {
      const parent = textNode.parentNode
      if (parent && !parent.querySelector(".search-highlight")) {
        const text = textNode.textContent
        const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
        const highlightedHTML = text.replace(regex, '<mark class="search-highlight">$1</mark>')

        if (highlightedHTML !== text) {
          const wrapper = document.createElement("span")
          wrapper.innerHTML = highlightedHTML
          parent.replaceChild(wrapper, textNode)
        }
      }
    })
  }

  function clearHighlights() {
    const marks = document.querySelectorAll(".search-highlight")
    marks.forEach((mark) => {
      const parent = mark.parentNode
      if (!parent) return
      parent.replaceChild(document.createTextNode(mark.textContent), mark)
      parent.normalize()
    })
  }

  function shouldSkipNode(node) {
    let el = node.parentElement
    while (el) {
      const tag = el.tagName?.toLowerCase()
      if (tag === "code" || tag === "pre" || tag === "script" || tag === "style") return true
      if (el.getAttribute && (el.getAttribute("aria-hidden") === "true" || el.getAttribute("hidden") !== null))
        return true
      el = el.parentElement
    }
    return false
  }

  function highlightInRoot(root, term) {
    const created = []
    const q = term.toLowerCase()

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT
        if (shouldSkipNode(node)) return NodeFilter.FILTER_REJECT
        return node.nodeValue.toLowerCase().includes(q) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
      },
    })

    const nodes = []
    let n
    while ((n = walker.nextNode())) nodes.push(n)

    nodes.forEach((textNode) => {
      const text = textNode.nodeValue
      const lower = text.toLowerCase()
      let i = 0
      const frag = document.createDocumentFragment()

      while (true) {
        const idx = lower.indexOf(q, i)
        if (idx === -1) break

        // before
        if (idx > i) frag.appendChild(document.createTextNode(text.slice(i, idx)))

        // match
        const mark = document.createElement("mark")
        mark.className = "search-highlight"
        mark.textContent = text.slice(idx, idx + q.length)
        frag.appendChild(mark)
        created.push(mark)

        i = idx + q.length
      }

      // after
      frag.appendChild(document.createTextNode(text.slice(i)))

      textNode.parentNode.replaceChild(frag, textNode)
    })

    return created
  }

  function searchInConversation(term) {
    console.log("[v0] Searching for term:", term)
    const input = (term || "").trim()
    if (!input) {
      clearHighlights()
      searchResults = []
      searchIndex = 0
      currentSearchTerm = ""
      updateSearchInfo()
      return
    }

    clearHighlights()
    searchResults = []
    searchIndex = 0
    currentSearchTerm = input

    const root =
      document.querySelector('[data-testid="conversation-turns"]') || document.querySelector("main") || document.body
    const marks = highlightInRoot(root, input)
    searchResults = marks // store marks directly

    console.log("[v0] Total matches (highlights):", searchResults.length)
    updateSearchInfo()

    if (searchResults.length > 0) {
      scrollToSearchResult(0)
    }
  }

  function scrollToSearchResult(index) {
    if (!searchResults.length) return

    document.querySelectorAll(".search-highlight.active").forEach((el) => el.classList.remove("active"))

    // clamp/wrap index
    searchIndex = ((index % searchResults.length) + searchResults.length) % searchResults.length
    const mark = searchResults[searchIndex]

    if (mark && mark.scrollIntoView) {
      mark.classList.add("active")
      mark.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" })
    }
  }

  function updateSearchInfo() {
    const info = document.getElementById("search-info")
    const controls = document.getElementById("search-controls")

    if (searchResults.length > 0) {
      info.textContent = `${searchIndex + 1} of ${searchResults.length}`
      controls.style.display = "flex"
    } else if (currentSearchTerm) {
      info.textContent = "No results"
      controls.style.display = "flex"
    } else {
      controls.style.display = "none"
    }
  }

  function init() {
    console.log("[v0] Initializing ChatGPT Navigator...")

    if (document.getElementById("chatgpt-navigator")) {
      console.log("[v0] Navigator already exists")
      return
    }

    try {
      const panel = createNavigationPanel()
      console.log("[v0] Navigation panel created")

      // Attach scroll controls
      const topBtn = document.getElementById("scroll-top")
      const bottomBtn = document.getElementById("scroll-bottom")
      if (topBtn)
        topBtn.addEventListener("click", (e) => {
          e.preventDefault()
          scrollToTop()
        })
      if (bottomBtn)
        bottomBtn.addEventListener("click", (e) => {
          e.preventDefault()
          scrollToBottom()
        })

      // Search controls
      const searchInput = document.getElementById("search-input")
      const searchBtn = document.getElementById("search-btn")
      if (searchInput && searchBtn) {
        searchBtn.addEventListener("click", (e) => {
          e.preventDefault()
          searchInConversation(searchInput.value)
        })
        searchInput.addEventListener("keypress", (e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            searchInConversation(searchInput.value)
          }
        })
      }

      const nextBtn = document.getElementById("search-next")
      const prevBtn = document.getElementById("search-prev")
      const clearBtn = document.getElementById("search-clear")
      if (nextBtn)
        nextBtn.addEventListener("click", () => {
          if (searchResults.length) scrollToSearchResult(searchIndex + 1)
          updateSearchInfo()
        })
      if (prevBtn)
        prevBtn.addEventListener("click", () => {
          if (searchResults.length) scrollToSearchResult(searchIndex - 1)
          updateSearchInfo()
        })
      if (clearBtn)
        clearBtn.addEventListener("click", () => {
          const si = document.getElementById("search-input")
          if (si) si.value = ""
          clearHighlights()
          searchResults = []
          searchIndex = 0
          currentSearchTerm = ""
          updateSearchInfo()
        })

      // Toggle panel
      const toggleBtn = document.getElementById("nav-toggle")
      if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
          const content = document.getElementById("nav-content")
          const isCollapsed = content.style.display === "none"
          content.style.display = isCollapsed ? "block" : "none"
          toggleBtn.textContent = isCollapsed ? "−" : "+"
        })
      }

      console.log("[v0] ChatGPT Navigator initialized successfully")
    } catch (error) {
      console.error("[v0] Error initializing navigator:", error)
    }
  }

  function waitForChatGPT() {
    const checkInterval = setInterval(() => {
      if (document.querySelector("main") || document.querySelector('[role="main"]')) {
        clearInterval(checkInterval)
        setTimeout(init, 500)
      }
    }, 100)

    // Fallback timeout
    setTimeout(() => {
      clearInterval(checkInterval)
      init()
    }, 5000)
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForChatGPT)
  } else {
    waitForChatGPT()
  }

  // Handle SPA navigation
  let lastUrl = location.href
  new MutationObserver(() => {
    const url = location.href
    if (url !== lastUrl) {
      lastUrl = url
      console.log("[v0] URL changed, reinitializing...")
      setTimeout(() => {
        const existing = document.getElementById("chatgpt-navigator")
        if (existing) existing.remove()
        waitForChatGPT()
      }, 1000)
    }
  }).observe(document, { subtree: true, childList: true })
})()
