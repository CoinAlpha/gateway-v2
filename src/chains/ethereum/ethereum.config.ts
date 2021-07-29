export namespace EthereumConfig {
  export interface NetworkConfig {
    chainId: number;
    rpcUrl: string;
    tokenListSource: string;
  }

  export interface Config {
    mainnet: NetworkConfig;
    kovan: NetworkConfig;
  }

  export const config: Config = {
    mainnet: {
      chainId: 1,
      rpcUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      tokenListSource:
        'https://wispy-bird-88a7.uniswap.workers.dev/?url=http://tokens.1inch.eth.link',
    },
    kovan: {
      chainId: 42,
      rpcUrl: `https://kovan.infura.io/v3/${process.env.INFURA_KEY}`,
      tokenListSource: '',
    },
  };
}
