import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { device_id, type, data } = req.body;

      const commandsDir = path.join(process.cwd(), 'data', 'commands');
      if (!fs.existsSync(commandsDir)) {
        fs.mkdirSync(commandsDir, { recursive: true });
      }

      const commandFile = path.join(commandsDir, ${device_id}.json);

      const commandData = {
        type,
        data,
        timestamp: new Date().toISOString(),
        status: 'PENDING'
      };

      fs.writeFileSync(commandFile, JSON.stringify(commandData, null, 2));

      res.status(200).json({
        success: true,
        message: 'Command queued successfully',
        command_id: Date.now()
      });

    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  else if (req.method === 'GET') {
    const { device_id } = req.query;

    try {
      const commandFile = path.join(process.cwd(), 'data', 'commands', ${device_id}.json);

      if (fs.existsSync(commandFile)) {
        const command = JSON.parse(fs.readFileSync(commandFile, 'utf8'));
        fs.unlinkSync(commandFile);

        res.status(200).json({ command });
      } else {
        res.status(200).json({ command: null });
      }

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
