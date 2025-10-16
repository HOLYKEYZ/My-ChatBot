import ReactMarkdown from 'react-markdown';


export default function ChatMessage({ message, sender }) {
  return (
    <div
      className={sender === "user" ? "chat-message-user" : "chat-message-robot"}
    >
      {sender === "robot" && (
        <img
          src="https://github.com/HOLYKEYZ/My_ChatBot/blob/main/src/assets/botchat.png?raw=true"
          alt="bot"
          className="chat-message-profile"
        />
      )}
      <div
        className="chat-message-text"
        role="article"
        aria-label={`${sender} message`}
      >
        <ReactMarkdown>{message}</ReactMarkdown>
      </div>
      {sender === "user" && (
        <img
          src="https://github.com/HOLYKEYZ/My_ChatBot/blob/main/chatbot.png?raw=true"
          alt="you"
          className="chat-message-profile"
        />
      )}
    </div>
  );
}
