// src/components/Archive.jsx
import React, { useState, useEffect } from 'react';
import { generateChartDates, formatDateShort } from '../utils/dateUtils';
import DetailModal from './DetailModal';
import { getPastCharts, getTasks, getEntries, getTaskLogs } from '../utils/db';

export default function Archive() {
  const [pastCharts, setPastCharts] = useState([]);
  const [selectedChartId, setSelectedChartId] = useState(null);
  
  const [chartDates, setChartDates] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [entriesMap, setEntriesMap] = useState({});
  const [taskLogs, setTaskLogs] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [detailView, setDetailView] = useState({ type: null, item: null });

  useEffect(() => {
    loadPastCharts();
  }, []);

  useEffect(() => {
    if (selectedChartId) {
      loadChartData(selectedChartId);
    }
  }, [selectedChartId]);

  const loadPastCharts = async () => {
    setIsLoading(true);
    const charts = await getPastCharts();
    setPastCharts(charts);
    if (charts.length > 0) {
      setSelectedChartId(charts[0].id);
    }
    setIsLoading(false);
  };

  const loadChartData = async (chartId) => {
    setIsLoading(true);
    const targetChart = pastCharts.find(c => c.id === chartId);
    
    if (targetChart) {
      setChartDates(generateChartDates(targetChart.start_date, targetChart.end_date));
      
      const fetchedTasks = await getTasks(chartId);
      setTasks(fetchedTasks);
      
      const fetchedEntries = await getEntries(chartId);
      const eMap = {};
      fetchedEntries.forEach(e => {
        if (e.status === 'completed') {
          eMap[`${e.task_id}-${e.date}`] = e;
        }
      });
      setEntriesMap(eMap);

      const fetchedLogs = await getTaskLogs(chartId);
      setTaskLogs(fetchedLogs);
    }
    setIsLoading(false);
  };

  const formatMonthName = (dateStr) => {
    const date = new Date(`${dateStr}T00:00:00`);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (isLoading && pastCharts.length === 0) {
    return <div className="retro-container"><h2>LOADING ARCHIVES...</h2></div>;
  }

  if (pastCharts.length === 0) {
    return (
      <div className="retro-container" style={{ textAlign: 'center', padding: '40px' }}>
        <h2>🗄️ NO ARCHIVES YET</h2>
        <p>Your past months will appear here once the calendar rolls over.</p>
      </div>
    );
  }

  return (
    <div className="retro-container" style={{ position: 'relative' }}>
      <div style={{ minWidth: 'max-content' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>ARCHIVE LOGS</h2>
          
          <select 
            className="retro-input" 
            style={{ width: '250px', marginBottom: 0, fontWeight: 'bold' }}
            value={selectedChartId}
            onChange={(e) => setSelectedChartId(e.target.value)}
          >
            {pastCharts.map(chart => (
              <option key={chart.id} value={chart.id}>
                {formatMonthName(chart.start_date)}
              </option>
            ))}
          </select>
        </div>
        
        {isLoading ? (
          <div>Loading matrix...</div>
        ) : (
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