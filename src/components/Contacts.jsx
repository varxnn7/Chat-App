import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';

function Contacts() {
  const { currentUser } = useSelector((state) => state.auth);
  const { contacts } = useSelector((state) => state.users);

  if (!currentUser) return null; // Or a redirect could happen here if not guaranteed

  return (
    <div className="contact-list-container">
      <div className="chat-header">
        <div className="user-info">
          <div className="avatar">{currentUser.email[0].toUpperCase()}</div>
          <div className="details">
            <h2>Contacts</h2>
            <p>{currentUser.email}</p>
          </div>
        </div>
        <button onClick={() => auth.signOut()} className="logout-button">Sign Out</button>
      </div>
      <div className="contact-list">
        <h3 className="contact-list-title">Select someone to chat with</h3>
        {contacts.length === 0 && <p className="no-users">No other users found.</p>}
        {contacts.map((u) => (
          <Link key={u.uid} to={`/chat/${u.uid}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="contact-item">
              <div className="avatar">{u.email[0].toUpperCase()}</div>
              <div className="contact-details">
                <h4>{u.email}</h4>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Contacts;
