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
          <code key={`code-${idx}`}>
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
          <HeaderTag key={`header-${idx}`} style={{ margin: '4px 0', fontSize: '1.1em', fontWeight: 'bold' }}>
            {headerText}
          </HeaderTag>
        );
      }
      // Lists: - item
      else if (matched.startsWith('-')) {
        const listText = matched.replace(/^-\s+/, '');
        elements.push(
          <div key={`list-${idx}`} style={{ display: 'flex', marginLeft: '8px' }}>
            <span style={{ marginRight: '8px' }}>•</span>
            <span>{listText}</span>
          </div>
        );
      }
      // Links: [text](url)
      else if (matched.includes('](')) {
        const linkMatch = matched.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
          elements.push(
            <a key={`link-${idx}`} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
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
        <div className="chat-message-profile" style={{ background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M4 11v2a8 8 0 0 0 16 0v-2"/><rect x="8" y="10" width="8" height="9" rx="2"/></svg>
        </div>
      )}
      <div
        className="chat-message-text"
        role="article"
        aria-label={`${sender} message`}
      >
        {renderMessage(message)}
      </div>
      {sender === "user" && (
         <div className="chat-message-profile" style={{ background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
         </div>
      )}
    </div>
  );
}