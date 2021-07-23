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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNode = void 0;
const express_1 = __importDefault(require("express"));
const index_1 = require("./index");
const util_1 = require("./util");
const listeners = {};
// TODO: setup the chain supported check as middleware
function createNode() {
    const port = process.env.EVENT_NODE_PORT || 8081;
    const app = express_1.default();
    // request body as JSON (Content-Type = application/json)
    app.use(express_1.default.json());
    /**
     * Used to update the spec for any listener (chain).
     * {
     *   "chain": *the chain name*,
     *   "spec": {}
     * }
     */
    app.post('/updateSpec', (req, res) => __awaiter(this, void 0, void 0, function* () {
        const chain = req.body.chain;
        const spec = req.body.spec;
        if (!chain || !spec) {
            return res
                .status(400)
                .json({ error: `${!chain ? 'chain' : 'spec'} is not defined` });
        }
        if (!index_1.isSupportedChain(chain))
            return res.status(400).json({ error: `${chain} is not supported` });
        if (listeners[chain] == null)
            return res
                .status(400)
                .json({ error: `No subscription to ${chain} found` });
        try {
            yield listeners[chain].updateSpec(spec);
            res.status(200).json({ message: 'Success' });
            return;
        }
        catch (error) {
            res
                .status(400)
                .json({ error: 'An error occurred during listener setup' });
        }
    }));
    // should adding a listener also instantiate a new storageFetcher for supported chains?
    /**
     * Adds a listener to an active chain-events node.
     * {
     *   "chain": *the chain name*,
     *   "options": *listener options as defined in the readme multiple listener configuration*
     * }
     */
    app.post('/addListener', (req, res) => {
        var _a;
        const chain = req.body.chain;
        const options = req.body.options;
        if (!chain || !options) {
            res
                .status(400)
                .json({ error: `${!chain ? 'chain' : 'options'} is not defined` });
            return;
        }
        if (!index_1.isSupportedChain(chain))
            return res.status(400).json({ error: `${chain} is not supported` });
        if ((_a = listeners[chain]) === null || _a === void 0 ? void 0 : _a.subscribed) {
            res
                .status(400)
                .json({ error: `Listener for ${chain} is already active` });
            return;
        }
        util_1.createListener(chain, options)
            .then(() => {
            res.status(200).json({ message: 'Success' });
        })
            .catch((error) => {
            res.status(400).json({ error: error });
        });
    });
    /**
     * Removes a listener from an active chain-events node.
     * {
     *   "chain": *the chain name*
     * }
     */
    app.post('/removeListener', (req, res) => {
        const chain = req.body.chain;
        if (!chain) {
            res.status(400).json({ error: 'Chain is not defined' });
            return;
        }
        if (!index_1.isSupportedChain(chain))
            return res.status(400).json({ error: `${chain} is not supported` });
        if (listeners[chain] == null) {
            res.status(400).json({ error: `No subscription to ${chain} found` });
            return;
        }
        try {
            listeners[chain] = null;
            res.status(200).json({ message: 'Success' });
        }
        catch (error) {
            res.status(400).json({ error: error });
        }
    });
    /**
     * Sets the excluded events for any active chain. ExcludedEvents should be an array of event names
     * to ignore.
     * {
     *   "chain": *the chain name*
     *   "excludedEvents: []
     * }
     */
    app.post('/setGlobalExcludedEvents', (req, res) => {
        const chain = req.body.chain;
        const excludedEvents = req.body.excludedEvents;
        if (!chain || !excludedEvents) {
            res
                .status(400)
                .json({ error: 'ERROR - Chain or excluded events is not defined' });
            return;
        }
        if (!index_1.isSupportedChain(chain))
            return res.status(400).json({ error: `${chain} is not supported` });
        if (listeners[chain] == null) {
            res
                .status(400)
                .json({ error: `ERROR - There is no active listener for ${chain}` });
            return;
        }
        try {
            listeners[chain].globalExcludedEvents = excludedEvents;
            res.status(200).json({ message: 'Success' });
        }
        catch (error) {
            res.status(400).json(error);
        }
    });
    // addressArr may be large so get request is not suitable
    // app.post('/getIdentity', async (req, res) => {
    //   const chain: string = req.body.chain;
    //   const addressArr: string[] = req.body.addresses;
    //
    //   if (!chain || !addressArr) {
    //     res.status(400).json({
    //       error: `The ${!chain ? 'chain' : 'address array'} is not defined`,
    //     });
    //     return;
    //   }
    //
    //   if (listeners[chain]?.subscribed == null) {
    //     res
    //       .status(400)
    //       .json({ error: `ERROR - There is no active listener for ${chain}` });
    //     return;
    //   }
    //
    //   // This may change if supporting other chain identities
    //   if (!chainSupportedBy(chain, SubstrateEventChains)) {
    //     return res
    //       .status(400)
    //       .json({ message: `${chain} is not a Substrate chain` });
    //   }
    //
    //   try {
    //     if (!listeners[chain].storageFetcher)
    //       listeners[chain].storageFetcher = new StorageFetcher(
    //         listeners[chain].subscriber.api
    //       );
    //
    //     return res.status(200).json({
    //       identityEvents: await listeners[chain].storageFetcher.fetchIdentities(
    //         addressArr
    //       ),
    //     });
    //   } catch (error) {
    //     res.status(400).json({ error: error });
    //   }
    // });
    app.listen(port, () => {
        console.log(`Events node started at http://localhost:${port}`);
    });
    return app;
}
exports.createNode = createNode;
