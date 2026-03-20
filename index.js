"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var https_1 = require("https");
var app = (0, express_1.default)();
var server = (0, https_1.createServer)(app);
server.listen(3000, function () {
    console.log("tuto bene !");
});
