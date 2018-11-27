import { Server } from "http";
import {parse, format} from 'json-rpc-protocol';
import { EventEmitter } from 'events';
import { SSL_OP_EPHEMERAL_RSA } from "constants";

export class herald{
	private svr;
	private clt;

	constructor() {
		var net = require('net');
		var self = this;
		this.svr = net.createServer(function(connection) {
			console.log('client connected');
			connection.on('data', function(data) {
				// console.log(data.toString());
				self.jsonparse(data.toString());
			})
			connection.on('end', function() {
				console.log('客户端关闭连接');
			});
			connection.write('Hello World!\r\n');
			connection.pipe(connection);
		});
		this.svr.listen(18001, function() {
			console.log('server is listening');
		});

		this.clt = net.connect({port: 18001}, function() {
			console.log('连接到服务器！');
		 });
		this.clt.write("hello world!\r\n");
		this.clt.on('data', function(this, data) {
			console.log(data.toString());
		});
		this.clt.on('end', function() {
			console.log('断开与服务器的连接');
		});
	}
	/*
	Request Format:
	00000112{"jsonrpc": "2.0", "id": 1, "method": "launch", "params": {"stopOnEntry": stopOnEntry}}
	00000112{"jsonrpc": "2.0", "id": 1, "method": "setBreakPoints", "params": {"path": "C:\\foo\\bar.jl", "lines": [1, 2, 3]}}
	00000112{"jsonrpc": "2.0", "id": 1, "method": "continue", "params": {}}
	00000112{"jsonrpc": "2.0", "id": 1, "method": "next", "params": {}}
	*/
	start(program: string, stopOnEntry: boolean) {
		var data = format.request(1, 'launch', [stopOnEntry]);
		this.clt.write(data);
	}
	clearBreakpoints(path: string) {

	}
	setBreakPoint(path: string, line: number) {

	}
	continue() {

	}
	step() {

	}

	jsonparse(data: string) {
		if(data.search('method')!=-1) {	//event notifications
			var receive_data = parse(data);
			var event = receive_data['method']
			this.sendEvent(event)
		}
		else if(data.search('result')!=-1) {
			var receive_data = parse(data);
			var result_data = receive_data['result'];
			var response = 'response';
			this.sendEvent(response, result_data);
		}
		else {
			//throw error
		}
	}

	private sendEvent(event: string, ... args: any[]) {
		this.clt.write(event);
	}

}

var testherald = new herald();
