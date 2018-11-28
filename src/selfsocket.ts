import { Server } from "http";
import {parse, format} from 'json-rpc-protocol';
import { EventEmitter } from 'events';

export class herald  extends EventEmitter {
	private svr;
	private clt;

	constructor() {
		super();
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
		// this.clt.write("hello world!\r\n");
		this.clt.on('data', function(this, data) {
			console.log(data.toString());
		});
		this.clt.on('end', function() {
			console.log('断开与服务器的连接');
		});
	}
	/*
	Request Format:
	00000112{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}}
	00000112{"jsonrpc": "2.0", "id": 1, "method": "launch", "params": {"stopOnEntry": stopOnEntry}}
	00000112{"jsonrpc": "2.0", "id": 1, "method": "clearBreakpoints", "params": {"path": "C:\\foo\\bar.jl"}}
	00000112{"jsonrpc": "2.0", "id": 1, "method": "setBreakPoints", "params": {"path": "C:\\foo\\bar.jl", "lines": [1, 2, 3]}}
	00000112{"jsonrpc": "2.0", "id": 1, "method": "continue", "params": {}}
	00000112{"jsonrpc": "2.0", "id": 1, "method": "next", "params": {}}
	*/
	initialize(program: string, stopOnEntry: boolean) {
		var data = format.request(1, 'initialize', []);
		this.clt.write(data);
	}
	start(program: string, stopOnEntry: boolean) {
		var data = format.request(1, 'launch', [stopOnEntry]);
		this.clt.write(data);
	}
	clearBreakpoints(path: string) {
		var data = format.request(1, 'clearBreakpoints', [path]);
		this.clt.write(data);
	}
	setBreakPoints(path: string, lines: number[]) {
		var data = format.request(1, 'setBreakPoints', [path, lines]);
		this.clt.write(data);
	}
	continue() {
		var data = format.request(1, 'continue', []);
		this.clt.write(data);
	}
	next() {
		var data = format.request(1, 'next', []);
		this.clt.write(data);
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
	jsonformatter(id: number, method: string, params: any){
		var data = format.request(id, method, params);
		var nlen = data.toString().length;
		var len = nlen.toString();
		var dlen = len.length;
		//pad length to 8-bit
		while(dlen < 8) {
			len = "0" + len;
			dlen++;
		}
		return len + data
	}

	private sendEvent(event: string, ... args: any[]) {
		setImmediate(_ => {
			this.emit(event, ...args);
		});
	}

}