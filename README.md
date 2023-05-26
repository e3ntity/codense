# Codense

## Description
Codense is a command-line tool designed to summarize the contents of a web development project. This tool goes through the specified directory, minifying JavaScript, HTML, and CSS files, and displaying the reduced code with file paths. If a `.gitignore` or `.codenseignore` file is present, the tool will ignore the files and directories specified in them. The output can be printed to the console or copied to the clipboard.

## Getting Started

### Prerequisites
- Node.js

### Installation
1. Clone the repository
```bash
$ git clone https://github.com/e3ntity/codense.git
```
2. Navigate to the project directory
```bash
$ cd codense
```
3. Install the dependencies and link the package
```bash
$ yarn
$ yarn link
```

### Usage
Run the tool using the `codense` command followed by the directory you want to summarize. For example:
```bash
$ codense ./my-project
```

To copy the output to the clipboard, use the `-c` or `--clipboard` flag:
```bash
$ codense ./my-project --clipboard
```

#### Options
- `-c, --clipboard` Copies the output to the clipboard.

## Ignoring Files
If there are files or directories you don't want the tool to process, you can specify them in a `.gitignore` or `.codenseignore` file. The tool will read these files (if they exist) and ignore the specified files and directories.
Attention: You will have to add both `.gitignore` and `.codenseignore` to your `.codenseignore` file if you want to ignore them.

### Example .codenseignore
```
/node_modules
/dist
/test
.gitignore
.codenseignore
```

## Built With
- [clipboardy](https://github.com/sindresorhus/clipboardy) - Cross-platform clipboard read/write module
- [minify](https://github.com/coderaiser/minify) - Tool to minify JS, HTML, CSS, and JSON files
- [ignore](https://github.com/kaelzhang/node-ignore) - Module to handle .gitignore style files
- [commander](https://github.com/tj/commander.js) - Complete solution for node.js command-line interfaces

## Author
- Lukas Schneider

## License
This project is licensed under the MIT License.

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
If you have any questions or run into any issues, please file an issue on the GitHub project page.
