import { ConfigManager } from '../../../services/config-manager';
import { BigNumber } from 'ethers';
import { EthereumConfig } from '../ethereum.config';
import { Ethereum } from '../ethereum';
import {
  CurrencyAmount,
  Fetcher,
  Percent,
  Router,
  Token,
  TokenAmount,
  Trade,
} from '@uniswap/sdk';

export interface ExpectedTrade {
  trade: Trade;
  expectedAmount: CurrencyAmount;
}

export class Uniswap {
  // private router: Router;
  // private gasLimit: number;
  // private ttl: string;
  private allowedSlippage: Percent;
  private chainId;
  private ethereum = new Ethereum();

  private tokenList: Record<string, Token> = {};

  constructor(
    _router: Router,
    _gasLimit: number,
    _ttl: string,
    allowedSlippage: Percent
  ) {
    // this.router = router;
    // this.gasLimit = gasLimit;
    // this.ttl = ttl;
    this.allowedSlippage = allowedSlippage;
    if (ConfigManager.config.ETHEREUM_CHAIN === 'mainnet') {
      this.chainId = EthereumConfig.config.mainnet.chainId;
    } else {
      this.chainId = EthereumConfig.config.kovan.chainId;
    }

    for (const token of this.ethereum.getStoredTokenList()) {
      this.tokenList[token.address] = new Token(
        this.chainId,
        token.address,
        token.decimals,
        token.symbol,
        token.name
      );
    }
  }

  // get the expected amount of token out, for a given pair and a token amount in.
  // this only considers direct routes.
  async priceSwapIn(
    tokenInAddress: string,
    tokenOutAddress: string,
    tokenInAmount: BigNumber
  ): Promise<ExpectedTrade | string> {
    const tokenIn = this.tokenList[tokenInAddress];
    if (tokenIn) {
      const tokenOut = this.tokenList[tokenOutAddress];
      if (tokenOut) {
        const tokenInAmount_ = new TokenAmount(
          tokenIn,
          tokenInAmount.toString()
        );

        const pair = await Fetcher.fetchPairData(tokenIn, tokenOut);
        const trades = Trade.bestTradeExactIn(
          [pair],
          tokenInAmount_,
          tokenOut,
          {
            maxHops: 1,
          }
        );
        if (trades.length > 0) {
          const expectedAmount = trades[0].minimumAmountOut(
            this.allowedSlippage
          );
          return { trade: trades[0], expectedAmount };
        } else {
          return `priceSwapIn: no trade pair found for ${tokenInAddress} to ${tokenOutAddress}.`;
        }
      } else {
        return `priceSwapIn: tokenOutAddress ${tokenOutAddress} not found in tokenList.`;
      }
    } else {
      return `priceSwapIn: tokenInAddress ${tokenInAddress} not found in tokenList.`;
    }
  }

  async priceSwapOut(
    tokenInAddress: string,
    tokenOutAddress: string,
    tokenOutAmount: BigNumber
  ): Promise<ExpectedTrade | string> {
    const tokenIn = this.tokenList[tokenInAddress];
    if (tokenIn) {
      const tokenOut = this.tokenList[tokenOutAddress];
      if (tokenOut) {
        const tokenOutAmount_ = new TokenAmount(
          tokenOut,
          tokenOutAmount.toString()
        );

        const pair = await Fetcher.fetchPairData(tokenIn, tokenOut);
        const trades = Trade.bestTradeExactOut(
          [pair],
          tokenIn,
          tokenOutAmount_,
          {
            maxHops: 1,
          }
        );
        if (trades.length > 0) {
          const expectedAmount = trades[0].maximumAmountIn(
            this.allowedSlippage
          );
          return { trade: trades[0], expectedAmount };
        } else {
          return `priceSwapOut: no trade pair found for ${tokenInAddress} to ${tokenOutAddress}.`;
        }
      } else {
        return `priceSwapOut: tokenOutAddress ${tokenOutAddress} not found in tokenList.`;
      }
    } else {
      return `priceSwapOut: tokenInAddress ${tokenInAddress} not found in tokenList.`;
    }
  }    
}
