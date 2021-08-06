import app from './app';
import { logger } from './services/logger';

logger.info('Starting the server at port 5000.');
app.listen(5000);
