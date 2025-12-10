import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { sender, message, timestamp, device_id } = req.body;
      
      // Create data directory
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Save SMS
      const smsFile = path.join(dataDir, 'sms.json');
      let smsList = [];
      
      if (fs.existsSync(smsFile)) {
        smsList = JSON.parse(fs.readFileSync(smsFile));
      }
      
      const newSMS = {
        sender: sender || 'Unknown',
        message: message || '',
        timestamp: timestamp || new Date().toISOString(),
        device_id: device_id || 'Unknown'
      };
      
      smsList.push(newSMS);
      fs.writeFileSync(smsFile, JSON.stringify(smsList, null, 2));
      
      // Notify via WebSocket
      if (req.socket.server.io) {
        req.socket.server.io.emit('NEW_SMS', newSMS);
      }
      
      res.status(200).json({ 
        success: true, 
        message: 'SMS saved successfully' 
      });
      
    } catch (error) {
      console.error('SMS save error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  } 
  else if (req.method === 'GET') {
    try {
      const smsFile = path.join(process.cwd(), 'data', 'sms.json');
      
      if (fs.existsSync(smsFile)) {
        const smsList = JSON.parse(fs.readFileSync(smsFile));
        res.status(200).json(smsList.reverse()); // Newest first
      } else {
        res.status(200).json([]);
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}