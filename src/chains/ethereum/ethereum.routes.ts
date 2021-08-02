import { Wallet } from 'ethers';
import { NextFunction, Router, Request, Response } from 'express';
import { Ethereum } from './ethereum';
import { EthereumConfig } from './ethereum.config';
import { ConfigManager } from '../../services/config-manager';
import { Token } from '../../services/ethereum-base';
import { HttpException } from '../../services/error-handler';
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
      res: Response<EthereumBalanceResponse | string, {}>,
      _next: NextFunction
    ) => {
      const initTime = Date.now();

      let wallet: Wallet;
      try {
        wallet = ethereum.getWallet(req.body.privateKey);
      } catch (err) {
        throw new HttpException(500, 'Error getting wallet ' + err);
      }

      const tokenContractList: Record<string, Token> = {};

        for (var i = 0; i < req.body.tokenSymbols.length; i++) {
            const symbol =  req.body.tokenSymbols[i];
        const token = ethereum.getTokenBySymbol(symbol);
        if (!token) {
          continue;
        }

        tokenContractList[symbol] = token;
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

  interface EthereumApproveRequest {
    amount?: string;
    privateKey: string;
    spender: string;
    token: string;
  }

  interface EthereumApproveResponse {
    network: string;
    timestamp: number;
    latency: number;
    tokenAddress: string;
    spender: string;
    amount: string;
    approval: boolean | string;
  }

  router.post(
    '/approve',
    async (
      req: Request<{}, {}, EthereumApproveRequest>,
      res: Response<EthereumApproveResponse | string, {}>
    ) => {
      const initTime = Date.now();
      const spender: string = req.body.spender;

      if (!ethereum.approvedSpenders.some((s) => s === spender)) {
        throw new HttpException(500, 'Unapproved ERC20 spender ' + spender);
      }

      let wallet: Wallet;
      try {
        wallet = ethereum.getWallet(req.body.privateKey);
      } catch (err) {
        throw new HttpException(500, 'Error getting wallet ' + err);
      }

      const token = ethereum.getTokenBySymbol(req.body.token);

      if (!token) {
        throw new HttpException(
          500,
          `Token "${req.body.token}" is not supported`
        );
      }

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
  );

  interface EthereumPollRequest {
    txHash: string;
  }

  interface EthereumPollResponse {
    network: string;
    timestamp: number;
    latency: number;
    txHash: string;
    confirmed: boolean;
    receipt: ethers.providers.TransactionReceipt | null;
  }

  router.post(
    '/poll',
    async (
      req: Request<{}, {}, EthereumPollRequest>,
      res: Response<EthereumPollResponse, {}>
    ) => {
      const initTime = Date.now();
      const receipt = await ethereum.getTransactionReceipt(req.body.txHash);
      const confirmed = receipt && receipt.blockNumber ? true : false;

      res.status(200).json({
        network: ConfigManager.config.ETHEREUM_CHAIN,
        timestamp: initTime,
        latency: latency(initTime, Date.now()),
        txHash: req.body.txHash,
        confirmed,
        receipt: receipt,
      });
    }
  );
}
