import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { device_id, data } = req.body;
      
      // Create data directory
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Save form data
      const formsFile = path.join(dataDir, 'forms.json');
      let forms = [];
      
      if (fs.existsSync(formsFile)) {
        forms = JSON.parse(fs.readFileSync(formsFile));
      }
      
      const newForm = {
        device_id: device_id || 'UNKNOWN_' + Date.now(),
        data: data,
        timestamp: new Date().toISOString()
      };
      
      forms.push(newForm);
      fs.writeFileSync(formsFile, JSON.stringify(forms, null, 2));
      
      // Notify via WebSocket
      if (req.socket.server.io) {
        req.socket.server.io.emit('NEW_FORM', newForm);
      }
      
      res.status(200).json({ 
        success: true, 
        message: 'Form data saved successfully' 
      });
      
    } catch (error) {
      console.error('Submit error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}