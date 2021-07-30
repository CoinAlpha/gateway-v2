import { Wallet } from 'ethers';
import { Router, Request, Response } from 'express';
import { Ethereum } from './ethereum';
import { EthereumConfig } from './ethereum.config';
import { ConfigManager } from '../../services/config-manager';
import { Token } from '../../services/ethereum-base';
import {
  TokenValue,
  latency,
  bigNumberWithDecimalToStr,
} from '../../services/base';
import ethers from 'ethers';

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

  interface EthereumBalanceRequest {
    privateKey: string; // the users private Ethereum key
    tokenSymbols: string[]; // a list of token symbol
  }

  interface EthereumBalanceResponse {
    network: string;
    timestamp: number;
    latency: number;
    balances: Record<string, TokenValue>;
  }

  router.post(
    '/balances',
    async (
      req: Request<{}, {}, EthereumBalanceRequest>,
      res: Response<EthereumBalanceResponse | string, {}>
    ) => {
      const initTime = Date.now();

      const wallet: Wallet = ethereum.getWallet(req.body.privateKey);

      const tokenContractList: Record<string, Token> = {};

      for (const symbol of req.body.tokenSymbols) {
        const tokenContractInfo = ethereum.getTokenBySymbol(symbol);
        if (!tokenContractInfo) {
          continue;
        }

        tokenContractList[symbol] = tokenContractInfo;
      }

      const balances: Record<string, TokenValue> = {};
      balances.ETH = await ethereum.getEthBalance(wallet);
      await Promise.all(
        Object.keys(tokenContractList).map(async (symbol) => {
          if (tokenContractList[symbol] !== undefined) {
            const address = tokenContractList[symbol].address;
            const decimals = tokenContractList[symbol].decimals;
            balances[symbol] = await ethereum.getERC20Balance(
              wallet,
              address,
              decimals
            );
          }
        })
      );

      res.status(200).json({
        network: ConfigManager.config.ETHEREUM_CHAIN,
        timestamp: initTime,
        latency: latency(initTime, Date.now()),
        balances: balances,
      });
    }
  );

  router.post('/approve', async (req: Request, res: Response) => {
    const initTime = Date.now();
    const spender: string = req.body.connector;
    if (ethereum.approvedSpenders.some((s) => s === spender)) {
      // Getting Wallet
      try {
        const wallet = ethereum.getWallet(req.body.privateKey);

        // Getting token info
        const token = ethereum.getTokenBySymbol(req.body.token);

        if (!token) {
          res.status(500).send(`Token "${req.body.token}" is not supported`);
        } else {
          let amount = ethers.constants.MaxUint256;
          if (req.body.amount) {
            amount = ethers.utils.parseUnits(req.body.amount, token.decimals);
          }
          // call approve function
          let approval;
          try {
            approval = await ethereum.approveERC20(
              wallet,
              spender,
              token.address,
              amount
            );
          } catch (err) {
            approval = err;
          }

          res.status(200).json({
            network: ConfigManager.config.ETHEREUM_CHAIN,
            timestamp: initTime,
            latency: latency(initTime, Date.now()),
            tokenAddress: token.address,
            spender: spender,
            amount: bigNumberWithDecimalToStr(amount, token.decimals),
            approval: approval,
          });
        }
      } catch (err) {
        res.status(500).send('Error getting wallet');
      }
    } else {
      res.status(500).send('Error getting wallet');
    }
  });
}
