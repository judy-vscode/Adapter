/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import {
	Logger, logger,
	LoggingDebugSession,
	InitializedEvent, TerminatedEvent, StoppedEvent, BreakpointEvent, OutputEvent,
	Thread, StackFrame, Scope, Source, Handles, Breakpoint
} from 'vscode-debugadapter';
import { DebugProtocol } from 'vscode-debugprotocol';
import { basename } from 'path';
// import { MockRuntime, MockBreakpoint } from './mockRuntime';
import { herald } from './selfsocket';
const { Subject } = require('await-notify');
import {parse, format} from 'json-rpc-protocol';
import { response } from 'json-rpc-protocol/dist/format';


/**
 * This interface describes the mock-debug specific launch attributes
 * (which are not part of the Debug Adapter Protocol).
 * The schema for these attributes lives in the package.json of the mock-debug extension.
 * The interface should always match this schema.
 */
interface LaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
	/** An absolute path to the "program" to debug. */
	program: string;
	/** Automatically stop target after launch. If not specified, target does not stop. */
	stopOnEntry?: boolean;
	/** enable logging the Debug Adapter Protocol */
	trace?: boolean;
}

export class MockDebugSession extends LoggingDebugSession {

	// we don't support multiple threads, so we can use a hardcoded ID for the default thread
	private static THREAD_ID = 1;

	// a Mock runtime (or debugger)
	private _herald: herald;

	private _variableHandles = new Handles<string>();

	private _configurationDone = new Subject();

	private _responseState = new Array();

	private _responseInterface;

	/**
	 * Creates a new debug adapter that is used for one debug session.
	 * We configure the default implementation of a debug adapter here.
	 */
	public constructor() {
		super("mock-debug.txt");
		console.log("construct new MockDebugSession");
		// this debugger uses zero-based lines and columns
		this.setDebuggerLinesStartAt1(true);
		this.setDebuggerColumnsStartAt1(true);
		// this._responseState = "none";

		this._herald = new herald();

		// setup event handlers
		this._herald.on('initialized', () => {
			console.log("receive initialize response");
			this.sendEvent(new InitializedEvent());
		});
		this._herald.on('stopped', (data) => {
			this.sendEvent(new StoppedEvent(data["reason"], MockDebugSession.THREAD_ID));
		});
		this._herald.on('output', (text, filePath, line, column) => {
			const e: DebugProtocol.OutputEvent = new OutputEvent(`${text}\n`);
			e.body.source = this.createSource(filePath);
			e.body.line = this.convertDebuggerLineToClient(line);
			e.body.column = this.convertDebuggerColumnToClient(column);
			this.sendEvent(e);
		});
		this._herald.on('exited', () => {
			this.sendEvent(new TerminatedEvent());
		});
		this._herald.on('response', (result_data) => {
			this.processResponse(result_data);
		});
		console.log("construct new MockDebugSession done");
	}

