const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

// Function to recursively get all JS files
function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function(file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.js')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}

// Obfuscation options
const obfuscationOptions = {
    // Conservative obfuscation options to reduce readability while minimizing runtime risk
    compact: true,
    controlFlowFlattening: false,
    numbersToExpressions: false,
    simplify: true,
    stringArray: false,
    splitStrings: false,
    stringArrayThreshold: 0.0,
    transformObjectKeys: false,
    unicodeEscapeSequence: false,
    debugProtection: false,
    disableConsoleOutput: false,
    rotateStringArray: false,
    selfDefending: false,
    identifierNamesGenerator: 'hexadecimal',
    renameGlobals: false,
    target: 'browser'
};

// Get all JS files in dist/spa
const distPath = path.join(__dirname, '../dist/spa');
const jsFiles = getAllFiles(distPath);

// Obfuscate each file
jsFiles.forEach(file => {
    console.log(`Obfuscating: ${file}`);
    const code = fs.readFileSync(file, 'utf8');
    const obfuscationResult = JavaScriptObfuscator.obfuscate(code, obfuscationOptions);
    fs.writeFileSync(file, obfuscationResult.getObfuscatedCode());
});