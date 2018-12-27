# Judy: VS Code Julia Debugger

This is the a vscode extension for debugging julia the programming language!

**Judy**

More information about how to develop a new debug adapter can be found
[here](https://code.visualstudio.com/docs/extensions/example-debuggers).
Or discuss debug adapters on Gitter:
[![Gitter Chat](https://img.shields.io/badge/chat-online-brightgreen.svg)](https://gitter.im/Microsoft/vscode)

## Install Judy

1. Well, first we should be clear that in this vanilla version, judy the debugger and judy the adapter are two different things, so we need you to [download the judy debugger](https://github.com/judy-vscode/Judy/archive/master.zip) first.
Unzip this folder to your prefered directory. For the extension to work through, we need you to add your path to `judy.jl`(e.g. C:\your\path\to\judy-master ) to the System Path.
2. Search **Judy** in the VSCode Extension Marketplace, and install it
3. Reload your VSCode and start debugging.

## Using Judy

* Install the **Judy** extension in VSCode Marketplace.
* Create a new 'program' file `test.jl` and enter several lines of julia codes.
* Switch to the debug viewlet and press the gear dropdown.
* Select the debug environment "Judy".
* Press the green 'play' button and enter file name `test.jl` to start debugging.

You can now 'continue', 'step over' the `test.jl` file, set and hit breakpoints, view stacktrace and variables.

![Judy](https://raw.githubusercontent.com/judy-vscode/Adapter/develop/images/judy.gif)



