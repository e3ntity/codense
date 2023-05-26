#!/usr/bin/env node

const fs = require("fs"),
  path = require("path"),
  minify = require("minify"),
  ignore = require("ignore"),
  clipboardy = require("clipboardy"),
  { program } = require("commander"),
  packageJson = require("../package.json");

program
  .version(packageJson.version)
  .description(packageJson.description)
  .option("-c, --clipboard", "Copy output to clipboard")
  .arguments("<dir>")
  .action(function (dir) {
    program.dir = dir;
  })
  .parse(process.argv);
const options = program.opts();

if (!program.dir) {
  console.error("Error: No directory specified!");
  program.help();
  process.exit(1);
}

const contentDelimiter = "`".repeat(3);

const main = async () => {
  const dir = program.dir;

  // Load which files to ignore
  let ig = ignore();

  const gitignorePath = path.join(dir, ".gitignore");
  if (fs.existsSync(gitignorePath)) ig = ig.add(fs.readFileSync(gitignorePath).toString().split("\n"));

  const codenseignorePath = path.join(dir, ".codenseignore");
  if (fs.existsSync(codenseignorePath)) ig = ig.add(fs.readFileSync(codenseignorePath).toString().split("\n"));

  [output, fileCount] = await traverse(dir, ig);

  if (options.clipboard) {
    clipboardy.writeSync(output);
    console.log(`Copied ${fileCount} files with ${output.length} characters to clipboard!`);
  } else {
    console.log(output);
  }
};

/**
 * Traverse a directory and summarize all files
 * @param {string} dir Directory to traverse
 * @param {ignore.Ignore} ig Ignore object
 * @param {string} baseDir Base directory
 * @returns {Promise<void>} Promise that resolves when all files have been summarized
 */
const traverse = async (dir, ig, baseDir = dir) => {
  const files = fs.readdirSync(dir);

  let output = "";
  let fileCount = 0;

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const filePath = path.join(dir, filename);
    const relativeFilePath = path.relative(baseDir, filePath);

    if (ig.ignores(relativeFilePath)) continue;

    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      const [subOutput, subFileCount] = await traverse(filePath, ig, baseDir);
      output += subOutput;
      fileCount += subFileCount;
    } else {
      output += await summarize(filePath, baseDir);
      fileCount += 1;
    }
  }

  return [output, fileCount];
};

/**
 * Summarize a file
 * @param {string} filePath Path to file
 * @param {string} baseDir Base directory
 * @returns {Promise<void>} Promise that resolves when the file has been summarized
 */
const summarize = async (filePath, baseDir) => {
  const relativeFilePath = path.relative(baseDir, filePath);
  const fileContent = fs.readFileSync(filePath).toString();
  const ext = path.extname(filePath);

  let data;
  if ([".js", ".html", ".css"].includes(ext)) data = await minify(filePath, { js: { mangle: false } });
  else if (ext == ".json") data = JSON.stringify(JSON.parse(fileContent));
  else data = fileContent;

  const summary = `${relativeFilePath}:\n${contentDelimiter}\n${data}\n${contentDelimiter}\n`;

  return summary;
};

main().catch(console.error);
