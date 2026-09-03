// src/components/DetailModal.jsx
import React from 'react';
import { formatDateShort } from '../utils/dateUtils';

export default function DetailModal({ type, item, entriesMap, taskLogs, tasks, onClose }) {
  if (!item) return null;

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}hr ${m}min`;
    return `${m}min`;
  };

  let title = '';
  let totalSeconds = 0;
  let contentToRender = null;

  // --- 1. SPECIFIC SHIFT FORMAT (task_day) ---
  if (type === 'task_day') {
    title = `${item.task.name} - ${formatDateShort(item.date)}`;
    const entry = entriesMap[`${item.task.id}-${item.date}`];
    if (entry) totalSeconds = entry.time_spent_seconds;

    const specificLogs = (taskLogs || []).filter(log => log.task_id === item.task.id && log.date === item.date);

    contentToRender = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {specificLogs.length === 0 ? <p>No sessions logged.</p> : specificLogs.map((log, i) => (
          <div key={i} style={{ fontSize: '0.95rem' }}>
            - Session {i + 1} : {log.description} ({formatTime(log.time_spent_seconds)})
          </div>
        ))}
      </div>
    );
  }
  
  // --- 2. DAY LOG FORMAT (day) ---
  else if (type === 'day') {
    title = `Day log: ${formatDateShort(item)}`; 
    const groupedByTask = {};
    
    // Accumulate total time and group logs by task
    tasks.forEach(task => {
      const entry = entriesMap[`${task.id}-${item}`];
      if (entry) totalSeconds += entry.time_spent_seconds;
    });

    (taskLogs || []).forEach(log => {
      if (log.date === item) {
        if (!groupedByTask[log.task_id]) groupedByTask[log.task_id] = [];
        groupedByTask[log.task_id].push(log);
      }
    });

    contentToRender = (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--text-dark)', paddingBottom: '5px', marginBottom: '10px', fontWeight: 'bold' }}>
          <span>Task</span>
          <span>Time</span>
        </div>
        {Object.keys(groupedByTask).length === 0 ? <p>No activity logged.</p> : Object.keys(groupedByTask).map(taskId => {
          const taskName = tasks.find(t => t.id === taskId)?.name || 'Unknown Task';
          return (
            <div key={taskId} style={{ marginBottom: '15px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{taskName}</div>
              {groupedByTask[taskId].map((log, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px', paddingLeft: '10px' }}>
                  <span>Session {i + 1} - {log.description}</span>
                  <span>{formatTime(log.time_spent_seconds)}</span>
                </div>
              ))}
            </div>
          );
        })}
      </>
    );
  }
  
  // --- 3. TASK HISTORY FORMAT (task) ---
  else if (type === 'task') {
    title = `Task history: ${item.name}`; 
    const groupedByDate = {};
    
    // Accumulate total time and group logs by date
    Object.values(entriesMap).forEach(entry => {
      if (entry.task_id === item.id) totalSeconds += entry.time_spent_seconds;
    });

    (taskLogs || []).forEach(log => {
      if (log.task_id === item.id) {
        if (!groupedByDate[log.date]) groupedByDate[log.date] = [];
        groupedByDate[log.date].push(log);
      }
    });

    contentToRender = (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--text-dark)', paddingBottom: '5px', marginBottom: '10px', fontWeight: 'bold' }}>
          <span>Date</span>
          <span>Time</span>
        </div>
        {Object.keys(groupedByDate).length === 0 ? <p>No activity logged.</p> : Object.keys(groupedByDate).sort().map(dateStr => (
          <div key={dateStr} style={{ marginBottom: '15px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{formatDateShort(dateStr)}</div>
            {groupedByDate[dateStr].map((log, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px', paddingLeft: '10px' }}>
                <span>Session {i + 1} - {log.description}</span>
                <span>{formatTime(log.time_spent_seconds)}</span>
              </div>
            ))}
          </div>
        ))}
      </>
    );
  }

  return (
    <div className="timer-overlay" style={{ 
      top: '10%', bottom: 'auto', left: '50%', transform: 'translateX(-50%)', 
      width: '450px', // slightly wider to accommodate the description + time layout
      maxHeight: '80vh', 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      {/* FIXED HEADER */}
      <h3 style={{ margin: '0 0 5px 0' }}>{title}</h3>
      <p style={{ margin: '0 0 15px 0', borderBottom: '2px dashed var(--text-dark)', paddingBottom: '10px' }}>
        Total time: <strong>{formatTime(totalSeconds)}</strong>
      </p>
      
      {/* SCROLLABLE CONTENT AREA */}
      <div style={{ overflowY: 'auto', flexGrow: 1, paddingRight: '5px' }}>
        {contentToRender}
      </div>
      
      {/* FIXED FOOTER */}
      <button className="retro-btn" style={{ width: '100%', marginTop: '20px' }} onClick={onClose}>
        Close
      </button>
    </div>
  );
}