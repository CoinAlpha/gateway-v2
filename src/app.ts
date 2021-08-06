import bodyParser from 'body-parser';
import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { EthereumRoutes } from './chains/ethereum/ethereum.routes';
const app = express();

// parse body for application/json
app.use(bodyParser.json());

// parse url for application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// mount sub routers
app.use('/eth', EthereumRoutes.router);

// a simple route to test that the server is running
app.get('/', (_req: Request, res: Response) => {
  res.send('ok');
});

// handle any error thrown in the gateway api route
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const stack = err.stack || '';
  const message = err.message || 'Something went wrong';
  res.status(500).json({ message: message, stack: stack });
});

export default app;
