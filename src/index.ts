import app from './app';
import { logger } from './services/logger';
import { addHttps } from './https';
import { ConfigManager } from './services/config-manager';

const port = ConfigManager.config.PORT;
logger.info(`⚡️ Gateway API listening on port ${port}`);
if (ConfigManager.config.UNSAFE_DEV_MODE_WITH_HTTP) {
  logger.info('Running in UNSAFE HTTP! This could expose private keys.');
  app.listen(port);
} else {
  logger.info('The server is secured behind HTTPS.');
  addHttps(app).listen(port);
}
