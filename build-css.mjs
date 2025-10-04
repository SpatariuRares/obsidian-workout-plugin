import fs from 'fs';
import postcss from 'postcss';
import postcssImport from 'postcss-import';

const inputFile = 'styles.source.css';
const outputFile = 'styles.css';

// Read the input CSS file
const css = fs.readFileSync(inputFile, 'utf8');

// Process with PostCSS
postcss([postcssImport()])
  .process(css, { from: inputFile, to: outputFile })
  .then(result => {
    // Write the bundled CSS
    fs.writeFileSync(outputFile, result.css);
    console.log('✓ CSS modules bundled successfully');
  })
  .catch(error => {
    console.error('✗ CSS build failed:', error);
    process.exit(1);
  });
