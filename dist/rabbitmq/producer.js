"use strict";
// import Rascal from 'rascal';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMqProducer = void 0;
class RabbitMqProducer {
    constructor(_rabbitMQConfig) {
        this._rabbitMQConfig = _rabbitMQConfig;
        // sets _vhost as the first vhost in the configuration passed
        this._vhost =
            _rabbitMQConfig.vhosts[Object.keys(_rabbitMQConfig.vhosts)[0]];
        // array of publishers
        this.publishers = Object.keys(this._vhost.publications);
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            // this assumes the vhost is '/' --> change soon
            const cnct = this._vhost.connection;
            console.info(`Rascal connecting to RabbitMQ: ${cnct.protocol}://${cnct.user}:*****@${cnct.hostname}:${cnct.port}/`);
            // this.broker = await Rascal.BrokerAsPromised.create(
            //   Rascal.withDefaultConfig(this._rabbitMQConfig)
            // );
            this.broker.on('error', console.error);
            this.broker.on('vhost_initialized', ({ vhost, connectionUrl }) => {
                console.info(`Vhost: ${vhost} was initialised using connection: ${connectionUrl}`);
            });
            this.broker.on('blocked', (reason, { vhost, connectionUrl }) => {
                console.info(`Vhost: ${vhost} was blocked using connection: ${connectionUrl}. Reason: ${reason}`);
            });
            this.broker.on('unblocked', ({ vhost, connectionUrl }) => {
                console.info(`Vhost: ${vhost} was unblocked using connection: ${connectionUrl}.`);
            });
        });
    }
    publish(data, publisherName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.publishers.includes(publisherName))
                throw new Error('Publisher is not defined');
            try {
                const publication = yield this.broker.publish(publisherName, data);
                publication.on('error', (err, messageId) => {
                    console.error(`Publisher error ${err}, ${messageId}`);
                });
            }
            catch (err) {
                throw new Error(`Rascal config error: ${err.message}`);
            }
        });
    }
}
exports.RabbitMqProducer = RabbitMqProducer;
//# sourceMappingURL=producer.js.map