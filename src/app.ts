import bodyParser from 'body-parser';
import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { EthereumRoutes } from './chains/ethereum/ethereum.routes';
import { ConfigManager } from './services/config-manager';
import { logger } from './services/logger';

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

interface ConfigUpdateRequest {
  APPNAME?: string;
  PORT?: number;
  IP_WHITELIST?: string[];
  HUMMINGBOT_INSTANCE_ID?: string;
  LOG_PATH?: string;
  GMT_OFFSET: number;
  CERT_PATH?: string;
  CERT_PASSPHRASE?: string;
  ETHEREUM_CHAIN?: string;
  INFURA_KEY?: string;
  ETH_GAS_STATION_ENABLE?: boolean;
  ETH_GAS_STATION_API_KEY?: string;
  ETH_GAS_STATION_GAS_LEVEL?: string;
  ETH_GAS_STATION_REFRESH_TIME?: number;
  ETH_MANUAL_GAS_PRICE?: number;
  LOG_TO_STDOUT?: boolean;
}

app.post(
  '/config/update',
  (req: Request<{}, {}, ConfigUpdateRequest>, res: Response) => {
    let config = ConfigManager.config;
    if (req.body.APPNAME) {
      config.APPNAME = req.body.APPNAME;
    }
    if (req.body.PORT) {
      config.PORT = req.body.PORT;
    }
    if (req.body.IP_WHITELIST) {
      config.IP_WHITELIST = req.body.IP_WHITELIST;
    }
    if (req.body.HUMMINGBOT_INSTANCE_ID) {
      config.HUMMINGBOT_INSTANCE_ID = req.body.HUMMINGBOT_INSTANCE_ID;
    }

    if (req.body.LOG_PATH) {
      config.LOG_PATH = req.body.LOG_PATH;
    }

    if (req.body.GMT_OFFSET) {
      config.GMT_OFFSET = req.body.GMT_OFFSET;
    }
    if (req.body.CERT_PATH) {
      config.CERT_PATH = req.body.CERT_PATH;
    }
    if (req.body.CERT_PASSPHRASE) {
      config.CERT_PASSPHRASE = req.body.CERT_PASSPHRASE;
    }
    if (req.body.ETHEREUM_CHAIN) {
      config.ETHEREUM_CHAIN = req.body.ETHEREUM_CHAIN;
    }
    if (req.body.INFURA_KEY) {
      config.INFURA_KEY = req.body.INFURA_KEY;
    }
    if (req.body.ETH_GAS_STATION_ENABLE) {
      config.ETH_GAS_STATION_ENABLE = req.body.ETH_GAS_STATION_ENABLE;
    }
    if (req.body.ETH_GAS_STATION_API_KEY) {
      config.ETH_GAS_STATION_API_KEY = req.body.ETH_GAS_STATION_API_KEY;
    }
    if (req.body.ETH_GAS_STATION_GAS_LEVEL) {
      config.ETH_GAS_STATION_GAS_LEVEL = req.body.ETH_GAS_STATION_GAS_LEVEL;
    }
    if (req.body.ETH_GAS_STATION_REFRESH_TIME) {
      config.ETH_GAS_STATION_REFRESH_TIME =
        req.body.ETH_GAS_STATION_REFRESH_TIME;
    }
    if (req.body.ETH_MANUAL_GAS_PRICE) {
      config.ETH_MANUAL_GAS_PRICE = req.body.ETH_MANUAL_GAS_PRICE;
    }
    if (req.body.LOG_TO_STDOUT) {
      config.LOG_TO_STDOUT = req.body.LOG_TO_STDOUT;
    }

    ConfigManager.updateConfig(config);
    ConfigManager.reloadConfig();
    EthereumRoutes.reload();
    res.send('The config has been updated');
  }
);

// handle any error thrown in the gateway api route
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const stack = err.stack || '';
  const message = err.message || 'Something went wrong';
  logger.error(message + stack);
  res.status(500).json({ message: message, stack: stack });
});

export default app;
