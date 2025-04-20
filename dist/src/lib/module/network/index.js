"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.networkStats = exports.networkInterfaces = exports.networkInterfaceDefault = exports.networkGatewayDefault = exports.networkConnections = void 0;
// Network module index
var network_connections_1 = require("./network-connections");
Object.defineProperty(exports, "networkConnections", { enumerable: true, get: function () { return network_connections_1.networkConnections; } });
var network_gateway_default_1 = require("./network-gateway-default");
Object.defineProperty(exports, "networkGatewayDefault", { enumerable: true, get: function () { return network_gateway_default_1.networkGatewayDefault; } });
var network_interface_default_1 = require("./network-interface-default");
Object.defineProperty(exports, "networkInterfaceDefault", { enumerable: true, get: function () { return network_interface_default_1.networkInterfaceDefault; } });
var network_interfaces_1 = require("./network-interfaces");
Object.defineProperty(exports, "networkInterfaces", { enumerable: true, get: function () { return network_interfaces_1.networkInterfaces; } });
var network_stats_1 = require("./network-stats");
Object.defineProperty(exports, "networkStats", { enumerable: true, get: function () { return network_stats_1.networkStats; } });
