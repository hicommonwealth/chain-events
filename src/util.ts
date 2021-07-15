import fs from 'fs';
import config from './rabbitmq/RabbitMQconfig.json';

// TODO: generalize this for any config file at any path
// returns either the RabbitMQ config specified by the filepath or the default config
export function getRabbitMQConfig(filepath?: string) {
  if (typeof filepath == 'string' && filepath.length == 0) return config;
  else if (filepath == undefined) return config;
  else {
    try {
      let raw = fs.readFileSync(filepath);
      return JSON.parse(raw.toString());
    } catch (error) {
      console.error(`Failed to load the configuration file at: ${filepath}`);
      console.warn('Using default RabbitMQ configuration');
      return config;
    }
  }
}
