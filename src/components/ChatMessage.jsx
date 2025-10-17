export default function ChatMessage({ message, sender }) {
  const renderMessage = (text) => {
    // Split by multiple markdown patterns
    const elements = [];
    let lastIndex = 0;

    // Regex to match: **bold**, *italic*, __underline__, `code`, # headers, - lists, [link](url)
    const regex = /(\*\*.*?\*\*|\*(?!\*).*?\*(?!\*)|__.*?__|`.*?`|^#{1,6}\s+.*$|^-\s+.*$|\[.*?\]\(.*?\))/gm;
    
    const matches = [...text.matchAll(regex)];

    matches.forEach((m, idx) => {
      // Add text before this match
      if (m.index > lastIndex) {
        elements.push(
          <span key={`text-${idx}`}>
            {text.substring(lastIndex, m.index)}
          </span>
        );
      }

      const matched = m[0];

      // Bold: **text**
      if (matched.startsWith('**') && matched.endsWith('**')) {
        elements.push(
          <strong key={`bold-${idx}`}>{matched.slice(2, -2)}</strong>
        );
      }
      // Italic: *text*
      else if (matched.startsWith('*') && matched.endsWith('*')) {
        elements.push(
          <em key={`italic-${idx}`}>{matched.slice(1, -1)}</em>
        );
      }
      // Underline: __text__
      else if (matched.startsWith('__') && matched.endsWith('__')) {
        elements.push(
          <u key={`underline-${idx}`}>{matched.slice(2, -2)}</u>
        );
      }
      // Code: `text`
      else if (matched.startsWith('`') && matched.endsWith('`')) {
        elements.push(
          <code key={`code-${idx}`} style={{ backgroundColor: '#f0f0f0', padding: '2px 6px', borderRadius: '3px', fontFamily: 'monospace' }}>
            {matched.slice(1, -1)}
          </code>
        );
      }
      // Headers: # text
      else if (matched.startsWith('#')) {
        const level = matched.match(/^#+/)[0].length;
        const headerText = matched.replace(/^#+\s+/, '');
        const HeaderTag = `h${Math.min(level, 6)}`;
        elements.push(
          <HeaderTag key={`header-${idx}`} style={{ margin: '8px 0', fontWeight: 'bold' }}>
            {headerText}
          </HeaderTag>
        );
      }
      // Lists: - item
      else if (matched.startsWith('-')) {
        const listText = matched.replace(/^-\s+/, '');
        elements.push(
          <li key={`list-${idx}`} style={{ marginLeft: '16px' }}>
            {listText}
          </li>
        );
      }
      // Links: [text](url)
      else if (matched.includes('](')) {
        const linkMatch = matched.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
          elements.push(
            <a key={`link-${idx}`} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', textDecoration: 'underline' }}>
              {linkMatch[1]}
            </a>
          );
        }
      }

      lastIndex = m.index + matched.length;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(
        <span key="text-end">
          {text.substring(lastIndex)}
        </span>
      );
    }

    return elements.length > 0 ? elements : text;
  };

  return (
    <div
      className={sender === "user" ? "chat-message-user" : "chat-message-robot"}
    >
      {sender === "robot" && (
        <img
          src="https://github.com/HOLYKEYZ/My-ChatBot/blob/main/src/assets/botchat.png"
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
          src="https://github.com/HOLYKEYZ/My-ChatBot/blob/main/src/assets/chatbot.png"
          alt="you"
          className="chat-message-profile"
        />
      )}
    </div>
  );
}