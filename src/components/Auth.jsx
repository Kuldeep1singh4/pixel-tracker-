// src/components/Auth.jsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        // Sign up and bundle the username securely into the user's metadata
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              username: username
            }
          }
        });
        
        if (error) throw error;
        
        // The SQL trigger now handles the profile creation automatically!
        alert("ACCOUNT CREATED! Check your email to verify your link before logging in.");
        setIsLogin(true);
      }
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="retro-container" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <h2 style={{ borderBottom: '4px solid var(--text-dark)', paddingBottom: '10px', marginBottom: '20px' }}>
          {isLogin ? 'SYSTEM LOGIN' : 'NEW REGISTRATION'}
        </h2>
        
        {errorMsg && (
          <div style={{ background: 'var(--secondary-accent)', color: 'white', padding: '10px', marginBottom: '15px', fontWeight: 'bold', border: '2px solid var(--text-dark)' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {!isLogin && (
            <input 
              className="retro-input" 
              type="text" 
              placeholder="Choose Username" 
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              required={!isLogin}
              style={{ marginBottom: '0' }}
            />
          )}
          
          <input 
            className="retro-input" 
            type="email" 
            placeholder="Email Address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ marginBottom: '0' }}
          />
          
          <input 
            className="retro-input" 
            type="password" 
            placeholder="Password (min 6 chars)" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ marginBottom: '0' }}
          />

          <button 
            type="submit" 
            className="retro-btn" 
            style={{ marginTop: '10px', background: 'var(--secondary-accent)', color: 'white', fontSize: '1.1rem' }}
            disabled={loading}
          >
            {loading ? 'PROCESSING...' : (isLogin ? 'ACCESS MATRIX' : 'CREATE ACCOUNT')}
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '0.9rem' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            style={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }} 
            onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}
          >
            {isLogin ? "Sign up here." : "Log in here."}
          </span>
        </p>
      </div>
    </div>
  );
}