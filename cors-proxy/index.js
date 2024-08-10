import express from 'express';
import fetch from 'node-fetch';

const app = express();
const port = 3001;

const API_BASE_URL = 'https://bugzilla.mozilla.org/rest';

app.use(express.json());

app.post('/api/user/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const response = await fetch(`${API_BASE_URL}/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ login: username, password })
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).send('Error communicating with Bugzilla API');
  }
});

app.listen(port, () => {
  console.log(`CORS proxy server listening at http://localhost:${port}`);
});
