import React, {useState , useRef, useEffect, useMemo} from "react";
import { db, storage } from "../firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import EmojiPicker from "emoji-picker-react";


 function Chat ({ user, selectedUser, onBack }) {
  const [input, setInput] = useState(""); // Stores what user is typing 
  const [file, setFile] = useState(null); // Stores file selected
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // Controls emoji picker
  const [uploading, setUploading] = useState(false); // Controls upload state
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef(null); // used to control scroll (autoscroll to bottom)
  const inputRef = useRef(null); // Ref for the message input field

  const [clearedAt, setClearedAt] = useState(null);

  const chatId = [user.uid, selectedUser.uid].sort().join("_");

  useEffect(() => {
    if (!user || !chatId) return;
    const clearedRef = doc(db, "users", user.uid, "clearedChats", chatId);
    const unsubscribe = onSnapshot(clearedRef, (docSnap) => {
      if (docSnap.exists()) {
        setClearedAt(docSnap.data().clearedAt);
      } else {
        setClearedAt(null);
      }
    });
    return () => unsubscribe();
  }, [user, chatId]);

  useEffect (()=> {
    // Go to messages subcollection for this specific chat
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMsgs = snapshot.docs.map((doc) => ({id:doc.id, ...doc.data()}));
      
      // Filter out messages that were cleared by the user
      const filtered = clearedAt ? allMsgs.filter(msg => {
        // If message is still being sent (createdAt is null), keep it 
        if (!msg.createdAt) return true;
        // Compare timestamps
        return msg.createdAt.toMillis() > clearedAt.toMillis();
      }) : allMsgs;

      setMessages(filtered);
    });
    return() => unsubscribe();
  }, [chatId, clearedAt]);

  useEffect (() => {
    // whenever new messages comes scroll goes to bottom automatically
    if(scrollRef.current) {
      scrollRef.current.scrollTop= scrollRef.current.scrollHeight;
    }
  },[messages]);

  // Function to send message
  const sendMessage = async(e) => {
    e.preventDefault(); // prevent page reloading
    if(input.trim() === "" && !file) return; // if user types nothing and no file => do nothing

    setUploading(true);
    // Add message to Firestore
    try {
      let fileUrl = null;
      let fName = null;
      let fType = null;
      if (file) {
        const storageRef = ref(storage, `attachments/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        fileUrl = await getDownloadURL(storageRef);
        fName = file.name;
        fType = file.type;
      }

      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: input,
        imageUrl: fileUrl,  // kept as imageUrl for older message compatibility
        fileName: fName,
        fileType: fType,
        sender: user.uid,
        senderEmail: user.email,
        receiver: selectedUser.uid,
        receiverEmail: selectedUser.email,
        createdAt: serverTimestamp(),
      });
      setInput(""); // clear input after sending
      setFile(null); // clear file
      setShowEmojiPicker(false); // hide emoji picker
    } catch (err) {
      // handle errors
      console.log("error sending message : ", err);
    } finally {
      setUploading(false); // reset upload state
      // Automatically refocus on the input field after state updates
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
    
  };

  const handleImage = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      e.target.value = ""; // reset input to allow uploading same file again
    }
  };

  const onEmojiClick = (emojiObject) => {
    setInput(prevInput => prevInput + emojiObject.emoji);
  };

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

  // Performance Optimization: Wrap messages in a memoized component
  // This ensures the message list only re-renders when messages or user changes,
  // making the text input field extremely responsive.
  const MessageList = useMemo(() => {
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
  }, [messages, user.uid, scrollRef]);
 // User UI 
  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="user-info">
          <button className="back-button" onClick={onBack}>
             <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
          </button>
          <div className="avatar">{selectedUser.email[0].toUpperCase()}</div> {/* Shows first letter of email */}
          <div className="details">
            <h2>{selectedUser.email}</h2>
            <p>Personal Chat</p>  
          </div>
        </div>
        <button className="clear-chat-btn" onClick={handleClearChat} title="Clear Chat for me">
           <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
           <span>Clear</span>
        </button>
      </div>

      {MessageList}
      {/* // when button clicked sendMessage runs and message goes to firebase */}
      <form onSubmit={sendMessage} className="input-area">
        <div className="input-options">
          <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="emoji-btn">😀</button>
          <label htmlFor="file-upload" className="file-upload-btn" aria-label="Attach File">
             <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
             <input type="file" id="file-upload" onChange={handleImage} style={{display: "none"}} />
          </label>
        </div>

        <div className="input-wrapper">
          {file && (
            <div className="file-preview-indicator">
              Attachment: {file.name} 
              <button type="button" onClick={() => setFile(null)}>x</button>
            </div>
          )}
          {/* // input field  user types messages saved in input */}
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={uploading}
          />
        </div>

        <button type="submit" className="send-button" disabled={uploading}>
          {uploading ? (
            <span>...</span>
          ) : (
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          )}
        </button>
        {showEmojiPicker && (
          <div className="emoji-picker-container">
            <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
          </div>
        )}
      </form>
    </div>
  );
}

export default Chat;