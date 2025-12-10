import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Check for forms to identify devices
      const formsFile = path.join(process.cwd(), 'data', 'forms.json');
      let devices = [];
      
      if (fs.existsSync(formsFile)) {
        const forms = JSON.parse(fs.readFileSync(formsFile));
        
        // Extract unique devices from forms
        const deviceMap = {};
        forms.forEach(form => {
          if (form.device_id && !deviceMap[form.device_id]) {
            deviceMap[form.device_id] = {
              device_id: form.device_id,
              last_seen: form.timestamp,
              form_count: 1
            };
          } else if (deviceMap[form.device_id]) {
            deviceMap[form.device_id].form_count++;
            if (new Date(form.timestamp) > new Date(deviceMap[form.device_id].last_seen)) {
              deviceMap[form.device_id].last_seen = form.timestamp;
            }
          }
        });
        
        devices = Object.values(deviceMap);
      }
      
      // Add some demo devices if none
      if (devices.length === 0) {
        devices = [
          {
            device_id: 'DEMO_DEVICE_001',
            last_seen: new Date().toISOString(),
            form_count: 3
          },
          {
            device_id: 'DEMO_DEVICE_002',
            last_seen: new Date(Date.now() - 3600000).toISOString(),
            form_count: 1
          }
        ];
      }
      
      res.status(200).json(devices);
      
    } catch (error) {
      console.error('Devices error:', error);
      res.status(200).json([]);
    }
  }
}