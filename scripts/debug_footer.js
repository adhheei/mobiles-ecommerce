const fs = require('fs');
const path = require('path');

const userDir = path.join(__dirname, '../public/User');
const indexFile = path.join(userDir, 'index.html');
const targetFile = path.join(userDir, 'productPage.html');

const indexContent = fs.readFileSync(indexFile, 'utf8');
const targetContent = fs.readFileSync(targetFile, 'utf8');

const footerRegex = /<footer[\s\S]*?<\/footer>/i;

const indexMatch = indexContent.match(footerRegex);
const targetMatch = targetContent.match(footerRegex);

console.log('--- Index Footer Match ---');
if (indexMatch) {
    console.log('Found in index.html, length:', indexMatch[0].length);
    console.log('First 100 chars:', indexMatch[0].substring(0, 100));
} else {
    console.log('Not found in index.html');
}

console.log('\n--- Target Footer Match ---');
if (targetMatch) {
    console.log('Found in productPage.html, length:', targetMatch[0].length);
    console.log('First 100 chars:', targetMatch[0].substring(0, 100));
} else {
    console.log('Not found in productPage.html');
}

console.log('\n--- Comparison ---');
if (indexMatch && targetMatch) {
    if (indexMatch[0] === targetMatch[0]) {
        console.log('Footers are IDENTICAL.');
    } else {
        console.log('Footers are DIFFERENT.');
    }
}
