import React, { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

const MessageList = ({ messages, user, scrollRef, onDeleteForMe, onDeleteForEveryone }) => {
  const [contextMenu, setContextMenu] = useState(null);
  const menuRef = useRef(null);
  const longPressTimer = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    };
    if (contextMenu) {
      // slight delay so the button's own click doesn't immediately close it
      const t = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
      }, 10);
      return () => {
        clearTimeout(t);
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }
  }, [contextMenu]);

  // Open from ⋮ button – anchor below the button
  const openMenuFromButton = useCallback((e, msg) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const isSender = msg.sender === user.uid;
    setContextMenu({
      msgId: msg.id,
      isSender,
      x: rect.left,
      y: rect.bottom + 6,
    });
  }, [user.uid]);

  // Open from right-click / long-press
  const openMenu = useCallback((e, msg) => {
    e.preventDefault();
    e.stopPropagation();
    const isSender = msg.sender === user.uid;
    const x = e.clientX ?? (e.touches?.[0]?.clientX ?? 100);
    const y = e.clientY ?? (e.touches?.[0]?.clientY ?? 100);
    setContextMenu({ msgId: msg.id, isSender, x, y });
  }, [user.uid]);

  const handleTouchStart = useCallback((e, msg) => {
    longPressTimer.current = setTimeout(() => openMenu(e, msg), 500);
  }, [openMenu]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const handleDelete = (type) => {
    if (!contextMenu) return;
    if (type === "me") onDeleteForMe(contextMenu.msgId);
    if (type === "everyone") onDeleteForEveryone(contextMenu.msgId);
    setContextMenu(null);
  };

  // Position handled entirely by CSS (centered modal like WhatsApp)

  return (
    <div className="messages-list" ref={scrollRef}>
      {messages.map((msg, index) => {
        const isLastMessage = index === messages.length - 1;
        const isSender = msg.sender === user.uid;
        const isDeletedForEveryone = msg.deletedForEveryone === true;
        const isDeletedForMe =
          Array.isArray(msg.deletedFor) && msg.deletedFor.includes(user.uid);

        if (isDeletedForMe && !isDeletedForEveryone) return null;

        return (
          <div
            key={msg.id}
            className={`message-row ${isSender ? "row-sent" : "row-received"}`}
          >
            {/* ⋮ button – left side for SENT messages */}
            {isSender && !isDeletedForEveryone && (
              <button
                className="msg-options-btn"
                onClick={(e) => openMenuFromButton(e, msg)}
                title="Message options"
                aria-label="Message options"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5"  r="1.8" />
                  <circle cx="12" cy="12" r="1.8" />
                  <circle cx="12" cy="19" r="1.8" />
                </svg>
              </button>
            )}

            {/* Bubble */}
            <div
              className={`message-bubble ${isSender ? "sent" : "received"}`}
              onContextMenu={(e) => !isDeletedForEveryone && openMenu(e, msg)}
              onTouchStart={(e) => !isDeletedForEveryone && handleTouchStart(e, msg)}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchEnd}
            >
              <div className={`message-content ${isDeletedForEveryone ? "deleted-message" : ""}`}>
                {isDeletedForEveryone ? (
                  <p className="deleted-message-text">
                    <svg
                      width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round"
                      style={{ display: "inline", marginRight: 5, verticalAlign: "middle", opacity: 0.6 }}
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                    This message was deleted
                  </p>
                ) : (
                  <>
                    {msg.imageUrl && (
                      !msg.fileType || msg.fileType.startsWith("image/") ? (
                        <img src={msg.imageUrl} className="message-image" alt="attachment" />
                      ) : (
                        <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer" className="message-file">
                          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          {msg.fileName || "Download File"}
                        </a>
                      )
                    )}
                    {msg.text && <p>{msg.text}</p>}
                  </>
                )}
                {!isDeletedForEveryone && (
                  <span className="timestamp">
                    {msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "Sending..."}
                  </span>
                )}
              </div>

              {isLastMessage && isSender && msg.seen && !isDeletedForEveryone && (
                <div className="seen-status-text">
                  Seen{" "}
                  {msg.seenAt
                    ? `at ${new Date(msg.seenAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                    : ""}
                </div>
              )}
            </div>

            {/* ⋮ button – right side for RECEIVED messages */}
            {!isSender && !isDeletedForEveryone && (
              <button
                className="msg-options-btn"
                onClick={(e) => openMenuFromButton(e, msg)}
                title="Message options"
                aria-label="Message options"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5"  r="1.8" />
                  <circle cx="12" cy="12" r="1.8" />
                  <circle cx="12" cy="19" r="1.8" />
                </svg>
              </button>
            )}
          </div>
        );
      })}

      {/* ─── Delete menu rendered via Portal → escapes overflow:hidden ─── */}
      {contextMenu &&
        createPortal(
          <div ref={menuRef} className="delete-context-menu">
            <div className="delete-menu-title">Delete message</div>

            <button className="delete-menu-item delete-for-me" onClick={() => handleDelete("me")}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Delete for me
            </button>

            {contextMenu.isSender && (
              <button className="delete-menu-item delete-for-everyone" onClick={() => handleDelete("everyone")}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Delete for everyone
              </button>
            )}

            <button className="delete-menu-item cancel-delete" onClick={() => setContextMenu(null)}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Cancel
            </button>
          </div>,
          document.body
        )}
    </div>
  );
};

export default React.memo(MessageList);
