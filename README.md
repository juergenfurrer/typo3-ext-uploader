# typo3-ext-uploader
Upload TYPO3 extensions automatically from local folder

This tool based on nodejs, you have to install nodejs first (In case of non windows, make sure a suitable npm is installed too)

To install the dependencies you have to open the folder
where you placed this project and type into the console ```npm install```

To deploy a new version of your extension, just type
```
node deploy.js [path/to/ext]
```

## Enviroments

You have to rename the ```.env.example``` to ```.env``` and change the values to your needs

```
API_URL="https://extensions.typo3.org/api/v1/"
API_TOKEN="..."
DESCRIPTION_FILE_PATH="Documentation/ChangeLog/Index.rst"
DESCRIPTION_REGEX="<version>\s.*\s(.*(?:\s.+)*)"
UPLOAD_EXTENSION=0
EXPORT_PATH="/home/user/document/"
DEBUG=0
```

### API_URL
The API-URL to use for this installation

### API_TOKEN
The Token to use for requests to the API

To create a new token:
1. Login into https://extensions.typo3.org/
2. Open My Access Token
3. Enter your password
4. Click "Create access token"
5. Copy your access-token

### DESCRIPTION_FILE_PATH
The path relative from your extension-path

### DESCRIPTION_REGEX
The Regex to search the extension-description in ```DESCRIPTION_FILE_PATH```

### UPLOAD_EXTENSION
If set, the extension will be uploaded to TYPO3

### EXPORT_PATH
The Path where the zip will be created in case you set ```UPLOAD_EXTENSION=0```
### DEBUG
If set, errors will be logged


## Follow the rules...
To deploy a new version of your ext, you have to follow some rules:

### composer.json

You have to add a composer.json with the minimum config:
https://docs.typo3.org/m/typo3/reference-coreapi/main/en-us/ExtensionArchitecture/ComposerJson/Index.html#minimal-composer-json
This tool needs the composer.json to identify the extension-name from extra -> typo3/cms -> extension-key

### ext_emconf.php

typo3-ext-uploader will read the extension-version from the ext_emconf.php, make sure to update the version.
The extension-version will be recognised by regex, make sure, your definition is on one line, the regex does not use the multiline option

```
'version' => '1.0.0',
```
You are free to use as man spaces as you like
```
'version'    =>   '1.0.0',
```
Single and double quotes are allowed
```
"version" => "1.0.0",
```

### Changelog

typo3-ext-uploader will read the version-description from your changelog
You are able to change the behaviour of this method by changing the .env file

#### DESCRIPTION_FILE_PATH

Set the Path, where your changelog is located
```
DESCRIPTION_FILE_PATH="Documentation/ChangeLog/Index.rst"
```

#### DESCRIPTION_REGEX
Set the Regex that will find your text after the version number, it will use the group1 in the match
```
DESCRIPTION_REGEX="<version>\s.*\s(.*(?:\s.+)*)"
```

```<version>``` will be replaced with the extension-version found in ext_emconf.php

The default regex will read changelogs with the following format:
```
Version 1.0.1
-------------
Bugfix

Version 1.0.0
-------------
Initial development
```
If the extension-version is ```1.0.1``` it will read ```Bugfix```
Multilines are read as well, the first empty line will be used to stop the read


| Type         | URL                                                      |
|--------------|----------------------------------------------------------|
| Repository:  | https://github.com/juergenfurrer/typo3-ext-uploader      |
