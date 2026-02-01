const fs = require('fs');
const path = require('path');

const userDir = path.join(__dirname, '../public/User');
const indexFile = path.join(userDir, 'index.html');

console.log('Reading index.html from:', indexFile);

try {
    const indexContent = fs.readFileSync(indexFile, 'utf8');

    // Extract footer. Note: This regex is simple and assumes standard formatting.
    // It captures everything from <footer to </footer> including attributes.
    const footerRegex = /<footer[\s\S]*?<\/footer>/i;
    const match = indexContent.match(footerRegex);

    if (!match) {
        console.error('Could not find <footer> in index.html');
        process.exit(1);
    }

    const newFooter = match[0];
    console.log('Target Footer Length:', newFooter.length);

    // List all HTML files
    const files = fs.readdirSync(userDir).filter(f => f.endsWith('.html') && f !== 'index.html');

    let modifiedCount = 0;

    files.forEach(file => {
        const filePath = path.join(userDir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        if (footerRegex.test(content)) {
            console.log(`Updating footer in: ${file}`);
            const newContent = content.replace(footerRegex, newFooter);
            fs.writeFileSync(filePath, newContent, 'utf8');
            modifiedCount++;
        } else {
            console.log(`No footer found in: ${file} (Skipping)`);
        }
    });

    console.log(`\nSuccess! Updated ${modifiedCount} files.`);

} catch (err) {
    console.error('Error:', err);
}
