// ChatGPT Navigator Extension - Complete Rewrite
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

  function findChatContainer() {
    const selectors = [
      'main[class*="main"]',
      'div[class*="conversation"]',
      'div[class*="chat"]',
      "div.flex-1.overflow-hidden",
      "div.h-full.overflow-auto",
      "main",
      '[role="main"]',
      'div[class*="scroll"]',
      "div.overflow-y-auto",
    ]

    for (const selector of selectors) {
      const container = document.querySelector(selector)
      if (
        container &&
        (container.scrollHeight > container.clientHeight || container === document.querySelector("main"))
      ) {
        console.log("[v0] Found chat container:", selector, container)
        return container
      }
    }

    console.log("[v0] No specific container found, using document.documentElement")
    return document.documentElement
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
      if (container && container !== document.documentElement) {
        const scrollHeight = container.scrollHeight
        console.log("[v0] Container scrollHeight:", scrollHeight)

        container.scrollTo({ top: scrollHeight, behavior: "smooth" })

        // Multiple fallback attempts
        setTimeout(() => {
          container.scrollTop = container.scrollHeight
        }, 50)

        setTimeout(() => {
          container.scrollTop = container.scrollHeight
        }, 200)

        setTimeout(() => {
          container.scrollTop = container.scrollHeight
        }, 500)
      }

      // Always try window scroll as well
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
      )

      console.log("[v0] Document height:", docHeight)
      window.scrollTo({ top: docHeight, behavior: "smooth" })

      // Force scroll fallback
      setTimeout(() => {
        window.scrollTo(0, docHeight)
        if (container && container !== document.documentElement) {
          container.scrollTop = container.scrollHeight
        }
      }, 100)
    } catch (error) {
      console.error("[v0] Error in scrollToBottom:", error)
      // Emergency fallback
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
    const highlights = document.querySelectorAll(".search-highlight")
    highlights.forEach((highlight) => {
      const parent = highlight.parentNode
      if (parent) {
        parent.replaceChild(document.createTextNode(highlight.textContent), highlight)
        parent.normalize()
      }
    })
  }

  function searchInConversation(term) {
    console.log("[v0] Searching for term:", term)

    if (!term.trim()) {
      console.log("[v0] Empty search term")
      return
    }

    clearHighlights()
    searchResults = []
    currentSearchTerm = term.trim()

    const messages = findChatMessages()

    messages.forEach((message, index) => {
      const textContent = message.textContent.toLowerCase()
      if (textContent.includes(currentSearchTerm.toLowerCase())) {
        searchResults.push({
          element: message,
          index: index,
        })

        highlightText(message, currentSearchTerm)
      }
    })

    console.log("[v0] Search results found:", searchResults.length)
    updateSearchInfo()

    if (searchResults.length > 0) {
      searchIndex = 0
      scrollToSearchResult(0)
    }
  }

  function scrollToSearchResult(index) {
    if (searchResults.length === 0) return

    // Remove previous active highlights
    document.querySelectorAll(".search-highlight.active").forEach((el) => {
      el.classList.remove("active")
    })

    const result = searchResults[index]
    console.log("[v0] Scrolling to search result:", index + 1, "of", searchResults.length)

    result.element.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    })

    // Add active class to current result
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
    clearHighlights()
    searchResults = []
    searchIndex = 0
    currentSearchTerm = ""
    document.getElementById("search-input").value = ""
    updateSearchInfo()
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

      // Event listeners with error handling
      const scrollTopBtn = document.getElementById("scroll-top")
      const scrollBottomBtn = document.getElementById("scroll-bottom")

      if (scrollTopBtn && scrollBottomBtn) {
        scrollTopBtn.addEventListener("click", (e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log("[v0] Top button clicked - scrolling to chat top")
          scrollToTop()
        })

        scrollBottomBtn.addEventListener("click", (e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log("[v0] Bottom button clicked - scrolling to chat bottom")
          scrollToBottom()
        })

        console.log("[v0] Scroll buttons initialized with enhanced handlers")
      }

      const searchInput = document.getElementById("search-input")
      const searchBtn = document.getElementById("search-btn")

      if (searchInput && searchBtn) {
        searchBtn.addEventListener("click", (e) => {
          e.preventDefault()
          console.log("[v0] Search button clicked")
          searchInConversation(searchInput.value)
        })

        searchInput.addEventListener("keypress", (e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            console.log("[v0] Search enter pressed")
            searchInConversation(searchInput.value)
          }
        })

        console.log("[v0] Search functionality initialized")
      }

      // Search navigation
      const nextBtn = document.getElementById("search-next")
      const prevBtn = document.getElementById("search-prev")
      const clearBtn = document.getElementById("search-clear")

      if (nextBtn) nextBtn.addEventListener("click", nextSearchResult)
      if (prevBtn) prevBtn.addEventListener("click", prevSearchResult)
      if (clearBtn) clearBtn.addEventListener("click", clearSearch)

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
