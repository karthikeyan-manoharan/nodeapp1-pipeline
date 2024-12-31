import express from 'express';
import path from 'path';

const app = express();
const port = 3001;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '..', '..', 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'index.html'));
});

// Listen on 0.0.0.0 (all interfaces)
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});

// Also listen on localhost
app.listen(port, 'localhost', () => {
  console.log(`Server also running at http://localhost:${port}`);
});

export default app;