const fs = require('fs');
const path = require('path');

const userDir = path.join(__dirname, 'public', 'User');

fs.readdir(userDir, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }

    files.forEach(file => {
        if (path.extname(file) === '.html') {
            const filePath = path.join(userDir, file);
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error('Error reading file:', file, err);
                    return;
                }

                // We are looking for the column in the footer with "Contact" or "Contact Us" 
                // and replacing its content.
                // It usually looks like:
                // <div class="col-md-3">
                //   <h5>Contact Us</h5> (or similar)
                //   <input ...>
                //   <button ...>Subscribe</button>
                // ...
                // </div>

                // Regex to capture the whole col-md-3 block that contains "Subscribe"
                // It's a bit tricky with nested divs, but let's try to match the specific content structure

                // Strategy: Find the last col-md-3 in the footer section.
                // Assuming standard footer structure.

                let newData = data;
                let changed = false;

                // Match the block roughly. this is fragile but we standardized footer somewhat.
                // Let's matching the "Contact" header and the subscribe button area
                const oldContactRegex = /<div class="col-md-3">\s*<h5>(Contact|Contact Us)<\/h5>\s*<input[^>]+class="newsletter-input"[^>]*>\s*<button[^>]*>Subscribe<\/button>[\s\S]*?<\/div>/;

                // Alternate regex if there are social icons inside (index.html case)
                // We use [\s\S]*? to be non-greedy but cover lines.
                // We need to be careful not to eat up closing divs of the footer row/container.
                // The closing div of col-md-3 is usually followed by </div> (row) or <hr

                if (data.includes('<h5>Contact') && data.includes('>Subscribe</button>')) {
                    // Construct the new form HTML
                    const newContactForm = `
        <div class="col-md-3">
          <h5>Contact Us</h5>
          <form id="footerContactForm" style="margin-bottom: 0;">
            <input type="text" class="newsletter-input mb-2" placeholder="Name" style="font-size: 0.85rem; padding: 8px;" required />
            <input type="email" class="newsletter-input mb-2" placeholder="Email" style="font-size: 0.85rem; padding: 8px;" required />
            <textarea class="newsletter-input mb-2" rows="2" placeholder="Message" style="font-size: 0.85rem; padding: 8px; resize: none;" required></textarea>
            <button type="submit" class="btn btn-light w-100 btn-sm fw-bold">Send</button>
          </form>
          <div class="mt-3">
            <i class="fa-brands fa-facebook me-3"></i>
            <i class="fa-brands fa-instagram me-3"></i>
            <i class="fa-brands fa-twitter"></i>
          </div>
        </div>`.trim();

                    // Regex to find the target block
                    // We look for: <div class="col-md-3"> ... <h5>Contact... ... Subscribe ... </div>
                    // We'll limit the search scope to the <footer> tag if possible, but finding it first is easier.

                    const footerRegex = /<footer>[\s\S]*?<\/footer>/;
                    const footerMatch = data.match(footerRegex);

                    if (footerMatch) {
                        let footerContent = footerMatch[0];

                        // Replace the specific column inside the footer
                        // We look for the div that has the subscribe button
                        const colRegex = /<div class="col-md-3">\s*<h5>(?:Contact|Contact Us|Support)<\/h5>[\s\S]*?Subscribe<\/button>[\s\S]*?<\/div>/;

                        if (colRegex.test(footerContent)) {
                            const newFooterContent = footerContent.replace(colRegex, newContactForm);
                            newData = newData.replace(footerContent, newFooterContent);
                            changed = true;
                        } else {
                            // Try simpler match if headers vary
                            const colRegex2 = /<div class="col-md-3">\s*<h5>.*?<\/h5>\s*<input[^>]*newsletter-input[^>]*>[\s\S]*?Subscribe<\/button>[\s\S]*?<\/div>/;
                            if (colRegex2.test(footerContent)) {
                                const newFooterContent = footerContent.replace(colRegex2, newContactForm);
                                newData = newData.replace(footerContent, newFooterContent);
                                changed = true;
                            }
                        }
                    }
                }

                if (changed && newData !== data) {
                    fs.writeFile(filePath, newData, 'utf8', (err) => {
                        if (err) console.error('Error writing:', file, err);
                        else console.log(`Updated footer in ${file}`);
                    });
                } else {
                    console.log(`No matching footer section found in ${file}`);
                }
            });
        }
    });
});
