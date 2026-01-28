import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const pdfPath = 'AWS Certified Solutions Architect Associate SAA-C03.pdf';

if (!fs.existsSync(pdfPath)) {
    console.error('PDF file not found:', pdfPath);
    process.exit(1);
}

let dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function (data) {
    console.log('Number of pages:', data.numpages);
    console.log('--- START SAMPLE ---');
    console.log(data.text.substring(0, 5000));
    console.log('--- END SAMPLE ---');
}).catch(err => {
    console.error('Error parsing PDF:', err);
});
