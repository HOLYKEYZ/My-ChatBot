export default function ChatMessage({ message, sender }) {
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
        {message}
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
