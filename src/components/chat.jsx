import {useState , useRef, useEffect} from "react";
import { db, storage } from "../firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import EmojiPicker from "emoji-picker-react";


 function Chat ({ user, selectedUser, onBack }) {
  const [input, setInput] = useState(""); // Stores what user is typing 
  const [file, setFile] = useState(null); // Stores file selected
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // Controls emoji picker
  const [uploading, setUploading] = useState(false); // Controls upload state
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef(null); // used to control scroll (autoscroll to bottom)

  const chatId = [user.uid, selectedUser.uid].sort().join("_");

  useEffect (()=> {
    // Go to messages subcollection for this specific chat
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({id:doc.id, ...doc.data()})));
    });
    return() => unsubscribe();
  }, [chatId]);

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
    }
    catch (err) {
      // handle errors
      console.log("error sending message : ", err);
    } finally {
      setUploading(false); // reset upload state
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
      </div>

      <div className="messages-list" ref={scrollRef}>
        {/* // Loop through all messages */}
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            // if msg is yours show on right sent else show on left recieved
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
                {/* // convert firebase time to normal time  */}
                {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Sending..."}
              </span>
            </div>
          </div>
        ))}
      </div>
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