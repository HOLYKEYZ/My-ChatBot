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
          src="data:image/png;base64,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"
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
          src="data:image/png;base64,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"
          alt="you"
          className="chat-message-profile"
        />
      )}
    </div>
  );
}