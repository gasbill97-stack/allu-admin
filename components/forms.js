import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const formsFile = path.join(process.cwd(), 'data', 'forms.json');
      
      if (fs.existsSync(formsFile)) {
        const forms = JSON.parse(fs.readFileSync(formsFile));
        res.status(200).json(forms.reverse()); // Newest first
      } else {
        res.status(200).json([]);
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}