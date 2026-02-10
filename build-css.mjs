import * as sass from 'sass';
import fs from 'fs';
import { logBuildError } from './scripts/learning/error-logger.mjs';

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

    // Log error for DOE learning system
    await logBuildError({
        script: 'build-css.mjs',
        error: error,
        context: { inputFile, outputFile }
    });

    process.exit(1);
}
