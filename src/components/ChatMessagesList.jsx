import ChatMessage from "./ChatMessage";

function ChatMessagesList({ chatMessages }) {
  return (
    <div className="messages" aria-live="polite">
      {chatMessages.map((msg) => (
        <ChatMessage key={msg.id} message={msg.message} sender={msg.sender} />
      ))}
    </div>
  );
}

export default ChatMessagesList;
