import { useState } from "react";
import ChatInput from "./components/ChatInput";
import ChatMessagesList from "./components/ChatMessagesList";
import "./App.css";

function App() {
  // Start empty so no messages show before the user asks
  const [chatMessages, setChatMessages] = useState([]);

  return (
    <div className="app-container" role="application" aria-label="Chatbot app">
      <h2 className="text">MY CHATBOT</h2>
      <ChatMessagesList chatMessages={chatMessages} />
      <ChatInput
        chatMessages={chatMessages}
        setChatMessages={setChatMessages}
      />
    </div>
  );
}

export default App;
