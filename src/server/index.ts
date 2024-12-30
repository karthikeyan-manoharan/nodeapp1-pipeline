import express from 'express';
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../../public')));

// API route
app.get('/api', (req, res) => {
  res.json({ message: 'Hello from server!' });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});