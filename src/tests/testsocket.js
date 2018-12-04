"use strict";
exports.__esModule = true;
var json_rpc_protocol_1 = require("json-rpc-protocol");
var net = require("net");
var herald = /** @class */ (function () {
    function herald() {
        var _this = this;
        this.packLength = 0;
        //var net = require('net');
        var self = this;
        this.svr = net.createServer(function (connection) {
            console.log('client connected');
            connection.on('data', function (data) {
                self.svrdataProcess(data);
            });
            // connection.on('data', function(data) {
            // 	console.log('recieve data from client');
            // 	console.log(data.toString());
            // 	self.jsonparse(data.toString());
            // })
            connection.on('end', function () {
                console.log('客户端关闭连接');
            });
            //connection.write('Hello World!\r\n');
            var svrdata = self.jsonformatter(1, 'HELLO\r\n', [{ "lines": [0] }]);
            connection.write(svrdata);
            connection.pipe(connection);
        });
        this.svr.listen(8000, function () {
            console.log('server is listening');
        });
        this.clt = net.connect({ port: 8000 }, function () {
            console.log('连接到服务器！');
        });
        var cltdata = this.jsonformatter(1, 'hello\r\n', [{ "lines": [0] }]);
        this.clt.write(cltdata);
        //TODO....
        this.clt.on('data', function (data) {
            _this.cltdataProcess(data);
        });
        this.clt.on('end', function () {
            console.log('断开与服务器的连接');
        });
        var readline = require('readline');
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        console.log("input:");
        this.rl.prompt();
        this.rl.on('line', function (line) {
            _this.sendLine(line);
        });
    }
    /*
    Request Format:
    00000112{"jsonrpc": "2.0", "id": 1, "method": "launch", "params": {"stopOnEntry": stopOnEntry}}
    00000112{"jsonrpc": "2.0", "id": 1, "method": "setBreakPoints", "params": {"path": "C:\\foo\\bar.jl", "lines": [1, 2, 3]}}
    00000112{"jsonrpc": "2.0", "id": 1, "method": "continue", "params": {}}
    00000112{"jsonrpc": "2.0", "id": 1, "method": "next", "params": {}}
    */
    herald.prototype.start = function (program, stopOnEntry) {
        //var data = format.request(1, 'launch', [stopOnEntry]);
        var data = this.jsonformatter(1, 'launch', [stopOnEntry]);
        this.clt.write(data);
    };
    herald.prototype.clearBreakpoints = function (path) {
    };
    herald.prototype.setBreakPoint = function (path, line) {
    };
    herald.prototype["continue"] = function () {
    };
    herald.prototype.step = function () {
    };
    herald.prototype.sendLine = function (line) {
        console.log(line);
        this.clt.write(line);
        // console.log("input:");
        this.rl.prompt();
    };
    herald.prototype.cltdataProcess = function (data) {
        console.log('recieve data from server');
        console.log(data.toString());
        console.log(this.clt.bytesRead);
    };
    herald.prototype.svrdataProcess = function (data) {
        console.log('recieve data from client');
        console.log(data.toString());
        //console.log(this.clt.bytesRead);
        var dataString = data.toString();
        this.dataBuffer += dataString;
        if (this.packLength == 0) {
            this.packLength = parseInt(this.dataBuffer.slice(0, 8), 10);
            this.dataBuffer = this.dataBuffer.slice(8);
        }
        var bufferSize = this.dataBuffer.length;
        if (this.packLength <= bufferSize) {
            this.jsonparse(this.dataBuffer.slice(0, this.packLength));
            this.dataBuffer.slice(this.packLength);
            this.packLength = 0;
        }
    };
    herald.prototype.jsonparse = function (data) {
        var jsondata = data.slice(8); //length global var
        if (jsondata.search('method') != -1) { //event notifications
            var receive_data = json_rpc_protocol_1.parse(jsondata);
            var event = receive_data['method'];
            this.sendEvent(event);
        }
        else if (jsondata.search('result') != -1) {
            var receive_data = json_rpc_protocol_1.parse(jsondata);
            var result_data = receive_data['result'];
            var response = 'response';
            this.sendEvent(response, result_data);
        }
        else {
            //throw error
        }
    };
    herald.prototype.jsonformatter = function (id, method, params) {
        var data = json_rpc_protocol_1.format.request(id, method, params);
        var nlen = data.toString().length;
        var len = nlen.toString();
        var dlen = len.length;
        //pad length to 8-digit
        while (dlen < 8) {
            len = "0" + len;
            dlen++;
        }
        return len + data;
    };
    herald.prototype.sendEvent = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        // this.svr.write(event);
    };
    return herald;
}());
exports.herald = herald;
var testherald = new herald();
