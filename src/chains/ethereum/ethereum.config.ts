type TokenListType = 'FILE' | 'URL';

export interface Config {
  chainId: number;
  rpcUrl: string;
  tokenListType: TokenListType;
  tokenList: string;
}

export interface EthereumConfig {
  mainnet: Config;
  kovan: Config;
}

export const ethereumConfig: EthereumConfig = {
  mainnet: {
    chainId: 1,
    rpcUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
    tokenListType: 'URL',
    tokenList:
      'https://wispy-bird-88a7.uniswap.workers.dev/?url=http://tokens.1inch.eth.link',
  },
  kovan: {
    chainId: 42,
    rpcUrl: `https://kovan.infura.io/v3/${process.env.INFURA_KEY}`,
    tokenListType: 'URL',
    tokenList: '',
  },
};
