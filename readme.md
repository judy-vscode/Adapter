# Judy: Julia Debugger

This is a vscode extension for Judy, the debugger for julia the programming language.

More information about how to develop a new debug adapter can be found [here](https://code.visualstudio.com/docs/extensions/example-debuggers). Or discuss debug adapters on Gitter: [![Gitter Chat](https://img.shields.io/badge/chat-online-brightgreen.svg)](https://gitter.im/Microsoft/vscode)

## Getting Started

### Installing

#### Julia preparation
Since you are using the Julia debugger, we suppose you have already installed Julia on your machine, and the command `julia` is recognized when you entered it in the command line.
And we need you to have the **JSON package installed in julia**:
```
julia> import Pkg
julia> Pkg.add("JSON")
```

####Judy preparation
Well, first we should be clear that in this vanilla version, judy the debugger and judy the adapter are two different things, so we need you to
1. **[download the judy debugger](https://github.com/judy-vscode/Judy/archive/master.zip)** . Unzip this folder to your prefered directory, and add it to your **System Path** (e.g. `C:\your\path\to\judy-master` ).
2. Search **Judy** in the VSCode Extension Marketplace (`ctrl+shift+x`), and install Judy the extension.
3. Reload your VSCode and start debugging.

#####Note
There's a bug in our implementation when parsing the system paths, so the extension only works well in Windows now. We will fix this soon~

## Deployment
After you finishing installing the Judy debugger and its VS Code extension, you will need to configure your wokring directory to start debugging.

1. In your working directory, create a new 'program' file `test.jl` and enter several lines of julia codes with at least one breakpoint.
2. Switch to the debug viewlet and press the gear dropdown.
3. Select the debug environment "Judy".
4. Press the green 'play' button and enter the relative path to `test.jl` (e.g. `test/test.jl`) to start debugging this file.

You can now `continue`, `step over` the `test.jl` file, set and hit `breakpoints`, view `stacktrace` and `variables`.

![Judy](https://raw.githubusercontent.com/judy-vscode/Adapter/develop/images/judy.gif)

## Features

Judy now is still in Beta, we will list what Judy can and what Judy can't.

For better understanding Judy's feature, word `block` will be used under this definition: A block consists of multiple source code lines and is the minimal set of codes which can be successfully executed by Julia. For example:

``` julia
if 5 > 3
  println(5)
else
  println(3)
end
```

is a block while:

``` julia
if 5 > 3
  println(5)
```
and
``` julia
if 5 > 3
```
and
``` julia
a = 3
```
are not blocks. Because the first can't be executed by Julia (lack of end) and the second and third only have one line (where block requires multiple lines).

### What Judy can

* Support Main Module `step over` and `continue`.

* Support multiple source files debugging (with `include` call in Julia)

* Support watching variables and unrolling them on Main Global level.

* Support setting breakpoints even the debuggee is running. (Setting new breakpoints inside blocks should make sure this block has not been passed or is on running)

### What Judy can't

* Local varaibles, such as variables inside function definitions, can't be watched since Julia didn't offer a runtime API to get these information.

* Stacktrace is not accurate since it will include some Judy runtime stacktrace.

* `step in` is not supported. (But you can set a breakpoint inside function definitions and use `continue` to step into functions)

* Only `continue` can be executed inside blocks (If you click `step over`, it will run as `continue`)

* Currently we only support top-module (a.k.a. Main Module) debugging, which means if Judy is debugging inside your own module, it will only treat your module as a big block (so you may only use continue.), and global variables inside this module will not be able to watch.


## Contributing

All kinds of contributions are welcomed!

When contributing to this repository, please first discuss the change you wish to make via issue, email, or any other method with the owners of this repository before making a change.


## Authors
#### JudyTeam
* **Yu Xing, Zhiqi Lin** - *Judy the debugger -[Judy](https://github.com/judy-vscode/Judy)*
* **Manli Shu, Yuechen Wang** - *Judy the adapter&extention -[Adapter](https://github.com/judy-vscode/Adapter)*

## Acknowledgements
* the adapter is developed based on [vscode-mock-debug](https://github.com/Microsoft/vscode-mock-debug)



