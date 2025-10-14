import { useState } from "react";
import Groq from "groq-sdk";

export default function ChatInput({ setChatMessages }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const groq = new Groq({
    apiKey: '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',
    dangerouslyAllowBrowser: true
  });

  async function getAIResponse(userText) {
    try {
      const response = await groq.chat.completions.create({
        messages: [{ role: "user", content: userText }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 1024,
      });
      return response.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
    } catch (error) {
      console.error("Groq API error:", error);
      return "Something went wrong. Please try again.";
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const idUser = crypto?.randomUUID?.() ?? `u${Date.now()}`;
    const userMsg = { message: text, sender: "user", id: idUser };

    setChatMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const reply = await getAIResponse(text);

    const idBot = crypto?.randomUUID?.() ?? `b${Date.now() + 1}`;
    setChatMessages((prev) => [
      ...prev,
      { message: reply, sender: "robot", id: idBot },
    ]);
    
    setLoading(false);
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
          if (e.key === "Enter" && !loading) send();
        }}
        placeholder={loading ? "Thinking..." : "Type a message"}
        disabled={loading}
      />
      <button 
        type="button" 
        className="send" 
        onClick={send}
        disabled={loading}
      >
        {loading ? "..." : "Send"}
      </button>
    </div>
  );
}