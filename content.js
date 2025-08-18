// ChatGPT Single Chat Navigator Extension
;(() => {
  let searchIndex = 0
  let searchResults = []
  let currentSearchTerm = ""

  // Get the main conversation container
  function getConversationContainer() {
    // Try multiple selectors for ChatGPT's conversation container
    const selectors = [
      '[role="main"]',
      ".conversation-turn-container",
      '[data-testid="conversation-turn"]',
      ".flex.flex-col.items-center",
      "main",
    ]

    for (const selector of selectors) {
      const container = document.querySelector(selector)
      if (container) {
        console.log("[v0] Found conversation container:", selector)
        return container
      }
    }

    console.log("[v0] Using document.body as fallback")
    return document.body
  }

  // Create the navigation panel
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

  // Scroll functions for current conversation
  function scrollToTop() {
    console.log("[v0] Scrolling to top of conversation")
    const container = getConversationContainer()

    // Try scrolling the container first
    if (container && container !== document.body) {
      container.scrollTo({ top: 0, behavior: "smooth" })
    }

    // Also scroll the window
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function scrollToBottom() {
    console.log("[v0] Scrolling to bottom of conversation")
    const container = getConversationContainer()

    // Try scrolling the container first
    if (container && container !== document.body) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" })
    }

    // Also scroll the window
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
  }

  // Get all messages in the current conversation
  function getCurrentConversationMessages() {
    const messageSelectors = [
      "[data-message-author-role]",
      '[data-testid*="conversation-turn"]',
      ".group.w-full",
      ".flex.flex-col.pb-9",
      '[class*="message"]',
    ]

    let messages = []

    for (const selector of messageSelectors) {
      const elements = document.querySelectorAll(selector)
      if (elements.length > 0) {
        console.log(`[v0] Found ${elements.length} messages with selector: ${selector}`)
        messages = Array.from(elements)
        break
      }
    }

    // Filter out non-message elements
    messages = messages.filter((msg) => {
      const text = msg.textContent.trim()
      return text.length > 10 // Only include elements with substantial text
    })

    console.log(`[v0] Total conversation messages found: ${messages.length}`)
    return messages
  }

  // Search functionality within current conversation
  function highlightText(text, term) {
    if (!term) return text
    const regex = new RegExp(`(${term})`, "gi")
    return text.replace(regex, '<mark class="search-highlight">$1</mark>')
  }

  function clearHighlights() {
    const highlights = document.querySelectorAll(".search-highlight")
    highlights.forEach((highlight) => {
      const parent = highlight.parentNode
      parent.replaceChild(document.createTextNode(highlight.textContent), highlight)
      parent.normalize()
    })
  }

  function searchInCurrentConversation(term) {
    if (!term.trim()) return

    console.log(`[v0] Searching for: "${term}" in current conversation`)
    clearHighlights()
    searchResults = []
    currentSearchTerm = term

    const messages = getCurrentConversationMessages()

    messages.forEach((message, index) => {
      const textContent = message.textContent.toLowerCase()
      if (textContent.includes(term.toLowerCase())) {
        searchResults.push({
          element: message,
          index: index,
        })

        // Highlight the text
        const walker = document.createTreeWalker(message, NodeFilter.SHOW_TEXT, null, false)

        const textNodes = []
        let node
        while ((node = walker.nextNode())) {
          if (node.textContent.toLowerCase().includes(term.toLowerCase())) {
            textNodes.push(node)
          }
        }

        textNodes.forEach((textNode) => {
          const parent = textNode.parentNode
          const highlightedHTML = highlightText(textNode.textContent, term)
          const wrapper = document.createElement("span")
          wrapper.innerHTML = highlightedHTML
          parent.replaceChild(wrapper, textNode)
        })
      }
    })

    console.log(`[v0] Found ${searchResults.length} messages with search term`)
    updateSearchInfo()
    if (searchResults.length > 0) {
      searchIndex = 0
      scrollToSearchResult(0)
    }
  }

  function scrollToSearchResult(index) {
    if (searchResults.length === 0) return

    // Remove previous active highlight
    document.querySelectorAll(".search-highlight.active").forEach((el) => {
      el.classList.remove("active")
    })

    const result = searchResults[index]
    console.log(`[v0] Scrolling to search result ${index + 1} of ${searchResults.length}`)

    result.element.scrollIntoView({ behavior: "smooth", block: "center" })

    // Add active class to current result highlights
    const highlights = result.element.querySelectorAll(".search-highlight")
    highlights.forEach((highlight) => highlight.classList.add("active"))
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

  function nextSearchResult() {
    if (searchResults.length === 0) return
    searchIndex = (searchIndex + 1) % searchResults.length
    scrollToSearchResult(searchIndex)
    updateSearchInfo()
  }

  function prevSearchResult() {
    if (searchResults.length === 0) return
    searchIndex = (searchIndex - 1 + searchResults.length) % searchResults.length
    scrollToSearchResult(searchIndex)
    updateSearchInfo()
  }

  function clearSearch() {
    console.log("[v0] Clearing search")
    clearHighlights()
    searchResults = []
    searchIndex = 0
    currentSearchTerm = ""
    document.getElementById("search-input").value = ""
    updateSearchInfo()
  }

  // Initialize the extension
  function init() {
    // Check if already initialized
    if (document.getElementById("chatgpt-navigator")) {
      console.log("[v0] Navigator already initialized")
      return
    }

    console.log("[v0] Initializing ChatGPT Navigator")
    const panel = createNavigationPanel()

    // Event listeners
    document.getElementById("scroll-top").addEventListener("click", () => {
      console.log("[v0] Top button clicked")
      scrollToTop()
    })

    document.getElementById("scroll-bottom").addEventListener("click", () => {
      console.log("[v0] Bottom button clicked")
      scrollToBottom()
    })

    const searchInput = document.getElementById("search-input")
    const searchBtn = document.getElementById("search-btn")

    searchBtn.addEventListener("click", () => {
      console.log("[v0] Search button clicked")
      searchInCurrentConversation(searchInput.value)
    })

    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        console.log("[v0] Search enter pressed")
        searchInCurrentConversation(searchInput.value)
      }
    })

    document.getElementById("search-next").addEventListener("click", nextSearchResult)
    document.getElementById("search-prev").addEventListener("click", prevSearchResult)
    document.getElementById("search-clear").addEventListener("click", clearSearch)

    // Toggle panel
    document.getElementById("nav-toggle").addEventListener("click", () => {
      const content = document.getElementById("nav-content")
      const toggle = document.getElementById("nav-toggle")
      const isCollapsed = content.style.display === "none"

      content.style.display = isCollapsed ? "block" : "none"
      toggle.textContent = isCollapsed ? "−" : "+"
    })

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "Home":
            e.preventDefault()
            scrollToTop()
            break
          case "End":
            e.preventDefault()
            scrollToBottom()
            break
          case "f":
            if (e.shiftKey) {
              e.preventDefault()
              searchInput.focus()
            }
            break
        }
      }

      if (searchResults.length > 0) {
        if (e.key === "F3") {
          e.preventDefault()
          if (e.shiftKey) {
            prevSearchResult()
          } else {
            nextSearchResult()
          }
        }
      }
    })

    console.log("[v0] ChatGPT Navigator initialized successfully")
  }

  // Wait for page to load and initialize
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init)
  } else {
    setTimeout(init, 1000) // Give ChatGPT time to load
  }

  // Re-initialize on navigation (for SPA)
  let lastUrl = location.href
  new MutationObserver(() => {
    const url = location.href
    if (url !== lastUrl) {
      lastUrl = url
      console.log("[v0] URL changed, reinitializing")
      setTimeout(init, 2000)
    }
  }).observe(document, { subtree: true, childList: true })
})()
