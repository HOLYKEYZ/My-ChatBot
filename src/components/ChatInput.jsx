import { useState, useEffect } from "react";

export default function ChatInput({ setChatMessages }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isBackendConnected, setIsBackendConnected] = useState(true);
  const MAX_RETRIES = 2;

  const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001/api/chat' : '/api/chat');
  const HEALTH_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001/api/health' : '/api/health');

  // Check backend connection on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(HEALTH_URL);
        if (res.ok) setIsBackendConnected(true);
        else {
          setIsBackendConnected(false);
          console.warn(`Backend health check failed: ${res.status}`);
        }
      } catch (e) {
        setIsBackendConnected(false);
        console.warn("Backend not reachable:", e);
      }
    };
    
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  async function getAIResponse(userText) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userText }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        throw new Error(errorData.error || 'Request failed');
      }

      const data = await response.json();
      if (!data || typeof data.response !== 'string') {
        throw new Error('Invalid response format from server');
      }
      
      return data.response;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("API error:", error);
      
      if (error.name === 'AbortError') {
        throw new Error("Request timed out. Please try again.");
      } else if (error.message.includes('Failed to fetch')) {
        setIsBackendConnected(false);
        throw new Error("Cannot reach the server. Make sure the backend is running.");
      } else if (error.message.includes('Server error')) {
        throw new Error(`Server error: ${error.message}`);
      }
      throw error;
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

    try {
      const reply = await getAIResponse(text);
      setRetryCount(0); // Reset retry count on success
      setIsBackendConnected(true); // Re-connected success
      
      const idBot = crypto?.randomUUID?.() ?? `b${Date.now() + 1}`;
      setChatMessages((prev) => [
        ...prev,
        { message: reply, sender: "robot", id: idBot, isError: false },
      ]);
    } catch (error) {
      console.error("Failed to get AI response:", error);
      
      if (retryCount < MAX_RETRIES && isBackendConnected) {
        setRetryCount(prev => prev + 1);
        setTimeout(send, 1000 * Math.pow(2, retryCount)); // Exponential backoff
        return;
      }
      
      const idBot = crypto?.randomUUID?.() ?? `b${Date.now() + 1}`;
      setChatMessages((prev) => [
        ...prev,
        { 
          message: error.message || "I'm having trouble connecting to the AI service.", 
          sender: "robot", 
          id: idBot,
          isError: true 
        },
      ]);
      setRetryCount(0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div
        className="chat-input-container controls"
        role="group"
        aria-label="Chat input"
      >
        <input
          className="chat-input"
          aria-label="Message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) send();
          }}
          placeholder={loading ? "Thinking..." : "Type a message..."}
          disabled={loading}
        />
        <button 
          type="button" 
          className="send" 
          onClick={send}
          disabled={loading}
          title="Send message"
        >
          {loading ? (
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          ) : (
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          )}
        </button>
      </div>
      {!isBackendConnected && (
        <div style={{
          position: 'absolute',
          top: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#fee2e2',
          color: '#b91c1c',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{width: '8px', height: '8px', background: '#dc2626', borderRadius: '50%'}}></span>
          Backend Offline. Check terminal.
        </div>
      )}
    </>
  );
}