	protected processResponse(results) {
		//TODO more response types, and maybe result error handler
		var array: Array<any>;
		if(results.length>1)
			array = results;
		else
			array = new Array(results);
		// console.log(this._responseState)
		// console.log(array);
		// debugger;
		if(this._responseState.length == 0) {
			return;
		}
		switch(this._responseState.pop()) {
			case "initialize":
				((response: DebugProtocol.InitializeResponse) => {
					response.body = response.body || {};
					response.body.supportsConfigurationDoneRequest = true;
					response.body.supportsEvaluateForHovers = false;
					response.body.supportsStepBack = false;
					this.sendResponse(response);
				})(this._responseInterface);
				break;
			case "launch":
				((response: DebugProtocol.LaunchResponse) => {
					this.sendResponse(response);
				})(this._responseInterface);
				break;
			case "setBreakPoints":
				((response: DebugProtocol.SetBreakpointsResponse, results: Array<any>) => {
					const actualBreakpoints = array.map(result => {
						const id = result["id"];
						const verified = result["verified"];
						const line = result["line"];
						const bp = <DebugProtocol.Breakpoint> new Breakpoint(verified, this.convertDebuggerLineToClient(line))
						bp.id = id;
						return bp;
					});
					// debugger;
					// console.log(actualBreakpoints.length);
					// console.log(actualBreakpoints[0].id);
					response.body = {
						breakpoints: actualBreakpoints
					}
					this.sendResponse(response);
				})(this._responseInterface, results);
				break;
			case "continue":
				((response: DebugProtocol.ContinueResponse) => {
					this.sendResponse(response);
				})(this._responseInterface);
				break;
			case "next":
				((response: DebugProtocol.NextResponse) => {
					this.sendResponse(response);
				})(this._responseInterface);
				break;
			case "stackTrace":
				((response: DebugProtocol.StackTraceResponse, results) => {
					const actualStackFrames = array.map(result => {
						const stk = new StackFrame(result["frameId"], result["name"], this.createSource(result["path"]), this.convertDebuggerLineToClient(result["line"]));
						return stk;
					})
					response.body = {
						stackFrames: actualStackFrames,
						totalFrames: results.length
					};
					this.sendResponse(response);
				})(this._responseInterface, array);
				break
			case "scopes":
				((response: DebugProtocol.ScopesResponse, results) => {
					const scopes = array.map(result => {
						const scp = new Scope(result["name"], this._variableHandles.create(result["variablesReference"]), result["expensive"]);
						return scp;
					})
					response.body = {
						scopes: scopes
					};
					this.sendResponse(response);
				})(this._responseInterface, array);
				break;
			case "variables":
				((response: DebugProtocol.VariablesResponse, results) => {
					const variables = new Array<DebugProtocol.Variable>();
					array.forEach(result => {
						variables.push({
							name: result["name"],
							type: result["type"],
							value: result["value"],
							variablesReference: result["variablesReference"]
						})
					});
					response.body = {
						variables: variables
					};
					this.sendResponse(response);
				})(this._responseInterface, array);
				break;
			default:
				//throw error: wrong response massage
		}

	}

	/**
	 * The 'initialize' request is the first request called by the frontend
	 * to interrogate the features the debug adapter provides.
	 */
	//no involving debugger, request/response between DA and Vscode
	//https://microsoft.github.io/debug-adapter-protocol/specification#Events_Initialized

	protected initializeRequest(response: DebugProtocol.InitializeResponse, args: DebugProtocol.InitializeRequestArguments): void {

		// var exec = require('child_process').exec;
		// exec('julia D:/judy-master2/judy-master/judy.jl D:/judy-master2/judy-master/test/test1.jl', function(stdin, stdout, stderr) {
		// 	console.log("stdout");
		// 	console.log(stdout);
		// 	console.log("stderr");
		// 	console.log(stderr);
		// 	console.log("stdin");
		// 	console.log(stdin);
		// });

		// // build and return the capabilities of this debug adapter:
		// response.body = response.body || {};

		// // the adapter implements the configurationDoneRequest.
		// response.body.supportsConfigurationDoneRequest = true;

		// // make VS Code to use 'evaluate' when hovering over source
		// response.body.supportsEvaluateForHovers = true;

		// // make VS Code to show a 'step back' button
		// response.body.supportsStepBack = true;
		this._herald.initialize();
		this._responseState.push("initialize");
		this._responseInterface = response;
		// this.sendResponse(response);

		// since this debug adapter can accept configuration requests like 'setBreakpoint' at any time,
		// we request them early by sending an 'initializeRequest' to the frontend.
		// The frontend will end the configuration sequence by calling 'configurationDone' request.
		// this.sendEvent(new InitializedEvent());
	}

