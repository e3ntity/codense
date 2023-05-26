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
  .option("--print-omitted", "Print omitted files")
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

  const ig = ignore();
  const [output, fileCount] = await traverse(dir, ig);

  if (options.clipboard) {
    clipboardy.writeSync(output);
    console.log(`Copied ${fileCount} files with ${output.length} characters to clipboard!`);
  } else {
    console.log(output);
  }
};

/**
 * Add ignore rules from .gitignore and .codenseignore
 * @param {string} dir Directory to add ignore rules from
 * @param {ignore.Ignore} ig Ignore object
 * @returns {ignore.Ignore} Ignore object with rules added
 */
const addIgnoreRules = (dir, ig) => {
  const gitignorePath = path.join(dir, ".gitignore");
  const codenseignorePath = path.join(dir, ".codenseignore");

  let rules = [];

  if (fs.existsSync(gitignorePath)) rules = [...rules, ...fs.readFileSync(gitignorePath).toString().split("\n")];
  if (fs.existsSync(codenseignorePath))
    rules = [...rules, ...fs.readFileSync(codenseignorePath).toString().split("\n")];

  absRules = rules
    .filter((rule) => rule.length > 0)
    .filter((rule) => !rule.startsWith("#"))
    .map((rule) => path.join(path.relative(program.dir, dir), rule));
  ig = ig.add(absRules);

  return ig;
};

/**
 * Traverse a directory and summarize all files
 * @param {string} dir Directory to traverse
 * @param {ignore.Ignore} ig Ignore object
 * @param {string} baseDir Base directory
 * @returns {Promise<void>} Promise that resolves when all files have been summarized
 */
const traverse = async (dir, ig, baseDir = dir) => {
  let output = "";
  let fileCount = 0;

  ig = addIgnoreRules(dir, ig);

  const files = fs.readdirSync(dir);
  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const filePath = path.join(dir, filename);
    const relativeFilePath = path.relative(baseDir, filePath);

    if (ig.ignores(relativeFilePath)) {
      output += options.printOmitted ? `Omitted ${relativeFilePath}\n` : "";
      continue;
    }

    if (fs.statSync(filePath).isDirectory()) {
      const [subOutput, subFileCount] = await traverse(filePath, ig, baseDir);

      output += subOutput;
      fileCount += subFileCount;
    } else {
      let summary;

      try {
        summary = await summarize(filePath, baseDir);
      } catch (err) {
        console.error(`Error summarizing ${relativeFilePath}: ${err}`);
        process.exit(1);
      }

      if (summary.match(/[^\x00-\x7F]/g)) {
        console.error(`Error summarizing ${relativeFilePath}: Summary contains non-ASCII characters!`);
        process.exit(1);
      }

      output += summary;
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
