import {
  LoggerFactoryOptions,
  LFService,
  LogGroupRule,
  LogLevel,
  getLogControl,
  LogGroupControlSettings,
} from 'typescript-logging';

const options = new LoggerFactoryOptions()
  .addLogGroupRule(new LogGroupRule(new RegExp('model.+'), LogLevel.Debug))
  .addLogGroupRule(new LogGroupRule(new RegExp('route.+'), LogLevel.Debug))
  .addLogGroupRule(new LogGroupRule(new RegExp('.+'), LogLevel.Info));

export const formatFilename = (name: string): string => {
  const t = name.split('/');
  return t[t.length - 1];
};

// TODO: getting ChainEvents log factory already exists error when factory name is "ChainEvents"
export const factory = LFService.createNamedLoggerFactory(
  'ChainEvents',
  options
);

const control = getLogControl();

// Factories are numbered, use listFactories() to find out
export const factoryControl = control.getLoggerFactoryControl(0);

// Change the loglevel for all LogGroups for this factory to Debug
// (so all existing/new loggers from this factory will log to Debug)
const logLevel = process.env.NODE_ENV !== 'production' ? 'Debug' : 'Info';
factoryControl.change({ group: 'all', logLevel } as LogGroupControlSettings);
