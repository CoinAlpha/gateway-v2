import bodyParser from 'body-parser';
import express from 'express';
import { RequestHandler, Request, Response, NextFunction } from 'express';
// import { errorMiddleware } from './services/error-handler';
import { EthereumRoutes } from './chains/ethereum/ethereum.routes';
const app = express();

// parse body for application/json
app.use(bodyParser.json());

// parse url for application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// handle errors, this must be defined last
// app.use(errorMiddleware);
const asyncHandler =
  (fn: RequestHandler) => (req: Request, res: Response, next: NextFunction) => {
    console.log('asyncHandler called');
    return Promise.resolve(fn(req, res, next)).catch(next);
  };

// app.use(asyncHandler(async(_req: Request, _res: Response, next: NextFunction) => {
//     console.log('the async handler... can it handle errors');
//     next();
// }));

app.use(
  asyncHandler(async (_req: Request, _res: Response, next: NextFunction) => {
    console.log('the async handler... can it handle errors');
    next();
  })
);

// mount sub routers
app.use('/eth', EthereumRoutes.router);

// a simple route to test that the server is running
app.get('/', (_req: Request, res: Response) => {
  res.send('ok');
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.log('error handler');
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

export default app;