	/**
	 * Called at the end of the configuration sequence.
	 * Indicates that all breakpoints etc. have been sent to the DA and that the 'launch' can start.
	 */
	protected configurationDoneRequest(response: DebugProtocol.ConfigurationDoneResponse, args: DebugProtocol.ConfigurationDoneArguments): void {
		super.configurationDoneRequest(response, args);

		// notify the launchRequest that configuration has finished
		this._configurationDone.notify();
	}

	protected async launchRequest(response: DebugProtocol.LaunchResponse, args: LaunchRequestArguments) {

		// make sure to 'Stop' the buffered logging if 'trace' is not set
		logger.setup(args.trace ? Logger.LogLevel.Verbose : Logger.LogLevel.Stop, false);

		// wait until configuration has finished (and configurationDoneRequest has been called)
		await this._configurationDone.wait(1000);

		// start the program in the runtime
		this._herald.start(args.program, !!args.stopOnEntry);

		this._responseState.push("launch");
		this._responseInterface = response;
		// this.sendResponse(response);
	}

	protected setBreakPointsRequest(response: DebugProtocol.SetBreakpointsResponse, args: DebugProtocol.SetBreakpointsArguments): void {

		const path = <string>args.source.path;
		var clientLines = args.lines || [];

		// clear all breakpoints for this file
		// this._herald.clearBreakpoints(path);

		// set and verify breakpoint locations
		// const actualBreakpoints = clientLines.map(l => {
		// 	let { verified, line, id } = this._herald.setBreakPoint(path, this.convertClientLineToDebugger(l));
		// 	const bp = <DebugProtocol.Breakpoint> new Breakpoint(verified, this.convertDebuggerLineToClient(line));
		// 	bp.id= id;
		// 	return bp;
		// });
		var lines = clientLines.map(l => this.convertClientLineToDebugger(l));
		// var lines = clientLines.map(l => l);
		this._herald.setBreakPoints(path, lines);

		this._responseState.push("setBreakPoints");
		this._responseInterface = response;
		// send back the actual breakpoint positions
		// response.body = {
		// 	breakpoints: actualBreakpoints
		// };
		// this.sendResponse(response);
	}

	protected threadsRequest(response: DebugProtocol.ThreadsResponse): void {

		// runtime supports now threads so just return a default thread.
		response.body = {
			threads: [
				new Thread(MockDebugSession.THREAD_ID, "thread 1")
			]
		};
		// this._responseState = "threads";
		// this._responseInterface = response;

		this.sendResponse(response);
	}

	protected stackTraceRequest(response: DebugProtocol.StackTraceResponse, args: DebugProtocol.StackTraceArguments): void {

		const startFrame = typeof args.startFrame === 'number' ? args.startFrame : 0;
		const maxLevels = typeof args.levels === 'number' ? args.levels : 1000;
		const endFrame = startFrame + maxLevels;

		const stk = this._herald.stack(startFrame, endFrame);

		this._responseState.push("stackTrace");
		this._responseInterface = response;


		// response.body = {
		// 	stackFrames: stk.frames.map(f => new StackFrame(f.index, f.name, this.createSource(f.file), this.convertDebuggerLineToClient(f.line))),
		// 	totalFrames: stk.count
		// };
		// this.sendResponse(response);
	}

	protected scopesRequest(response: DebugProtocol.ScopesResponse, args: DebugProtocol.ScopesArguments): void {

		const frameReference = args.frameId;
		// const scopes = new Array<Scope>();
		// scopes.push(new Scope("Local", this._variableHandles.create("local_" + frameReference), false));
		// scopes.push(new Scope("Global", this._variableHandles.create("global_" + frameReference), true));

		this._herald.scopes(frameReference);

		// response.body = {
		// 	scopes: scopes
		// };

		this._responseState.push("scopes");
		this._responseInterface = response;
		// this.sendResponse(response);
	}

