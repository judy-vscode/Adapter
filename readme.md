# Judy: VS Code Julia Debugger

This is the very first debugger for julia the programming language!

**Judy**

More information about how to develop a new debug adapter can be found
[here](https://code.visualstudio.com/docs/extensions/example-debuggers).
Or discuss debug adapters on Gitter:
[![Gitter Chat](https://img.shields.io/badge/chat-online-brightgreen.svg)](https://gitter.im/Microsoft/vscode)

## Using Judy

* Install the **Judy** extension in VS Code.
* Create a new 'program' file `test.jl` and enter several lines of julia codes.
* Switch to the debug viewlet and press the gear dropdown.
* Select the debug environment "Judy".
* Press the green 'play' button and enter file name `test.jl` to start debugging.

You can now 'continue', 'step over' the `test.jl` file, set and hit breakpoints, view stacktrace and variables.

![Judy](https://raw.githubusercontent.com/judy-vscode/Adapter/develop/images/judy.gif)

## Build and Run

[![build status](https://travis-ci.org/Microsoft/vscode-mock-debug.svg?branch=master)](https://travis-ci.org/Microsoft/vscode-mock-debug)
[![build status](https://ci.appveyor.com/api/projects/status/empmw5q1tk6h1fly/branch/master?svg=true)](https://ci.appveyor.com/project/weinand/vscode-mock-debug)


* Clone the project [https://github.com/judy-vscode/Judy.git](https://github.com/judy-vscode/Judy.git)
* Open the project folder in VS Code.
* Press `F5` to build and launch Judy in another VS Code window. In that window:
  * Open a new workspace, create a new 'program' file `test.jl` and enter several lines of julia codes.
  * Switch to the debug viewlet and press the gear dropdown.
  * Select the debug environment "Judy".
  * Press `F5` and enter file name `test.jl` to start debugging.
