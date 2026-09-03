// src/utils/db.js
import { supabase } from '../lib/supabase';
import { getCurrentMonthRange, generateChartDates } from './dateUtils';

// NEW: Helper to get the currently authenticated user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getOrCreateActiveChart = async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const { start, end } = getCurrentMonthRange();
  
  const { data: charts, error } = await supabase
    .from('charts')
    .select('*')
    .eq('status', 'active')
    .eq('start_date', start)
    .eq('end_date', end)
    .eq('user_id', user.id) // Scoped to current user
    .limit(1);

  if (error) console.error("Error fetching chart:", error);

  if (charts && charts.length > 0) {
    return charts[0];
  }

  const { data: newChart, error: insertError } = await supabase
    .from('charts')
    .insert([{ start_date: start, end_date: end, status: 'active', user_id: user.id }])
    .select()
    .single();

  if (insertError) console.error("Error creating chart:", insertError);
  return newChart;
};

export const getTasks = async (chartId) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('chart_id', chartId)
    .eq('archived', false)
    .order('created_at', { ascending: true });
  
  if (error) console.error("Error fetching tasks:", error);
  return data || [];
};

export const addTask = async (chartId, name) => {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('tasks')
    .insert([{ chart_id: chartId, name, user_id: user.id }])
    .select()
    .single();
    
  if (error) console.error("Error adding task:", error);
  return data;
};

export const getEntries = async (chartId) => {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('chart_id', chartId);
    
  if (error) console.error("Error fetching entries:", error);
  return data || [];
};

export const getTaskLogs = async (chartId) => {
  const { data, error } = await supabase
    .from('task_logs')
    .select('*, tasks!inner(chart_id)')
    .eq('tasks.chart_id', chartId)
    .order('created_at', { ascending: true });
    
  if (error) console.error("Error fetching task logs:", error);
  return data || [];
};

export const saveTaskSession = async (chartId, taskId, date, elapsedSeconds, note) => {
  const user = await getCurrentUser();
  if (!user) return null;

  const { error: logError } = await supabase
    .from('task_logs')
    .insert([{ task_id: taskId, date: date, time_spent_seconds: elapsedSeconds, description: note, user_id: user.id }]);

  if (logError) console.error("Error saving task log:", logError);

  const { data: existingEntry } = await supabase
    .from('entries')
    .select('time_spent_seconds')
    .eq('task_id', taskId)
    .eq('date', date)
    .single();

  const newTotalTime = (existingEntry?.time_spent_seconds || 0) + elapsedSeconds;

  const entryData = {
    task_id: taskId,
    chart_id: chartId,
    date: date,
    status: 'completed',
    time_spent_seconds: newTotalTime,
    description: 'Multiple sessions logged',
    user_id: user.id
  };

  const { data, error } = await supabase
    .from('entries')
    .upsert([entryData], { onConflict: 'task_id,date' })
    .select();
    
  if (error) console.error("Error saving entry:", error);
  return data;
};

export const deleteTask = async (taskId) => {
    const {error} = await supabase
        .from('tasks') 
        .delete()
        .eq('id', taskId);
    if (error) {
        console.error("ERROR deleting task:", error);
        return false;
    }
    return true;
};

export const getPastCharts = async () => {
  const user = await getCurrentUser();
  if (!user) return [];

  const { start } = getCurrentMonthRange();
  
  const { data, error } = await supabase
    .from('charts')
    .select('*')
    .eq('user_id', user.id)
    .lt('start_date', start)
    .order('start_date', { ascending: false })
    .limit(3);
    
  if (error) console.error("Error fetching past charts:", error);
  return data || [];
};

// Append to the bottom of src/utils/db.js

export const searchProfileByUsername = async (username) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', username.toLowerCase())
    .single();
    
  if (error) return null;
  return data;
};

export const getFriendActiveChart = async (friendId) => {
  const { start, end } = getCurrentMonthRange();
  
  const { data, error } = await supabase
    .from('charts')
    .select('*')
    .eq('status', 'active')
    .eq('start_date', start)
    .eq('end_date', end)
    .eq('user_id', friendId)
    .limit(1);
    
  if (error || !data || data.length === 0) return null;
  return data[0];
};