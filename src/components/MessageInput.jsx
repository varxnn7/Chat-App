import React, { useState, useRef } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import EmojiPicker from "emoji-picker-react";
import { Grid } from "@giphy/react-components";
import { GiphyFetch } from "@giphy/js-fetch-api";

// Initialize Giphy
const gf = new GiphyFetch(import.meta.env.VITE_GIPHY_API_KEY || "xVPib3Xjdp1Y29hCzyIlj2NdB60hRl1E");

const MessageInput = ({ chatId, user, selectedUser, scrollRef }) => {
  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearchTerm, setGifSearchTerm] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const sendMessage = async(e) => {
    e.preventDefault();
    if(input.trim() === "" && !file) return;

    setUploading(true);
    try {
      let fileUrl = null;
      let fName = null;
      let fType = null;
      
      if (file) {
        const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME; 
        const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
        
        let resourceType = 'raw';
        if (file.type.startsWith('image/')) resourceType = 'image';
        else if (file.type.startsWith('video/')) resourceType = 'video';

        const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

        if (!CLOUD_NAME) {
            alert("Cloudinary configuration is missing. Please check your .env file!");
            setUploading(false);
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);

        const response = await fetch(CLOUDINARY_URL, {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        
        fileUrl = data.secure_url;
        fName = file.name;
        fType = file.type;
      }

      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: input,
        imageUrl: fileUrl,
        fileName: fName,
        fileType: fType,
        sender: user.uid,
        senderEmail: user.email,
        receiver: selectedUser.uid,
        receiverEmail: selectedUser.email,
        createdAt: serverTimestamp(),
        seen: false,
      });
      setInput("");
      setFile(null);
      setShowEmojiPicker(false);
    } catch (err) {
      console.log("error sending message : ", err);
    } finally {
      setUploading(false);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
        if (scrollRef?.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 50);
    }
  };

  const handleImage = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      e.target.value = "";
    }
  };

  const onEmojiClick = (emojiObject) => {
    setInput(prevInput => prevInput + emojiObject.emoji);
  };

  const onGifClick = async (gif, e) => {
    e.preventDefault();
    const gifUrl = gif.images.fixed_height.url;
    
    setUploading(true);
    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: "",
        imageUrl: gifUrl,
        fileName: "giphy.gif",
        fileType: "image/gif",
        sender: user.uid,
        senderEmail: user.email,
        receiver: selectedUser.uid,
        receiverEmail: selectedUser.email,
        createdAt: serverTimestamp(),
        seen: false,
      });
      setShowGifPicker(false);
      setGifSearchTerm("");
    } catch (err) {
      console.log("error sending gif : ", err);
    } finally {
      setUploading(false);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
        if (scrollRef?.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 50);
    }
  };

  const fetchGifs = (offset) => {
    if (gifSearchTerm.trim()) {
      return gf.search(gifSearchTerm, { offset, limit: 15 });
    }
    return gf.trending({ offset, limit: 15 });
  };

  return (
    <form onSubmit={sendMessage} className="input-area">
      <div className="input-options">
        <button type="button" onClick={() => {
          setShowEmojiPicker(!showEmojiPicker);
          setShowGifPicker(false);
        }} className="emoji-btn">😀</button>
        
        <button type="button" onClick={() => {
          setShowGifPicker(!showGifPicker);
          setShowEmojiPicker(false);
        }} className="gif-btn">GIF</button>

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
      {showGifPicker && (
        <div className="gif-picker-container">
          <input 
            type="text" 
            placeholder="Search GIFs..." 
            value={gifSearchTerm}
            onChange={(e) => setGifSearchTerm(e.target.value)}
            className="gif-search-input"
          />
          <div className="gif-grid-wrapper">
            <Grid
              key={gifSearchTerm}
              fetchGifs={fetchGifs}
              width={300}
              columns={3}
              gutter={6}
              onGifClick={onGifClick}
              noResultsMessage="No GIFs found"
            />
          </div>
        </div>
      )}
    </form>
  );
};

export default MessageInput;
