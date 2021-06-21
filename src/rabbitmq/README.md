# Getting Started:
### Installation
- Follow instructions at https://www.rabbitmq.com/install-debian.html#apt to install Erlang and RabbitMQ make sure to install for the correct linux distribution!

### RabbitMQ Server Commands
- Start server: `sudo systemctl start rabbitmq-server`
- Check server status: `sudo systemctl status rabbitmq-server`
- Stop server: `sudo systemctl stop rabbitmq-server`

### Create an admin RabbitMQ User:
1. `sudo rabbitmqctl add_user admin password`
2. `sudo rabbitmqctl set_user_tags admin administrator`
3. `sudo rabbitmqctl set_permissions -p / admin ".*" ".*" ".*"`


# Standalone usage
1. `git clone https://github.com/timolegros/chain-events.git`
2. `git checkout tim.rabbitmq`
3. `yarn`
4. `yarn build`
5. `yarn listen -n edgeware -q`

# Change Log:
1. Extended IEventHandler in `interface.ts` interface to create IProducer interface in `Producer.ts`
2. Implemented IProducer as Producer in `Producer.ts` with a handle method that adds the event to the queue
3. Instantiated Producer in `listener.ts` before subscribing to events and pass the producer instance to the handlers array
4. Added -rabbitmq/-q command line arg to allow toggle for using or not using rabbitmq (-q : turns on rabbitmq)
5. Add chain and received optional fields to CWEvents interface
6. Added the chain and current timestamp to the event in each handleEventFn function in subscribeFunc.ts files
#### Package.json changes:
- added node-fetch as a dependency
- added amqplib and rascal as dependencies
- added @polkadot/api as dependency since npx install peer-dependencies not functioning correctly (at least for testing)


