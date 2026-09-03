// src/components/Timer.jsx
import React, { useState, useEffect } from 'react';

export default function Timer({ task, onSave, onCancel }) {
  // Unique storage key for this specific task
  const STORAGE_KEY = `pixel_timer_${task.id}`;

  // 1. Initialize state from Local Storage (if it exists) to survive tab reloads
  const getInitialState = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      seconds: 0,
      isActive: true,
      isFinished: false,
      note: '',
      startTime: Date.now(),
      accumulated: 0
    };
  };

  const initialState = getInitialState();

  const [seconds, setSeconds] = useState(initialState.seconds);
  const [isActive, setIsActive] = useState(initialState.isActive);
  const [isFinished, setIsFinished] = useState(initialState.isFinished);
  const [note, setNote] = useState(initialState.note);
  const [startTime, setStartTime] = useState(initialState.startTime);
  const [accumulated, setAccumulated] = useState(initialState.accumulated);

  // 2. Auto-save every time the state changes
  useEffect(() => {
    const stateToSave = { seconds, isActive, isFinished, note, startTime, accumulated };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [seconds, isActive, isFinished, note, startTime, accumulated, STORAGE_KEY]);

  // 3. Timer Engine
  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setSeconds(accumulated + elapsed);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, startTime, accumulated]);

  const toggleTimer = () => {
    if (isActive) {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setAccumulated(prev => prev + elapsed);
      setSeconds(accumulated + elapsed);
      setIsActive(false);
    } else {
      setStartTime(Date.now());
      setIsActive(true);
    }
  };

  const handleEnd = () => {
    if (isActive) {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const newTotal = accumulated + elapsed;
      setAccumulated(newTotal);
      setSeconds(newTotal);
    }
    setIsActive(false);
    setIsFinished(true);
  };

  // 4. Fixed Time Formatting (Now handles hours!)
  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    
    if (h > 0) return `${h}:${m}:${s}`;
    return `${m}:${s}`;
  };

  // 5. Clean up local storage when saving or canceling
  const handleSave = () => {
    localStorage.removeItem(STORAGE_KEY);
    onSave(task.id, seconds, note);
  };

  const handleCancel = () => {
    localStorage.removeItem(STORAGE_KEY);
    onCancel();
  };

  if (isFinished) {
    return (
      <div className="timer-overlay">
        <h3>Save: {task.name}</h3>
        <p>Time logged: <strong>{formatTime(seconds)}</strong></p>
        <input 
          className="retro-input"
          type="text" 
          placeholder="What did you do?" 
          value={note}
          onChange={(e) => setNote(e.target.value)}
          autoFocus
        />
        <div className="timer-controls">
          <button className="retro-btn" onClick={handleSave}>Save</button>
          <button className="retro-btn" onClick={handleCancel}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="timer-overlay">
      <h3>Tracking: {task.name}</h3>
      <div className="timer-display">{formatTime(seconds)}</div>
      <div className="timer-controls">
        <button className="retro-btn" onClick={toggleTimer}>
          {isActive ? 'Pause' : 'Resume'}
        </button>
        <button className="retro-btn" onClick={handleEnd}>End</button>
      </div>
    </div>
  );
}