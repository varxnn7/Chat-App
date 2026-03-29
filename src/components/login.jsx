import { useState } from "react";
import {auth, db} from "../firebase";
import { createUserWithEmailAndPassword,
  signInWithEmailAndPassword
 } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

// “This function let user login or create account using Firebase.”
function Login() {
  const [email, setEmail] = useState("");   // Stores Email typed by user
  const [password , setPassword] = useState("");  // Stores password typed by user
  const [isSignup, setIsSignup] = useState(false); // Switch False => Login Mode ,  True => Signup Mode
  

  // WHEN user clicks login/signup button
  const handleSubmit = async(e) => {
    // prevents page reloading
    e.preventDefault();

    try {
      // If user is signing up => Create a new account
      if(isSignup) {
        const userCredential = await createUserWithEmailAndPassword(auth, email , password);
        // Store user in Firestore to enable contact list
        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
        });
      }
      // If user is logging in => Sign in to existing account
      else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    }
    // if any errors
    catch(err) {
      alert(err.message);
    }
  };


    return (
      <div className="login-container">
        <div className="login-header">
          <h1>{isSignup? "Create Account" : "Welcome Back"}</h1>
          <p>{isSignup? "join the community" : "Please Login to Chat"}</p>
        </div>

        <form onSubmit = {handleSubmit} className="login-form">
          <label> Email Address</label>
          {/* user types email => it gets saved in email state */}
          <input type = "email" placeholder="enter your email" value = {email} onChange={(e)=> setEmail(e.target.value)} required />

          <label> Password</label>
          {/* user types password => it gets saved in password state */}
          <input type = "password" placeholder="enter your password" value = {password} onChange={(e)=> setPassword(e.target.value)} required />

          {/* Login/Signup Button */}
          <button type = "submit" className="login-button">{isSignup? "Sign Up" : "Sign In"}</button>
        </form>

        <div className="login-footer">
          <span> {isSignup? "Already have an account?" : "Don't have an account?"}</span>
          {/* It works like a toggle switch   Login=> Switch to signup , Signup=> Switch to Login */}
          <button onClick = { () => setIsSignup(!isSignup)} className="login-toggle"> {isSignup? "Sign In" : "Sign Up"}
            </button>
        </div>
      </div>
    );
}

export default Login;