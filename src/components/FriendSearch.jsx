// src/components/FriendSearch.jsx
import React, { useState } from 'react';
import { generateChartDates, formatDateShort } from '../utils/dateUtils';
import DetailModal from './DetailModal';
import { searchProfileByUsername, getFriendActiveChart, getTasks, getEntries, getTaskLogs } from '../utils/db';

export default function FriendSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [friendProfile, setFriendProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Matrix Data
  const [chartDates, setChartDates] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [entriesMap, setEntriesMap] = useState({});
  const [taskLogs, setTaskLogs] = useState([]);
  const [detailView, setDetailView] = useState({ type: null, item: null });

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setErrorMsg('');
    setFriendProfile(null);
    setTasks([]);

    const profile = await searchProfileByUsername(searchQuery);
    
    if (!profile) {
      setErrorMsg(`User '${searchQuery}' not found in the database.`);
      setIsLoading(false);
      return;
    }

    setFriendProfile(profile);

    const activeChart = await getFriendActiveChart(profile.id);
    
    if (!activeChart) {
      setErrorMsg(`User '${profile.username}' has not initialized a matrix for this month yet.`);
      setIsLoading(false);
      return;
    }

    setChartDates(generateChartDates(activeChart.start_date, activeChart.end_date));
    
    const fetchedTasks = await getTasks(activeChart.id);
    setTasks(fetchedTasks);
    
    const fetchedEntries = await getEntries(activeChart.id);
    const eMap = {};
    fetchedEntries.forEach(e => {
      if (e.status === 'completed') {
        eMap[`${e.task_id}-${e.date}`] = e;
      }
    });
    setEntriesMap(eMap);

    const fetchedLogs = await getTaskLogs(activeChart.id);
    setTaskLogs(fetchedLogs);
    
    setIsLoading(false);
  };

  return (
    <div className="retro-container" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2>NETWORK SEARCH</h2>
        
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
          <input 
            className="retro-input" 
            style={{ width: '200px', marginBottom: 0 }}
            placeholder="Enter username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="retro-btn" style={{ flex: 'none' }} disabled={isLoading}>
            {isLoading ? 'SEARCHING...' : 'FIND'}
          </button>
        </form>
      </div>

      {errorMsg && (
        <div style={{ background: 'var(--secondary-accent)', color: 'white', padding: '10px', marginBottom: '15px', fontWeight: 'bold', border: '2px solid var(--text-dark)' }}>
          {errorMsg}
        </div>
      )}

      {friendProfile && tasks.length > 0 && (
        <div style={{ minWidth: 'max-content' }}>
          <h3 style={{ borderBottom: '2px dashed var(--text-dark)', paddingBottom: '10px' }}>
            VIEWING MATRIX: @{friendProfile.username}
          </h3>
          
          <table className="matrix-table">
            <thead>
              <tr>
                <th className="task-col">TASK</th>
                {chartDates.map(date => (
                  <th 
                    key={date} 
                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => setDetailView({ type: 'day', item: date })}
                    title="View Day Log"
                  >
                    <div style={{ whiteSpace: 'nowrap' }}>{formatDateShort(date)}</div>
                  </th>
                ))}
                <th>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => {
                const completedCount = chartDates.filter(d => entriesMap[`${task.id}-${d}`]).length;
                return (
                  <tr key={task.id}>
                    <td className="task-col">
                      <span style={{ fontWeight: 'bold' }}>{task.name}</span>
                    </td>
                    
                    {chartDates.map(date => {
                      const isDone = !!entriesMap[`${task.id}-${date}`];
                      return (
                        <td 
                          key={date} 
                          className="checkbox-cell"
                          onClick={() => setDetailView({ type: 'task_day', item: { task, date } })}
                        >
                          {isDone ? '✓' : ''}
                        </td>
                      );
                    })}
                    
                    <td 
                      style={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}
                      onClick={() => setDetailView({ type: 'task', item: task })}
                      title="View Task History"
                    >
                      {completedCount}/{chartDates.length}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {detailView.type && (
        <DetailModal 
          type={detailView.type}
          item={detailView.item}
          entriesMap={entriesMap}
          taskLogs={taskLogs}
          tasks={tasks}
          onClose={() => setDetailView({ type: null, item: null })}
        />
      )}
    </div>
  );
}