	protected variablesRequest(response: DebugProtocol.VariablesResponse, args: DebugProtocol.VariablesArguments): void {

		// const variables = new Array<DebugProtocol.Variable>();
		// const id = this._variableHandles.get(args.variablesReference);
		// if (id !== null) {
		// 	variables.push({
		// 		name: id + "_i",
		// 		type: "integer",
		// 		value: "123",
		// 		variablesReference: 0
		// 	});
		// 	variables.push({
		// 		name: id + "_f",
		// 		type: "float",
		// 		value: "3.14",
		// 		variablesReference: 0
		// 	});
		// 	variables.push({
		// 		name: id + "_s",
		// 		type: "string",
		// 		value: "hello world",
		// 		variablesReference: 0
		// 	});
		// 	variables.push({
		// 		name: id + "_o",
		// 		type: "object",
		// 		value: "Object",
		// 		variablesReference: this._variableHandles.create("object_")
		// 	});
		// }
		var variablesReference = args.variablesReference;
		this._herald.variables(variablesReference);
		// response.body = {
		// 	variables: variables
		// };

		this._responseState.push("variables");
		this._responseInterface = response;
		// this.sendResponse(response);
	}

	protected continueRequest(response: DebugProtocol.ContinueResponse, args: DebugProtocol.ContinueArguments): void {
		this._herald.continue();

		this._responseState.push("continue");
		this._responseInterface = response;
		// this.sendResponse(response);
	}

	// protected reverseContinueRequest(response: DebugProtocol.ReverseContinueResponse, args: DebugProtocol.ReverseContinueArguments) : void {
	// 	this._herald.continue(true);
	// 	this.sendResponse(response);
	 // }

	// protected stepBackRequest(response: DebugProtocol.StepBackResponse, args: DebugProtocol.StepBackArguments): void {
	// 	this._herald.step(true);
	// 	this.sendResponse(response);
	// }

	protected nextRequest(response: DebugProtocol.NextResponse, args: DebugProtocol.NextArguments): void {
		this._herald.next();
		this._responseState.push("next");
		this._responseInterface = response;
		// this.sendResponse(response);
	}

	//TODO!!!
	// protected evaluateRequest(response: DebugProtocol.EvaluateResponse, args: DebugProtocol.EvaluateArguments): void {

	// 	let reply: string | undefined = undefined;

	// 	if (args.context === 'repl') {
	// 		// 'evaluate' supports to create and delete breakpoints from the 'repl':
	// 		const matches = /new +([0-9]+)/.exec(args.expression);
	// 		if (matches && matches.length === 2) {
	// 			const mbp = this._herald.setBreakPoint(this._herald.sourceFile, this.convertClientLineToDebugger(parseInt(matches[1])));
	// 			const bp = <DebugProtocol.Breakpoint> new Breakpoint(mbp.verified, this.convertDebuggerLineToClient(mbp.line), undefined, this.createSource(this._herald.sourceFile));
	// 			bp.id= mbp.id;
	// 			this.sendEvent(new BreakpointEvent('new', bp));
	// 			reply = `breakpoint created`;
	// 		} else {
	// 			const matches = /del +([0-9]+)/.exec(args.expression);
	// 			if (matches && matches.length === 2) {
	// 				const mbp = this._herald.clearBreakPoint(this._herald.sourceFile, this.convertClientLineToDebugger(parseInt(matches[1])));
	// 				if (mbp) {
	// 					const bp = <DebugProtocol.Breakpoint> new Breakpoint(false);
	// 					bp.id= mbp.id;
	// 					this.sendEvent(new BreakpointEvent('removed', bp));
	// 					reply = `breakpoint deleted`;
	// 				}
	// 			}
	// 		}
	// 	}

	// 	response.body = {
	// 		result: reply ? reply : `evaluate(context: '${args.context}', '${args.expression}')`,
	// 		variablesReference: 0
	// 	};
	// 	this.sendResponse(response);
	// }

	//---- helpers

	private createSource(filePath: string): Source {
		return new Source(basename(filePath), this.convertDebuggerPathToClient(filePath), undefined, undefined, 'mock-adapter-data');
	}
}
