import React from "react";

const MessageList = ({ messages, user, scrollRef }) => {
  return (
    <div className="messages-list" ref={scrollRef}>
      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className={`message-bubble ${msg.sender === user.uid ? "sent" : "received"}`}  
        >
          <div className="message-content">
            {msg.imageUrl && (
              (!msg.fileType || msg.fileType.startsWith('image/')) ? (
                <img src={msg.imageUrl} className="message-image" alt="attachment" />
              ) : (
                <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer" className="message-file">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                  {msg.fileName || 'Download File'}
                </a>
              )
            )}
            {msg.text && <p>{msg.text}</p>}
            <span className="timestamp">
              {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Sending..."}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(MessageList);
