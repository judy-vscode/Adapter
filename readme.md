# Judy: Julia Debugger

This is a vscode extension for Judy, the debugger for julia the programming language.

More information about how to develop a new debug adapter can be found [here](https://code.visualstudio.com/docs/extensions/example-debuggers). Or discuss debug adapters on Gitter: [![Gitter Chat](https://img.shields.io/badge/chat-online-brightgreen.svg)](https://gitter.im/Microsoft/vscode)

## Getting Started

### Installing

Well, first we should be clear that in this vanilla version, judy the debugger and judy the adapter are two different things, so we need you to
1. **[download the judy debugger](https://github.com/judy-vscode/Judy/archive/master.zip)** . Unzip this folder to your prefered directory, and add it to your **System Path** (e.g. `C:\your\path\to\judy-master` ).
2. Search **Judy** in the VSCode Extension Marketplace (`ctrl+shift+x`), and install Judy the extension.
3. Reload your VSCode and start debugging.

## Deployment
After you finishing installing the Judy debugger and its VS Code extension, you will need to configure your wokring directory to start debugging.

1. In your working directory, create a new 'program' file `test.jl` and enter several lines of julia codes with at least one breakpoint.
2. Switch to the debug viewlet and press the gear dropdown.
3. Select the debug environment "Judy".
4. Press the green 'play' button and enter the relative path to `test.jl` (e.g. `test/test.jl`) to start debugging this file.

You can now `continue`, `step over` the `test.jl` file, set and hit `breakpoints`, view `stacktrace` and `variables`.

![Judy](https://raw.githubusercontent.com/judy-vscode/Adapter/develop/images/judy.gif)

## Contributing

## Authors
#### Judy-Team
* **Yu Xing, Zhiqi Lin** - *Judy the debugger -[Judy](https://github.com/judy-vscode/Judy)*
* **Manli Shu, Yuechen Wang** - *Judy the adapter&extention -[Adapter](https://github.com/judy-vscode/Adapter)*

## Acknowledgements
* the adapter is developed based on [vscode-mock-debug](https://github.com/Microsoft/vscode-mock-debug)



