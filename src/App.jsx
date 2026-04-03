import React, { useEffect } from "react";
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import { setUser } from "./redux/authSlice";
import { setContacts } from "./redux/usersSlice";

import Login from "./components/login";
import Chat from "./components/chat";
import Contacts from "./components/Contacts";

function App() {
  const dispatch = useDispatch();
  const { currentUser, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userData = {
          uid: user.uid,
          email: user.email,
        };
        dispatch(setUser(userData));
        
        await setDoc(doc(db, "users", user.uid), userData, { merge: true });
      } else {
        dispatch(setUser(null));
      }
    });
    return () => unsubscribe();
  }, [dispatch]);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const allUsers = snapshot.docs.map((doc) => doc.data());
      dispatch(setContacts(allUsers.filter((u) => u.uid !== currentUser.uid)));
    });
    return () => unsubscribe();
  }, [currentUser, dispatch]);

  if (loading) {
    return <div className="app"><div className="app-container" style={{display:'flex', justifyContent:'center', alignItems:'center'}}>Loading...</div></div>;
  }

  return (
    <div className="app">
      <div className="app-container">
        <Routes>
          <Route path="/login" element={currentUser ? <Navigate to="/" /> : <Login />} />
          <Route path="/" element={currentUser ? <Contacts /> : <Navigate to="/login" />} />
          <Route path="/chat/:userId" element={currentUser ? <Chat /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;