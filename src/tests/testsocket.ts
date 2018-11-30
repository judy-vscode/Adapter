import { Server } from "http";
import {parse, format} from 'json-rpc-protocol';
import { EventEmitter } from 'events';
import { SSL_OP_EPHEMERAL_RSA } from "constants";
import * as net from 'net'
import { PassThrough } from "stream";

export class herald{
	private rl;
	private svr;
	private clt;
	private dataBuffer: string;
	private packLength = 0;

	constructor() {
		var self = this;
		this.svr = net.createServer(function(connection) {
			console.log('client connected');

			connection.on('data', (data) => {
				self.svrdataProcess(data);
			})
			connection.on('end', function() {
				console.log('客户端关闭连接');
			});
			//connection.write('Hello World!\r\n');
			var svrdata = self.jsonformatter(1, 'HELLO\r\n', [{"lines":[0]}])
			connection.write(svrdata);
			connection.pipe(connection);
		});
		this.svr.listen(18001, function() {
			console.log('server is listening');
		});

		this.clt = net.connect({port: 8000}, function() {
			console.log('连接到服务器！');
		 });
		var cltdata = this.jsonformatter(1, 'hello\r\n', [{"lines":[0]}])
		this.clt.write(cltdata);

		//TODO....
		this.clt.on('data', (data) => {
			this. cltdataProcess(data);
		})

		this.clt.on('end', function() {
			console.log('断开与服务器的连接');
		});
		var readline = require('readline');
		this.rl = readline.createInterface({
			input:process.stdin,
			output:process.stdout
		});
		console.log("input:");
		this.rl.prompt();
		this.rl.on('line', (line) => {
			this.sendLine(line);
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
		//var data = format.request(1, 'launch', [stopOnEntry]);
		var data = this.jsonformatter(1, 'launch', [stopOnEntry]);
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

	sendLine(line) {
		console.log(line);
		this.clt.write(line);
		// console.log("input:");
		this.rl.prompt();
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
		if(this.packLength == 0) {
			this.packLength = parseInt(this.dataBuffer.slice(0,8), 10);
			this.dataBuffer = this.dataBuffer.slice(8);
		}
		var bufferSize = this.dataBuffer.length;
		if(this.packLength <= bufferSize) {
			this.jsonparse(this.dataBuffer.slice(0, this.packLength));
			this.dataBuffer.slice(this.packLength);
			this.packLength = 0;
		}
	}
	jsonparse(data: string) {
		var jsondata = data.slice(8)//length global var
		if(jsondata.search('method')!=-1) {	//event notifications
			var receive_data = parse(jsondata);
			var event = receive_data['method']
			this.sendEvent(event);
		}
		else if(jsondata.search('result')!=-1) {
			var receive_data = parse(jsondata);
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
		//pad length to 8-digit
		while(dlen < 8) {
			len = "0" + len;
			dlen++;
		}
		return len + data;
	}

	private sendEvent(event: string, ... args: any[]) {
		// this.svr.write(event);
	}

}

var testherald = new herald();
