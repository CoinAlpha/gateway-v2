import fs from 'fs';
import YAML from 'yaml';

export namespace ConfigManager {
  const configFilePath = './src/gateway-config.yml';
  let config = YAML.parseDocument(fs.readFileSync(configFilePath, 'utf8'));

  // lookup a key from the config file, it may or may not exist
  export function getConfig(key: string): undefined | string {
    return config.get(key);
  }

  // after reloading the config, all services should be restarted
  export function reloadConfig(): void {
    config = YAML.parseDocument(fs.readFileSync(configFilePath, 'utf8'));
  }

  // this allows a client to update the main config file
  export function updateConfig(data: Record<string, string>) {
    Object.keys(data).forEach((key) => {
      config.set(key, data[key]);
    });
    fs.writeFileSync(configFilePath, config.toString());
  }
}
