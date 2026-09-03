// src/components/Matrix.jsx
import React, { useState, useEffect } from 'react';
import { getTodayIST, generateChartDates, formatDateShort } from '../utils/dateUtils';
import Timer from './Timer';
import DetailModal from './DetailModal';
import Mascot from './Mascot';
import { getOrCreateActiveChart, getTasks, getEntries, getTaskLogs, saveTaskSession, addTask, deleteTask } from '../utils/db';

export default function Matrix() {
  const [chart, setChart] = useState(null);
  const [chartDates, setChartDates] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [entriesMap, setEntriesMap] = useState({});
  const [taskLogs, setTaskLogs] = useState([]); 
  
  const [activeTimerTask, setActiveTimerTask] = useState(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [detailView, setDetailView] = useState({ type: null, item: null });
  const [remindersEnabled, setRemindersEnabled] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const activeChart = await getOrCreateActiveChart();
    if (activeChart) {
      setChart(activeChart);
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
    }
    setIsLoading(false);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskName.trim() || !chart) return;
    const newTask = await addTask(chart.id, newTaskName);
    if (newTask) setTasks([...tasks, newTask]);
    setNewTaskName('');
  };

  const handleDeleteTask = async (taskId) => {
    const success = await deleteTask(taskId);
    if (success) {
      setTasks(tasks.filter(t => t.id !== taskId));
    }
  };

  const handleSaveTimer = async (taskId, elapsedSeconds, note) => {
    const today = getTodayIST();
    await saveTaskSession(chart.id, taskId, today, elapsedSeconds, note);
    await loadData(); 
    setActiveTimerTask(null);
  };

  const toggleReminders = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications.");
      return;
    }
    if (Notification.permission === "granted") {
      setRemindersEnabled(!remindersEnabled);
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setRemindersEnabled(true);
      }
    }
  };

  if (isLoading) return <div className="retro-container"><h2>LOADING DATABASE...</h2></div>;

  return (
    <div className="retro-container" style={{ position: 'relative' }}>
      <div style={{ minWidth: 'max-content' }}>
        
        <Mascot entriesMap={entriesMap} tasks={tasks} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>TRACKER</h2>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="retro-btn" 
              style={{ width: '150px', background: remindersEnabled ? 'var(--secondary-accent)' : 'white' }}
              onClick={toggleReminders}
            >
              {remindersEnabled ? '🔔 ALERTS ON' : '🔔 ALERTS OFF'}
            </button>

            <button 
              className="retro-btn" 
              style={{ width: '120px', background: isEditMode ? 'var(--secondary-accent)' : 'white' }}
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? 'DONE EDITING' : 'EDIT MODE'}
            </button>
          </div>
        </div>
        
        <table className="matrix-table">
          <thead>
            <tr>
              <th className="task-col">TASK</th>
              {chartDates.map((date, index) => (
                <th 
                  key={date} 
                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => !isEditMode && setDetailView({ type: 'day', item: date })}
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
                    {isEditMode ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{task.name}</span>
                        <button 
                          onClick={() => handleDeleteTask(task.id)} 
                          style={{ background: 'var(--secondary-accent)', border: '2px solid black', cursor: 'pointer', fontWeight: 'bold' }}
                        >X</button>
                      </div>
                    ) : (
                      <span className="task-name-cell" onClick={() => setActiveTimerTask(task)}>
                        {task.name}
                      </span>
                    )}
                  </td>
                  
                  {chartDates.map(date => {
                    const isDone = !!entriesMap[`${task.id}-${date}`];
                    return (
                      <td 
                        key={date} 
                        className="checkbox-cell"
                        onClick={() => !isEditMode && setDetailView({ type: 'task_day', item: { task, date } })}
                      >
                        {isDone ? '✓' : ''}
                      </td>
                    );
                  })}
                  
                  <td 
                    style={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}
                    onClick={() => !isEditMode && setDetailView({ type: 'task', item: task })}
                    title="View Task History"
                  >
                    {completedCount}/30
                  </td>
                </tr>
              );
            })}
            
            <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
              <td className="task-col">DAILY TOTAL</td>
              {chartDates.map(date => {
                const completedTasksThatDay = tasks.filter(t => entriesMap[`${t.id}-${date}`]).length;
                return (
                  <td key={date}>{completedTasksThatDay}/{tasks.length}</td>
                );
              })}
              <td>-</td>
            </tr>
          </tbody>
        </table>

        {isEditMode && (
          <form onSubmit={handleAddTask} style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <input 
              className="retro-input" 
              style={{ width: '250px', marginBottom: 0 }}
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              placeholder="New task name..."
            />
            <button type="submit" className="retro-btn" style={{ flex: 'none' }}>Add Task</button>
          </form>
        )}

        {activeTimerTask && (
          <Timer task={activeTimerTask} onSave={handleSaveTimer} onCancel={() => setActiveTimerTask(null)} />
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
    </div>
  );
}