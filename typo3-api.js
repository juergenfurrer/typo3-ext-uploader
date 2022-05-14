const axios = require("axios");
const glob = require("glob");
const JSZip = require("jszip");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

// Import the .env with the params
require("dotenv").config();


const deployExtension = (extPath) => {
  return new Promise((resolve, reject) => {
    try {
      let extName = readExtName(extPath);
      writeLog(` => ${extName}`);

      let extVersion = readExtVersion(extPath);
      writeLog(` => ${extVersion}`);

      let versionDescription = readExtDescription(extPath, extVersion);
      writeLog(` => ${versionDescription}`);

      checkVersionExist(extName, extVersion)
        .then((res) => {
          if (res === false) {
            createZip(extPath)
              .then((content) => {
                if (process.env.UPLOAD_EXTENSION > 0) {
                  // Uploade the Extens
                  uploadExtension(content, extName, extVersion, versionDescription)
                    .then((res) => {
                      resolve(res);
                    })
                    .catch((error) => {
                      reject(error);
                    });
                } else if (process.env.EXPORT_PATH) {
                  // Write file to disc
                  writeZipToFile(content, process.env.EXPORT_PATH, extName, extVersion)
                    .then((res) => {
                      resolve(res);
                    })
                    .catch((error) => {
                      reject(error);
                    });
                }
              })
              .catch((error) => {
                reject(error);
              });
          } else {
            reject(new Error(`Version ${extVersion} already exist for EXT:${extName}`));
          }
        })
        .catch((error) => {
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  });
};

const readExtName = (extPath) => {
  writeLog("Read the extension name from composer.json");
  let extName = null;
  try {
    const composer = fs.readFileSync(path.join(extPath, "composer.json"), "utf8");
    const composerJson = JSON.parse(composer);
    extName = composerJson.extra["typo3/cms"]["extension-key"];
  } catch (error) {
    writeError(error);
  }
  if (!extName) {
    throw new Error("extension-key missing in composer.json");
  }
  return extName;
};

const readExtVersion = (extPath) => {
  writeLog("Read the version from ext_emconf.php");
  let extVersion = null;
  try {
    const ext_emconf = fs.readFileSync(path.join(extPath, "ext_emconf.php"), "utf8");
    let reg = /['"]version['"]\s*=>\s*['"]([0-9\.]*)['"]/s;
    let match = ext_emconf.match(reg);
    extVersion = match[1];
  } catch (error) {
    writeError(error);
  }
  if (!extVersion) {
    throw new Error("extension-version not found");
  }
  return extVersion;
};

const readExtDescription = (extPath, extVersion) => {
  const descriptionFilePath = process.env.DESCRIPTION_FILE_PATH;
  const descriptionRegex = process.env.DESCRIPTION_REGEX;
  writeLog(`Read the description from '${descriptionFilePath}'`);
  let versionDescription = null;
  try {
    // get the version
    let descriptionFile = fs.readFileSync(path.join(extPath, descriptionFilePath), "utf8");
    descriptionFile = descriptionFile.replace(/\r\n/g, "\n");
    let reg = new RegExp(descriptionRegex.replace("<version>", extVersion));
    let match = descriptionFile.match(reg);
    versionDescription = match[1];
  } catch (error) {
    writeError(error);
  }
  if (!versionDescription) {
    throw new Error("version description not found");
  }
  return versionDescription;
};

const checkVersionExist = (extName, extVersion) => {
  return new Promise((resolve, reject) => {
    writeLog(`Check version ${extVersion}`);
    axios
      .get(`${process.env.API_URL}extension/${extName}/versions`, {
        headers: {
          Authorization: `Bearer ${process.env.API_TOKEN}`,
        },
      })
      .then((res) => {
        if (res?.data) {
          let versions = res.data[0];
          if (versions) {
            versions.forEach((item) => {
              if (item.number == extVersion) {
                // This version exists
                resolve(true);
              }
            });
            // The version does not exist
            resolve(false);
          } else {
            // there are no version, this is a new EXT?
            resolve(false);
          }
        }
      })
      .catch((error) => {
        writeError(error);
        reject(error);
      });
  });
};

const createZip = (extPath) => {
  return new Promise((resolve, reject) => {
    writeLog("Create ZIP file...");
    const zip = new JSZip();
    glob(extPath + "**/*.*", {}, (er, files) => {
      files.forEach((file) => {
        const filePath = file.replace(extPath, "");
        zip.file(filePath, fs.readFileSync(file));
      });
      zip
        .generateAsync({ type: "nodebuffer" })
        .then((content) => {
          resolve(content);
        })
        .catch((error) => {
          writeError(error);
          reject(error);
        });
    });
  });
};

const writeZipToFile = (content, outPath, extName, extVersion) => {
  return new Promise((resolve, reject) => {
    const destinationPath = path.join(outPath, `${extName}_${extVersion}.zip`);
    writeLog(`Write ZIP file ${destinationPath}`);
    fs.writeFile(destinationPath, content, function (error) {
      if (error) {
        writeError(error);
        reject(error);
      } else {
        resolve(true);
      }
    });
  });
};

const uploadExtension = (content, extName, extVersion, versionDescription) => {
  return new Promise((resolve, reject) => {
    writeLog(`Upload ${extName}_${extVersion}`);
    const form = new FormData();
    form.append("file", content, `${extName}_${extVersion}.zip`);
    form.append("gplCompliant", "1");
    form.append("description", versionDescription);

    axios
      .post(`${process.env.API_URL}extension/${extName}/${extVersion}`, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${process.env.API_TOKEN}`,
        },
      })
      .then((res) => {
        if (res?.data) {
          writeLog(res?.data);
          resolve(res.data.number == extVersion);
        } else {
          writeLog(res);
          resolve(false);
        }
      })
      .catch((error) => {
        writeError(error);
        reject(error);
      });
  });
};

const writeLog = (message) => {
  if (process.env.DEBUG) {
    console.log(message);
  }
}

const writeError = (error) => {
  if (process.env.DEBUG) {
    writeLog(error);
  }
}

exports.deployExtension = deployExtension;
