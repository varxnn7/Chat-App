import React, { useRef, useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { db } from "../firebase";
import {
  collection, query, orderBy, onSnapshot,
  doc, setDoc, serverTimestamp, updateDoc,
  arrayUnion, arrayRemove
} from "firebase/firestore";
import { setMessages, setClearedAt } from "../redux/chatSlice";

import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

const UNDO_TIMEOUT_MS = 5000; // 5 seconds to undo

function Chat() {
  const { userId: selectedUserId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector(state => state.auth.currentUser);
  const selectedUser = useSelector(state =>
    state.users.contacts.find(c => c.uid === selectedUserId)
  );

  const chatId = user && selectedUser
    ? [user.uid, selectedUser.uid].sort().join("_")
    : null;

  const messages = useSelector(state =>
    chatId ? state.chat.messagesByChatId[chatId] || [] : []
  );
  const clearedAtMillis = useSelector(state =>
    chatId ? state.chat.clearedAtByChatId[chatId] || null : null
  );

  const scrollRef = useRef(null);

  // ── Undo toast state ──────────────────────────────────────────────────
  const [undoToast, setUndoToast] = useState(null); // { msgId }
  const undoTimerRef = useRef(null);

  const dismissToast = useCallback(() => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoToast(null);
  }, []);

  // ── Firestore listeners ───────────────────────────────────────────────
  useEffect(() => {
    if (!user || !chatId) return;
    const clearedRef = doc(db, "users", user.uid, "clearedChats", chatId);
    const unsubscribe = onSnapshot(clearedRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().clearedAt) {
        dispatch(setClearedAt({ chatId, clearedAtMillis: docSnap.data().clearedAt.toMillis() }));
      } else {
        dispatch(setClearedAt({ chatId, clearedAtMillis: null }));
      }
    });
    return () => unsubscribe();
  }, [user, chatId, dispatch]);

  useEffect(() => {
    if (!chatId) return;

    // Ensure the chat document exists with participants so security rules pass
    setDoc(doc(db, "chats", chatId), {
      participants: [user.uid, selectedUser.uid]
    }, { merge: true }).catch(err => console.error("Error setting chat participants:", err));

    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt"));
    const unsubscribe = onSnapshot(q, (snapshot) => {

      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added" || change.type === "modified") {
          const msg = change.doc.data();
          if (msg.receiver === user.uid && !msg.seen) {
            try {
              await updateDoc(doc(db, "chats", chatId, "messages", change.doc.id), {
                seen: true,
                seenAt: serverTimestamp()
              });
            } catch (err) {
              console.error("Error updating seen status:", err);
            }
          }
        }
      });

      const allMsgs = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt ? data.createdAt.toMillis() : null,
          seenAt: data.seenAt ? data.seenAt.toMillis() : null,
        };
      });

      const filtered = clearedAtMillis
        ? allMsgs.filter(msg => {
            if (!msg.createdAt) return true;
            return msg.createdAt > clearedAtMillis;
          })
        : allMsgs;

      dispatch(setMessages({ chatId, messages: filtered }));
    });
    return () => unsubscribe();
  }, [chatId, clearedAtMillis, user.uid, selectedUser?.uid, dispatch]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleClearChat = async () => {
    if (window.confirm("Are you sure you want to clear this chat? This will hide all current messages for you.")) {
      try {
        await setDoc(doc(db, "users", user.uid, "clearedChats", chatId), {
          clearedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error("Error clearing chat:", err);
      }
    }
  };

  // ── Delete for me ─────────────────────────────────────────────────────
  const handleDeleteForMe = useCallback(async (msgId) => {
    if (!chatId || !msgId) return;
    try {
      await updateDoc(doc(db, "chats", chatId, "messages", msgId), {
        deletedFor: arrayUnion(user.uid),
      });

      // Show undo toast — dismiss any previous one first
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      setUndoToast({ msgId });
      undoTimerRef.current = setTimeout(dismissToast, UNDO_TIMEOUT_MS);
    } catch (err) {
      console.error("Error deleting message for me:", err);
    }
  }, [chatId, user.uid, dismissToast]);

  // ── UNDO delete for me ────────────────────────────────────────────────
  const handleUndo = useCallback(async () => {
    if (!undoToast || !chatId) return;
    const { msgId } = undoToast;
    dismissToast();
    try {
      await updateDoc(doc(db, "chats", chatId, "messages", msgId), {
        deletedFor: arrayRemove(user.uid),
      });
    } catch (err) {
      console.error("Error undoing delete:", err);
    }
  }, [undoToast, chatId, user.uid, dismissToast]);

  // ── Delete for everyone ───────────────────────────────────────────────
  const handleDeleteForEveryone = useCallback(async (msgId) => {
    if (!chatId || !msgId) return;
    try {
      await updateDoc(doc(db, "chats", chatId, "messages", msgId), {
        deletedForEveryone: true,
        text: "",
        imageUrl: null,
        fileName: null,
        fileType: null,
      });
    } catch (err) {
      console.error("Error deleting message for everyone:", err);
    }
  }, [chatId]);

  const onBack = () => navigate("/");

  if (!selectedUser) {
    return (
      <div style={{ color: "white", padding: "20px" }}>
        User not found. <button onClick={() => navigate("/")}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="user-info">
          <button className="back-button" onClick={onBack}>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="avatar">{selectedUser.email[0].toUpperCase()}</div>
          <div className="details">
            <h2>{selectedUser.email}</h2>
            <p>Personal Chat</p>
          </div>
        </div>
        <button className="clear-chat-btn" onClick={handleClearChat} title="Clear Chat for me">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Clear</span>
        </button>
      </div>

      <MessageList
        messages={messages}
        user={user}
        scrollRef={scrollRef}
        onDeleteForMe={handleDeleteForMe}
        onDeleteForEveryone={handleDeleteForEveryone}
      />

      {/* ── Undo Toast — sits between message list and input bar ── */}
      {undoToast && (
        <div className="undo-toast">
          <span className="undo-toast-text">Message deleted for me</span>
          <button className="undo-toast-btn" onClick={handleUndo}>UNDO</button>
        </div>
      )}

      <MessageInput
        chatId={chatId}
        user={user}
        selectedUser={selectedUser}
        scrollRef={scrollRef}
      />
    </div>
  );
}

export default Chat;