 import {useState , useRef, useEffect} from "react";
 import { db, auth } from "../firebase";
 import { collection, addDoc, serverTimestamp } from "firebase/firestore"; // used to add messages to database and add time automatically


 function Chat ({ user, messages }) {
  const [input, setInput] = useState(""); // Stores what user is typing 
  const scrollRef = useRef(null); // used to control scroll (autoscroll to bottom)

  useEffect (() => {
    // whenever new messages comes scroll goes to bottom automatically
    if(scrollRef.current) {
      scrollRef.current.scrollTop= scrollRef.current.scrollHeight;
    }
  },[messages]);

  // Function to send message
  const sendMessage = async(e) => {
    e.preventDefault(); // prevent page reloading
    if(input.trim() === "") return; // if user types nothing => do nothing

    // Add message to Firestore
    try {
      await addDoc(collection(db,"messages"), {
        text: input,
        sender: user.email,
        createdAt: serverTimestamp(),
        uid: user.uid
      });
      setInput(""); // clear input after sending
    }
    catch (err) {
      // handle errors
      console.log("error sending message : ", err);
    }
    
  };
 // User UI 
  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="user-info">
          <div className="avatar">{user.email[0].toUpperCase()}</div> {/* Shows first letter of email */}
          <div className="details">
            <h2>Chat Room</h2>
            <p>{user.email}</p>  {/* shows full email */}
          </div>
        </div>
        {/* // logout button */}
        <button onClick={() => auth.signOut()} className="logout-button">Sign Out</button>
      </div>

      <div className="messages-list" ref={scrollRef}>
        {/* // Loop through all messages */}
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            // if msg is yours show on right sent else show on left recieved
            className={`message-bubble ${msg.uid === user.uid ? "sent" : "received"}`}  
          >
            <div className="message-content">
              {/* // if message is not yours show sender name */}
              {msg.uid !== user.uid && <span className="sender-name">{msg.sender}</span>}
              <p>{msg.text}</p>
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
        {/* // input field  user types messages saved in input */}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          required
        />
        <button type="submit" className="send-button">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </form>
    </div>
  );
}

export default Chat; 