"use strict";
exports.__esModule = true;
var json_rpc_protocol_1 = require("json-rpc-protocol");
var herald = /** @class */ (function () {
    function herald() {
        var net = require('net');
        var self = this;
        this.svr = net.createServer(function (connection) {
            console.log('client connected');
            connection.on('data', function (data) {
                console.log('recieve data from client');
                console.log(data.toString());
                self.jsonparse(data.toString());
            });
            connection.on('end', function () {
                console.log('客户端关闭连接');
            });
            //connection.write('Hello World!\r\n');
            var data = self.jsonformatter(1, 'HELLO\r\n', [{ "lines": [0] }]);
            console.log('writing... ');
            console.log(data.toString());
            connection.write(data);
            connection.pipe(connection);
        });
        this.svr.listen(8000, function () {
            console.log('server is listening');
        });
        this.clt = net.connect({ port: 8000 }, function () {
            console.log('连接到服务器！');
        });
        //this.clt.write("hello world!\r\n");
        var data = this.jsonformatter(1, 'hello\r\n', [{ "lines": [0] }]);
        //console.log(data.toString());
        this.clt.write(data);
        //this.clt.write(00000070{"id":1,"jsonrpc":"2.0","method":"test\r\n","params":[{"lines":[0]}]});
        console.log(data);
        this.clt.on('data', function (data) {
            console.log('recieve data from server');
            console.log(data.toString());
        });
        this.clt.on('end', function () {
            console.log('断开与服务器的连接');
        });
        var readline = require('readline');
        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        console.log("input:");
        rl.prompt();
        rl.on('line', function (line) {
            console.log(line);
            self.clt.write(line);
            console.log("input:");
            rl.prompt();
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
    herald.prototype.jsonparse = function (data) {
        var jsondata = data.slice(8);
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
        //pad length to 8-bit
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
        this.clt.write(event);
    };
    return herald;
}());
exports.herald = herald;
var testherald = new herald();
