import React, { useState, useEffect, useCallback } from 'react';
import LogDisplay from './LogDisplay';

const SearchBox = () => {
  const [logs, setLogs] = useState([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);
  const [regex, setRegex] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);
    setStartTime(fiveMinutesAgo.toISOString().slice(0, -1));
    setEndTime(now.toISOString().slice(0, -1));
  }, []);

  const validateTimeRange = () => {
    if (!startTime && !endTime) {
      setError('Please select at least one time range');
      return false;
    }

    if (startTime && endTime && new Date(startTime) > new Date(endTime)) {
      setError('Start time cannot be later than end time');
      return false;
    }

    return true;
  };

  const fetchLogs = async (reset = false) => {
    console.log('fetchLogs called');
    if (!validateTimeRange()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch the UUID
      console.log('fetching uuid');
      
      const uuidResponse = await fetch(
        `http://localhost:3000/search?startTime=${startTime}&endTime=${endTime}&regex=${regex}&text=${text}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          mode: 'cors',
        }
      );
      console.log('uuidResponse:', uuidResponse.ok);
      

      if (!uuidResponse.ok) {
        throw new Error(`HTTP error! status: ${uuidResponse.status}`);
      }

      const uuidData = await uuidResponse.json();
      console.log('uuidData:', uuidData);
      
      const uuid = uuidData.uuid;
      console.log('uuid:', uuid);

      // Fetch the logs using the UUID and offset
      const logsResponse = await fetch(
        `http://localhost:3000/search/${uuid}/${reset ? 0 : offset}?regex=${regex}&text=${text}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          mode: 'cors',
        }
      );

      if (!logsResponse.ok) {
        throw new Error(`HTTP error! status: ${logsResponse.status}`);
      }

      const logsData = await logsResponse.json();
      console.log('logsData:', logsData);
      

      if (logsData) {
        if (reset) {
          setLogs(Array.isArray(logsData.data) ? logsData.data : []);
          setOffset(logsData.offset || 0);

          setPage(2);
        } else {
          setLogs(prevLogs => [
            ...prevLogs,
            ...(Array.isArray(logsData.data) ? logsData.data : [])
          ]);
          setOffset(logsData.offset || 0);
          setPage(prev => prev + 1);
        }

        
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    // Reset the logs when doing a new search
    setLogs([]);
    setPage(1);
    fetchLogs(true);
  };

  const handleClear = () => {
    setStartTime(startTime);
    setEndTime(endTime);
    setLogs([]);
    setError(null);
    setPage(1);
    setRegex('');
    setText('');
  };

  const handleScroll = useCallback(() => {
    const logDisplay = document.getElementById('log-display');
    
    
    
    if (logDisplay) {
      const { scrollTop, scrollHeight, clientHeight } = logDisplay;
      
      if (scrollTop + clientHeight >= scrollHeight - 5 && !isLoading) {
        console.log('Reached bottom of scroll');
        fetchLogs(false);
      }
    }
  }, [isLoading]);

  useEffect(() => {
    const logDisplay = document.getElementById('log-display');
    if (logDisplay) {
      logDisplay.addEventListener('scroll', handleScroll);
      return () => logDisplay.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  return (
    <div style={{ padding: '1rem', maxWidth: '90%', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Log Search</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          flexWrap: 'wrap',
          padding: '1rem',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ marginBottom: '0.5rem' }}>Start Time:</span>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => {
                setError(null);
                setStartTime(e.target.value);
              }}
              style={{ 
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </label>
          
          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ marginBottom: '0.5rem' }}>End Time:</span>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => {
                setError(null);
                setEndTime(e.target.value);
              }}
              style={{ 
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </label>
          
          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ marginBottom: '0.5rem' }}>Regex:</span>
            <input
              type="text"
              value={regex}
              onChange={(e) => setRegex(e.target.value)}
              style={{ 
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </label>
          
          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ marginBottom: '0.5rem' }}>Text:</span>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ 
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </label>
          
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            alignSelf: 'flex-end'
          }}>
            <button
              onClick={handleSearch}
              disabled={isLoading}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: isLoading ? '#93c5fd' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? 'Loading...' : 'Fetch Logs'}
            </button>

            <button
              onClick={handleClear}
              disabled={isLoading}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: '4px',
            color: '#dc2626'
          }}>
            {error}
          </div>
        )}

        {logs.length > 0 && (
          <>
            <div style={{
              padding: '0.5rem',
              backgroundColor: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '4px',
              color: '#166534'
            }}>
              Showing logs from{' '}
              {startTime ? new Date(startTime).toLocaleString() : 'the beginning'}{' '}
              to{' '}
              {endTime ? new Date(endTime).toLocaleString() : 'now'}
            </div>
            
            <div id="log-display" style={{ overflowY: 'auto', maxHeight: '400px', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', backgroundColor: '#f9fafb' }}>
              
              <LogDisplay logs={logs} />
            </div>

            {isLoading && (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <span>Loading...</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchBox;