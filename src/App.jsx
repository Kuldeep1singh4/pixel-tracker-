// src/App.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import Matrix from './components/Matrix';
import Archive from './components/Archive';
import FriendSearch from './components/FriendSearch'; // NEW IMPORT
import './index.css';

export default function App() {
  const [session, setSession] = useState(null);
  const [currentView, setCurrentView] = useState('tracker');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (isLoading) {
    return <div className="retro-container" style={{ margin: '50px auto', textAlign: 'center' }}><h2>BOOTING SYSTEM...</h2></div>;
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div style={{ paddingBottom: '100px' }}> 
      
      {currentView === 'tracker' && <Matrix />}
      {currentView === 'archive' && <Archive />} 
      {currentView === 'network' && <FriendSearch />} 

      <div className="retro-nav-bar">
        <div className="retro-nav-logo">PIXEL_TRACKER.exe</div>
        
        <button 
          className="retro-btn" 
          style={{ 
            width: '120px',
            background: currentView === 'tracker' ? 'var(--secondary-accent)' : 'white',
            color: currentView === 'tracker' ? 'white' : 'var(--text-dark)',
            textShadow: currentView === 'tracker' ? '1px 1px 0px black' : 'none'
          }}
          onClick={() => setCurrentView('tracker')}
        >
          MATRIX
        </button>
        
        <button 
          className="retro-btn" 
          style={{ 
            width: '120px',
            background: currentView === 'archive' ? 'var(--secondary-accent)' : 'white',
            color: currentView === 'archive' ? 'white' : 'var(--text-dark)',
            textShadow: currentView === 'archive' ? '1px 1px 0px black' : 'none'
          }}
          onClick={() => setCurrentView('archive')}
        >
          ARCHIVE
        </button>

        <button 
          className="retro-btn" 
          style={{ 
            width: '120px',
            background: currentView === 'network' ? 'var(--secondary-accent)' : 'white',
            color: currentView === 'network' ? 'white' : 'var(--text-dark)',
            textShadow: currentView === 'network' ? '1px 1px 0px black' : 'none'
          }}
          onClick={() => setCurrentView('network')}
        >
          NETWORK
        </button>

        <button 
          className="retro-btn" 
          style={{ marginLeft: 'auto', padding: '5px 15px', background: '#ff4444', color: 'white' }}
          onClick={handleLogout}
        >
          LOGOUT
        </button>
      </div>
    </div>
  );
}