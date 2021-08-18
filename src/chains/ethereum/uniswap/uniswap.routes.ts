import { Router, Request, Response } from 'express';
import { Uniswap } from './uniswap';
import { ConfigManager } from '../../../services/config-manager';

export namespace UniswapRoutes {
  export const router = Router();
  let uniswap = new Uniswap();

  router.get('/', async (_req: Request, res: Response) => {
    res.status(200).json({
      network: ConfigManager.config.ETHEREUM_CHAIN,
      uniswap_router: uniswap.uniswapRouter,
      connection: true,
      timestamp: Date.now(),
    });
  });
}
