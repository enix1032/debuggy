/**
 * @file This example demonstrates how to use the `%log` token to selectively save logs to a file.
 * @description Only log calls that contain the `%log` token in their label or mode will be saved
 * to the log file.
 */

import debuggy from '@en32/debuggy';
import { Logger, LogLevel } from '@en32/logger';
//import { Logger, LogLevel } from './../../logger/dist/index.js';

// Adjust based on your environment: DEVELOPMENT, PRODUCTION, TESTING, or ALL (always active).
const isAllowed = true;

/** * 1. Create a Logger instance from @en32/logger. 
 * @type {Logger}
 */
const logger = new Logger('./examples/ts/logs/example.log', LogLevel.DEBUG, isAllowed, 5000);

/**
 * 2. Configure debuggy to use the logger.
 */
debuggy.options({
  logger: {
    write: true,
    saveMethod: ({ args, path, line, column, level }) => {
      const message: string = args?.[0] || '';
      const location = { path, line, column };

      if (typeof level === 'string' && logger[level as keyof typeof logger]) {
        logger.create(level as LogLevel, message, location);
      } else {
        logger.info(message, location);
      }

      // You can also use other logging libraries here, including those that store log data in a database like SQLite.
    },
  },
});

/**
 * A custom method to create a 'warn' log that will automatically save to a file.
 * The `%log` token is included in the predefined label.
 */
const log = debuggy
  .create('warn', '<y>WARN:<s> {label} %log')
  .create('error', '<r>ERROR:<s> {label} %log')
  .create('info', '<b>INFO:<s> {label} %log')
  .create('debug', '<w>DEBUG:<s> {label} %log');

// --- Log calls with and without the `%log` token ---

// This log will be displayed in the console AND saved to the log file.
// The `%log` token in the label will be removed in the console output.
log.warn('Login Failed')('The user entered an invalid password.');

// This log will be displayed in the console AND saved to the log file.
// The `%log` token is passed as the mode.
log.error('Database Error')((new Error('Failed to connect to the database.')).toString());

// This log will be displayed in the console but will NOT be saved to the file,
// because it does not contain the `%log` token.
debuggy('UI Update')('The UI has been successfully refreshed.');
log.debug('UI Update')('The UI has been successfully refreshed.');

// A regular log without any token. It will not be saved to the file.
debuggy('General Info')('Application started successfully.');
log.info('General Info')('Application started successfully.');
