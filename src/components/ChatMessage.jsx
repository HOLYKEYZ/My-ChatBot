export default function ChatMessage({ message, sender }) {
  // Simple markdown to JSX converter for bold text
  const renderMessage = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div
      className={sender === "user" ? "chat-message-user" : "chat-message-robot"}
    >
      {sender === "robot" && (
        <img
          src="/src/assets/botchat.png"
          alt="bot"
          className="chat-message-profile"
        />
      )}
      <div
        className="chat-message-text"
        role="article"
        aria-label={`${sender} message`}
      >
        {renderMessage(message)}
      </div>
      {sender === "user" && (
        <img
          src="/src/assets/chatbot.png"
          alt="you"
          className="chat-message-profile"
        />
      )}
    </div>
  );
}