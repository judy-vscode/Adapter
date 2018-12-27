# How to test Judy using judy-vscode-adapter 

## setting up the workspace
put your test folder (e.g. `judy-blockbp` ) in the folder `judy-vscode`    

## setting up the path 
since we are not finishing packaging for judy, we require you to change a line in `selfsocket.ts`    

```
line 38:    exec('julia D:\\Judy_nightly_build/judy-vscode/Judy-blockbp/judy.jl', ...
```

change the path to your `judy.jl`   

## testing
1. choose the debug mode in host window: `Extension + Server`   
2. you will see an Extention window popping out, and you can debug you test file (e.g. `blocks1.jl`) in this window. (we recommend you to open folder `\your-path-to-judy-vscode\judy-blockbp(your debugger dir)` in this wiindow for debugging, since you have your test files under this directory).    
3. configure the debug mode in Extension window: hit the gear button and choose `Judy`, then you will see a launch.json file. Modify line 8 to this: 

   ```
   line 8:  "type": "judy",
   ```
4. type in the path to your test file and start debugging (set up at least one breakpoint in your test file before hitting the green start button)
5. check up the conversation between the debugger and adapter in the host window (not the extension window) : in `DUBUG CONSOLE`, choose `Server` console, you will see the message being sent and received.   

## demo
![demo](images/judy_test.gif)

