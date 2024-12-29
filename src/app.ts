import express, { Express, Request, Response } from 'express';

const app: Express = express();
const port = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from NodeApp1 Pipeline!');
});

app.listen(port, () => {
  console.log(`NodeApp1 Pipeline server running at http://localhost:${port}`);
});