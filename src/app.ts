import bodyParser from 'body-parser';
import express from 'express';
import { Request, Response } from 'express';

const app = express();

// parse body for application/json
app.use(bodyParser.json());

// parse url for application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// a simple route to test that the server is running
app.get('/', (_req: Request, res: Response) => {
  res.send('ok');
});

export default app;
