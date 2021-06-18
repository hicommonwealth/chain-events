# Getting Started:
### Installation
Follow instructions at https://www.rabbitmq.com/install-debian.html#apt to install Erlang and RabbitMQ -- make sure to install for the correct linux distribution!
Clone https://github.com/timolegros/chain-events.git
Clone https://github.com/timolegros/commonwealth.git

### RabbitMQ Server Commands
- Start server: `sudo systemctl start rabbitmq-server`
- Check server status: `sudo systemctl status rabbitmq-server`
- Stop server: `sudo systemctl stop rabbitmq-server`

### Create an admin RabbitMQ User:
1. `sudo rabbitmqctl add_user admin password`
2. `sudo rabbitmqctl set_user_tags admin administrator`
3. `sudo rabbitmqctl set_permissions -p / admin ".*" ".*" ".*"`

### Development
1. Use npm i rascal in both chain-events and commonwealth

# Change Log:
1. Extended IEventHandler in `interface.ts` interface to create IProducer interface in `Producer.ts`
2. Implemented IProducer as Producer in `Producer.ts` with a handle method that adds the event to the queue