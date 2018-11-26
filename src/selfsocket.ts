import { Server } from "http";
import {parse, format} from 'json-rpc-protocol';
import { EventEmitter } from 'events';

export class herald  extends EventEmitter {
	private svr;
	private clt;

	constructor() {
		super();

		var net = require('net');

		this.svr = net.createServer(function(connection) {
			console.log('client connected');
			connection.on('data', function(this, data) {
				this.jsonparse(data);
			})
			connection.on('end', function() {
				console.log('客户端关闭连接');
			});
			connection.write('Hello World!\r\n');
			connection.pipe(connection);
		});
		this.svr.listen(8001, function() {
			console.log('server is listening');
		});

		this.clt = net.connect({port: 8000}, function() {
			console.log('连接到服务器！');
		 });
		this.clt.on('data', function(this, data) {
			console.log(data.toString());
			this.clt.end();
		});
		this.clt.on('end', function() {
			console.log('断开与服务器的连接');
		});
	}

	start(program: string, stopOnEntry: boolean) {
		var data = format.request(1, 'launch', [stopOnEntry]);
		this.clt.write(data);
	}

	jsonparse(data: string) {
		if(data.includes('method')) {	//event notifications
			var receive_data = parse(data);
			var event = receive_data['method']
			this.sendEvent(event)
		}
		else if(data.includes('result')) {
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
		setImmediate(_ => {
			this.emit(event, ...args);
		});
	}

}