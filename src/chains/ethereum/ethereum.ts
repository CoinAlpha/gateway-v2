import { EthereumBase } from '../../services/ethereum-base';
import { ConfigManager } from '../../services/config-manager';
import { EthereumConfig } from './ethereum.config';

// chainId
// rpcUrl
// tokenListType
// tokenListSource

export class Ethereum extends EthereumBase {
  constructor() {
    let config;
    if (ConfigManager.config.ETHEREUM_CHAIN === 'mainnet') {
      config = EthereumConfig.config.mainnet;
    } else {
      config = EthereumConfig.config.kovan;
    }
    super(
      config.chainId,
      config.rpcUrl,
      config.tokenListSource,
      config.tokenListType,
      0
    );
  }
}
