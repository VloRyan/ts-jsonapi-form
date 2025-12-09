#!/usr/bin/env node
const packageJson = require(__dirname + "/../package.json");
const packageJsonTemplate = require(__dirname + "/package-template.json");
const fs = require("fs");

packageJsonTemplate.version = packageJson.version;
packageJsonTemplate.dependencies = packageJson.dependencies;

const jsonData = JSON.stringify(packageJsonTemplate, null, 2);
try {
  fs.writeFileSync(__dirname + "/../dist/package.json", jsonData);
  // file written successfully
} catch (err) {
  console.error(err);
}
