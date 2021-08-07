"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslog_1 = require("tslog");
const log = new tslog_1.Logger({
    minLevel: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
    colorizePrettyLogs: process.env.NODE_ENV !== 'production',
    displayFunctionName: false,
    displayFilePath: 'displayAll',
    overwriteConsole: true,
});
exports.default = log;
//# sourceMappingURL=logging.js.map