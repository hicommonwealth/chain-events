"use strict";
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
exports.RabbitMqHandler = void 0;
const producer_1 = require("../rabbitmq/producer");
class RabbitMqHandler extends producer_1.RabbitMqProducer {
    constructor(_rabbitMQConfig) {
        super(_rabbitMQConfig);
    }
    // handler method used by the chain-event listeners/subscribers
    handle(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const publication = yield this.broker.publish(event, this.publishers[0]);
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
exports.RabbitMqHandler = RabbitMqHandler;
//# sourceMappingURL=rabbitmqHandler.js.map