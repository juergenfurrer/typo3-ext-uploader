const typo3Api = require("./typo3-api");

let path = process.argv.slice(2)[0];

/**
 * This script will upload an extension
 * node deploy.js [path/to//ext/]
 */
typo3Api
  .deployExtension(path)
  .then((res) => {
    console.log(`Result: ${res}`);
  })
  .catch((error) => {
    console.log(`${error.name}: ${error.message}`);
  });
