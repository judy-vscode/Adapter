import { Server } from "http";
import {parse, format} from 'json-rpc-protocol';
import { EventEmitter } from 'events';
import { SSL_OP_EPHEMERAL_RSA } from "constants";
import * as net from 'net'
import { PassThrough } from "stream";

export class herald  extends EventEmitter {
	private rl;
	private svr;
	private clt;
	private dataBuffer: string;
	private packLength = 0;

	constructor() {
		super();
		this.dataBuffer = "";
		var self = this;
		this.svr = net.createServer(function(connection) {
			console.log('client connected');
			connection.on('data', (data) => {
				console.log(data);
				self.svrdataProcess(data);
			})
			connection.on('end', function() {
				console.log('客户端关闭连接');
			});
			// var svrdata = self.jsonformatter(1, 'HELLO\r\n', [{"lines":[0]}])
			// connection.write(svrdata);
			// connection.pipe(connection);
		});
		this.svr.listen(18001, function() {
			console.log('server is listening');
		});

		this.clt = net.connect({port: 8000}, function() {
			console.log('连接到服务器！');
		 });
		//  var cltdata = this.jsonformatter(1, 'hello\r\n', [{"lines":[0]}])
		//  this.clt.write(cltdata);
		this.clt.on('data', (data) => {
			this. cltdataProcess(data);
		})
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
	initialize() {
		console.log("send initialize request");
		var data = this.jsonformatter(1, 'initialize', {});
		console.log("writing to debugger...");
		console.log(data.toString());
		this.clt.write(data);
	}
	start(program: string, stopOnEntry: boolean) {
		var data = this.jsonformatter(1, 'launch', {});
		console.log("writing to debugger...");
		console.log(data.toString());
		this.clt.write(data);
	}
	clearBreakpoints(path: string) {
		var data = this.jsonformatter(1, 'clearBreakpoints', {path});
		console.log("writing to debugger...");
		console.log(data.toString());
		this.clt.write(data);
	}
	setBreakPoints(path: string, lines: number[]) {
		var data = this.jsonformatter(1, 'setBreakPoints', {path, lines});
		console.log("writing to debugger...");
		console.log(data.toString());
		this.clt.write(data);
	}
	continue() {
		var data = this.jsonformatter(1, 'continue', {});
		console.log("writing to debugger...");
		console.log(data.toString());
		this.clt.write(data);
	}
	next() {
		var data = this.jsonformatter(1, 'next', {});
		console.log("writing to debugger...");
		console.log(data.toString());
		this.clt.write(data);
	}
	stack(startFrame, endFrame) {
		var data = this.jsonformatter(1, 'stackTrace', {});
		console.log("writing to debugger...");
		console.log(data.toString());
		this.clt.write(data);
	}
	scopes(frameId) {
		var data = this.jsonformatter(1, 'scopes', {frameId});
		console.log("writing to debugger...");
		console.log(data.toString());
		this.clt.write(data);
	}
	variables(variablesReference) {
		var data = this.jsonformatter(1, 'variables', {variablesReference});
		console.log("writing to debugger...");
		console.log(data.toString());
		this.clt.write(data);
	}

	cltdataProcess(data) {
		console.log('recieve data from server');
		console.log(data.toString());
		console.log(this.clt.bytesRead);
	}
	svrdataProcess(data) {
		console.log('recieve data from client');
		console.log(data.toString());
		//console.log(this.clt.bytesRead);
		var dataString = data.toString();

		this.dataBuffer += dataString;
		while(this.dataBuffer.length != 0) {
			if(this.packLength == 0) {
				this.packLength = parseInt(this.dataBuffer.slice(0,8), 10) + 8;
				// this.dataBuffer = this.dataBuffer;
			}
			var bufferSize = this.dataBuffer.length;
			if(this.packLength <= bufferSize) {
				this.jsonparse(this.dataBuffer.slice(0, this.packLength));
				this.dataBuffer = this.dataBuffer.slice(this.packLength);
				this.packLength = 0;
			}
			else {
				break;
			}
		}
	}
	jsonparse(data: string) {
		var jsondata = data.slice(8);//length global var
		if(jsondata.search('method')!=-1) {	//event notifications
			var receive_data = parse(jsondata);
			var event = receive_data['method']
			var result_data = receive_data['params'];
			this.sendEvent(event, result_data);
		}
		else if(jsondata.search('result')!=-1) {
			var receive_data = parse(jsondata);
			var data = receive_data['result'];
			var response = 'response';
			this.sendEvent(response, data);
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
		//pad length to 8-digit
		while(dlen < 8) {
			len = "0" + len;
			dlen++;
		}
		return len + data;
	}

	private sendEvent(event: string, ... args: any[]) {
		setImmediate(_ => {
			this.emit(event, ...args);
		});
	}

}