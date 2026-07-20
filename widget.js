(function () {
  // ======= CONFIG: change this to your deployed backend URL =======
  const BACKEND_URL = "https://YOUR-PROJECT.vercel.app/api/chat";
  // ==================================================================

  const STORAGE_KEY = "ppf_chat_history";
  let history = [];
  try {
    history = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
  } catch (e) {
    history = [];
  }

  const style = document.createElement("style");
  style.textContent = `
    #ppf-chat-bubble {
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #1a73e8;
      box-shadow: 0 4px 14px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 999999;
      transition: transform 0.15s ease;
    }
    #ppf-chat-bubble:hover { transform: scale(1.06); }
    #ppf-chat-bubble svg { width: 28px; height: 28px; fill: #fff; }

    #ppf-chat-window {
      position: fixed;
      bottom: 90px;
      left: 20px;
      width: 340px;
      max-width: 90vw;
      height: 480px;
      max-height: 70vh;
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.25);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    }
    #ppf-chat-window.open { display: flex; }

    #ppf-chat-header {
      background: #1a73e8;
      color: #fff;
      padding: 12px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 600;
      font-size: 14px;
    }
    #ppf-chat-header .sub {
      font-weight: 400;
      font-size: 11px;
      opacity: 0.85;
      display: block;
      margin-top: 2px;
    }
    #ppf-chat-close {
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
      background: none;
      border: none;
      color: #fff;
      padding: 2px 6px;
    }

    #ppf-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      background: #f7f8fa;
      font-size: 13.5px;
    }
    .ppf-msg {
      margin-bottom: 10px;
      display: flex;
    }
    .ppf-msg.user { justify-content: flex-end; }
    .ppf-bubble {
      max-width: 82%;
      padding: 8px 12px;
      border-radius: 12px;
      line-height: 1.4;
      white-space: pre-wrap;
    }
    .ppf-msg.user .ppf-bubble {
      background: #1a73e8;
      color: #fff;
      border-bottom-right-radius: 3px;
    }
    .ppf-msg.bot .ppf-bubble {
      background: #fff;
      color: #222;
      border: 1px solid #e3e5e8;
      border-bottom-left-radius: 3px;
    }
    .ppf-msg.bot .ppf-bubble a {
      color: #1a73e8;
    }
    .ppf-typing {
      font-size: 12px;
      color: #888;
      padding: 4px 12px;
    }

    #ppf-chat-inputbar {
      display: flex;
      border-top: 1px solid #e3e5e8;
      padding: 8px;
      background: #fff;
    }
    #ppf-chat-input {
      flex: 1;
      border: 1px solid #dcdfe3;
      border-radius: 20px;
      padding: 8px 14px;
      font-size: 13.5px;
      outline: none;
    }
    #ppf-chat-send {
      margin-left: 6px;
      background: #1a73e8;
      border: none;
      color: #fff;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      cursor: pointer;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #ppf-chat-send svg { width: 16px; height: 16px; fill: #fff; }

    @media (max-width: 480px) {
      #ppf-chat-window {
        width: calc(100vw - 24px);
        left: 12px;
        bottom: 84px;
        height: 65vh;
      }
      #ppf-chat-bubble { left: 16px; bottom: 16px; }
    }
  `;
  document.head.appendChild(style);

  const bubble = document.createElement("div");
  bubble.id = "ppf-chat-bubble";
  bubble.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.03 2 11c0 2.42 1.17 4.6 3.06 6.19-.11.99-.44 2.72-1.06 4.31 0 0 2.5-.5 4.5-1.94.8.24 1.65.44 2.5.44 5.52 0 10-4.03 10-9S17.52 2 12 2z"/></svg>`;
  document.body.appendChild(bubble);

  const win = document.createElement("div");
  win.id = "ppf-chat-window";
  win.innerHTML = `
    <div id="ppf-chat-header">
      <div>
        Pip · PrimePipsForex Mentor
        <span class="sub">Ask me any forex concept</span>
      </div>
      <button id="ppf-chat-close">&times;</button>
    </div>
    <div id="ppf-chat-messages"></div>
    <div id="ppf-chat-inputbar">
      <input id="ppf-chat-input" type="text" placeholder="Ask about support, trends, Fib..." />
      <button id="ppf-chat-send">
        <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
      </button>
    </div>
  `;
  document.body.appendChild(win);

  const messagesEl = win.querySelector("#ppf-chat-messages");
  const inputEl = win.querySelector("#ppf-chat-input");
  const sendBtn = win.querySelector("#ppf-chat-send");
  const closeBtn = win.querySelector("#ppf-chat-close");

  function linkify(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(urlRegex, (url) => {
        const clean = url.replace(/&lt;|&gt;/g, "");
        return `<a href="${clean}" target="_blank" rel="noopener">${clean}</a>`;
      });
  }

  function addMessage(role, text) {
    const row = document.createElement("div");
    row.className = "ppf-msg " + (role === "user" ? "user" : "bot");
    const b = document.createElement("div");
    b.className = "ppf-bubble";
    b.innerHTML = linkify(text);
    row.appendChild(b);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addWelcomeMessage() {
    if (history.length === 0) {
      addMessage(
        "bot",
        "Hey, I'm Pip 👋 Your forex mentor here at PrimePipsForex. Ask me things like \"what is support\", \"explain Fibonacci retracement\", or \"what is a higher high\" — I'm here to help you learn."
      );
    } else {
      history.forEach((m) => addMessage(m.role === "user" ? "user" : "bot", m.content));
    }
  }

  let open = false;
  bubble.addEventListener("click", () => {
    open = !open;
    win.classList.toggle("open", open);
    if (open && messagesEl.childElementCount === 0) {
      addWelcomeMessage();
    }
    if (open) inputEl.focus();
  });
  closeBtn.addEventListener("click", () => {
    open = false;
    win.classList.remove("open");
  });

  let sending = false;
  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || sending) return;
    inputEl.value = "";
    addMessage("user", text);
    history.push({ role: "user", content: text });

    sending = true;
    const typingEl = document.createElement("div");
    typingEl.className = "ppf-typing";
    typingEl.textContent = "Pip is typing...";
    messagesEl.appendChild(typingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    try {
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();
      typingEl.remove();

      if (data.reply) {
        addMessage("bot", data.reply);
        history.push({ role: "assistant", content: data.reply });
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-20)));
      } else {
        addMessage("bot", "Sorry, something went wrong on my end. Please try again in a moment.");
      }
    } catch (err) {
      typingEl.remove();
      addMessage("bot", "Sorry, I couldn't connect right now. Please try again shortly.");
    }
    sending = false;
  }

  sendBtn.addEventListener("click", sendMessage);
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });
})();
