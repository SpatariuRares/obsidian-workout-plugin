import * as sass from 'sass';
import fs from 'fs';

const inputFile = 'styles.source.scss';
const outputFile = 'styles.css';

try {
    const result = sass.compile(inputFile, {
        style: 'expanded',
        loadPaths: ['.'] // Allow resolving from root
    });

    fs.writeFileSync(outputFile, result.css);
    console.log('✓ SCSS bundled successfully');
} catch (error) {
    console.error('✗ SCSS build failed:', error.message);
    process.exit(1);
}
