import React, { useState } from "react";

export default function ChatInput({ setChatMessages }) {
  const [input, setInput] = useState("");

  // optional global chatbot lib
  const chatbotLib =
    typeof window !== "undefined" && window.chatbot ? window.chatbot : null;

  function rollDice() {
    return Math.floor(Math.random() * 6) + 1;
  }

  function flipCoin() {
    return Math.random() < 0.5 ? "Heads" : "Tails";
  }

  function todaysDate() {
    const d = new Date();
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function genReplyFor(text) {
    const t = (text || "").trim().toLowerCase();
    if (!t) return null;

    if (/\b(roll|roll me|roll a|dice)\b/.test(t)) {
      const v = rollDice();
      return `You rolled a ${v}.`;
    }

    if (/\b(flip|flip a|coin)\b/.test(t)) {
      return flipCoin();
    }

    if (/\b(today|date|what(?:'| i)?s the date)\b/.test(t)) {
      return `Today is ${todaysDate()}.`;
    }

    if (/\b(hi|hello|hey)\b/.test(t)) {
      return "Hello! How can I help you?";
    }

    if (/\b(thanks|thank you|thankyou)\b/.test(t)) {
      return "You're welcome!";
    }

    // prefer library response if present
    if (chatbotLib && typeof chatbotLib.getResponse === "function") {
      try {
        const libResp = chatbotLib.getResponse(text);
        if (libResp && libResp !== text) return libResp;
      } catch (e) {
        console.error("chatbot lib error:", e);
      }
    }

    // polite fallback without echoing user's exact input
    return "I don't understand that yet. Try: 'roll me a dice', 'flip a coin', 'today's date', 'hello', or 'thank you'.";
  }

  function send() {
    const text = input.trim();
    if (!text) return;
    const idUser = crypto?.randomUUID?.() ?? `u${Date.now()}`;
    const userMsg = { message: text, sender: "user", id: idUser };

    // add user message
    setChatMessages((prev) => [...prev, userMsg]);

    // compute bot reply (immediate or via fallback rules)
    const reply = genReplyFor(text);

    if (reply) {
      const idBot = crypto?.randomUUID?.() ?? `b${Date.now() + 1}`;
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          { message: reply, sender: "robot", id: idBot },
        ]);
      }, 300);
    }

    setInput("");
  }

  return (
    <div
      className="chat-input-container controls"
      role="group"
      aria-label="Chat input"
      style={{
        gap: 8,
        display: "flex",
        alignItems: "center",
        marginTop: 12,
      }}
    >
      <input
        className="chat-input"
        aria-label="Message"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") send();
        }}
        placeholder="Type a message"
      />
      <button type="button" className="send" onClick={send}>
        Send
      </button>
    </div>
  );
}
