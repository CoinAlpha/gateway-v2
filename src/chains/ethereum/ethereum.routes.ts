import { Router, Request, Response } from 'express';
import { Ethereum } from './ethereum';
import { EthereumConfig } from './ethereum.config';
import { ConfigManager } from '../../services/config-manager';

export namespace EthereumRoutes {
  export const router = Router();
  const ethereum = new Ethereum();

  router.get('/', async (_req: Request, res: Response) => {
    let rpcUrl;
    if (ConfigManager.config.ETHEREUM_CHAIN === 'mainnet') {
      rpcUrl = EthereumConfig.config.mainnet.rpcUrl;
    } else {
      rpcUrl = EthereumConfig.config.kovan.rpcUrl;
    }

    res.status(200).json({
      network: ConfigManager.config.ETHEREUM_CHAIN,
      rpcUrl: rpcUrl,
      connection: true,
      timestamp: Date.now(),
    });
  });
}
