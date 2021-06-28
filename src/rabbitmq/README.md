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
7. Added `getSubstrateSpecs` function to `listener.ts`

June 26-28
1. Added _shouldSkip function check and _filterConfig to Producer class in `Producer.ts`
2. Configured producer to skip excluded substrate events
3. Added option to pass json config file for rabbitmq (-q "jsonConfigFile.json")
4. I needed to make the startup args easily usable in the webhook/server to restart the subscriber, so I created an interface
    called listenerOptionsT in `interfaces.ts`. This meant it was also super easily to allow multiple listeners to be started from the same process which makes chain-events have node/server type functionality (closer to the TheGraph/Subscan)
5. Added execution options for the node/webhook with (-e), and a config file for using multiple listeners with (-z filepath) in `listeners.ts`
6. Then "/updateSpec" route unsubscribes, reruns setupListener to recreate api with updated spec + resubscribe, and saves the subscriber

#### Package.json changes:
- added node-fetch as a dependency
- added amqplib and rascal as dependencies
- added @polkadot/api as dependency since npx install peer-dependencies not functioning correctly (at least for testing)
- removed @polkadot/api as dep -> npx install-peers not working on my env -> use npm run install-peers


