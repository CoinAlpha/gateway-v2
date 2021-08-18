import { Router, Request, Response } from 'express';
import { Ethereum } from '../ethereum';
import { Uniswap, ExpectedTrade } from './uniswap';
import { ConfigManager } from '../../../services/config-manager';
import { HttpException, asyncHandler } from '../../../services/error-handler';
import { BigNumber } from 'ethers';
import { latency } from '../../../services/base';

export namespace UniswapRoutes {
  export const router = Router();
  let uniswap = new Uniswap();
  let eth = new Ethereum();

  router.get('/', async (_req: Request, res: Response) => {
    res.status(200).json({
      network: ConfigManager.config.ETHEREUM_CHAIN,
      uniswap_router: uniswap.uniswapRouter,
      connection: true,
      timestamp: Date.now(),
    });
  });

  router.get('/gas-limit', (_req: Request, res: Response) => {
    res.status(200).json({
      network: ConfigManager.config.ETHEREUM_CHAIN,
      gasLimit: ConfigManager.config.UNISWAP_GAS_LIMIT,
      timestamp: Date.now(),
    });
  });

  type Side = 'BUY' | 'SELL';

  interface UniswapTradeRequest {
    quote: string;
    base: string;
    amount: BigNumber;
    side: Side;
  }

  router.post(
    '/price',
    asyncHandler(
      async (req: Request<{}, {}, UniswapTradeRequest>, res: Response) => {
        const initTime = Date.now();
        const amount = req.body.amount;
        const baseToken = eth.getTokenBySymbol(req.body.base);

        if (baseToken) {
          const quoteToken = eth.getTokenBySymbol(req.body.quote);
          if (quoteToken) {
            const result: ExpectedTrade | string =
              req.body.side === 'BUY'
                ? await uniswap.priceSwapOut(
                    quoteToken.address, // tokenIn is quote asset
                    baseToken.address, // tokenOut is base asset
                    amount
                  )
                : await uniswap.priceSwapIn(
                    baseToken.address, // tokenIn is base asset
                    quoteToken.address, // tokenOut is quote asset
                    amount
                  );

            if (typeof result === 'string') {
              throw new HttpException(
                500,
                'Uniswap trade query failed: ' + result
              );
            } else {
              const trade = result.trade;
              const expectedAmount = result.expectedAmount;

              const tradePrice =
                req.body.side === 'BUY'
                  ? trade.executionPrice.invert().toSignificant(8)
                  : trade.executionPrice.toSignificant(8);

              const gasLimit = ConfigManager.config.UNISWAP_GAS_LIMIT;
              const gasPrice = eth.getGasPrice();
              const payload = {
                network: ConfigManager.config.ETHEREUM_CHAIN,
                timestamp: initTime,
                latency: latency(initTime, Date.now()),
                base: baseToken.address,
                quote: quoteToken.address,
                amount: amount,
                expectedAmount: expectedAmount,
                tradePrice: tradePrice,
                gasPrice: gasPrice,
                gasLimit: gasLimit,
                gasCost: gasPrice * gasLimit,
                trade: trade,
              };
              res.status(200).json(payload);
            }
          } else {
            throw new HttpException(
              500,
              'Unrecognized quote token symbol: ' + req.body.quote
            );
          }
        } else {
          throw new HttpException(
            500,
            'Unrecognized base token symbol: ' + req.body.base
          );
        }
      }
    )
  );
}
