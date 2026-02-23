const fs = require('fs');
const path = require('path');

function verifyDeployReadiness() {
  console.log('Verifying Vercel Deploy Readiness...');
  
  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    'postcss.config.js'
  ];

  const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(__dirname, '..', file)));

  // Check for tailwind.config.ts or tailwind.config.js
  const tailwindConfigExists = fs.existsSync(path.join(__dirname, '..', 'tailwind.config.ts')) || 
                               fs.existsSync(path.join(__dirname, '..', 'tailwind.config.js'));

  if (!tailwindConfigExists) {
    missingFiles.push('tailwind.config.ts/js');
  }

  // Check for next.config.js or next.config.mjs or next.config.ts
  const nextConfigExists = fs.existsSync(path.join(__dirname, '..', 'next.config.js')) || 
                           fs.existsSync(path.join(__dirname, '..', 'next.config.mjs')) ||
                           fs.existsSync(path.join(__dirname, '..', 'next.config.ts'));

  if (!nextConfigExists) {
    missingFiles.push('next.config.js/mjs/ts');
  }

  if (missingFiles.length > 0) {
    console.error(`FAILURE: Missing critical files for deployment: ${missingFiles.join(', ')}`);
    process.exit(1);
  }

  // Check if .env is present (though Vercel uses env vars, local build needs it)
  if (!fs.existsSync(path.join(__dirname, '..', '.env'))) {
    console.warn('WARNING: .env file is missing. Ensure environment variables are set in Vercel.');
  }

  // Check package.json for build script
  const packageJson = require('../package.json');
  if (!packageJson.scripts || !packageJson.scripts.build) {
    console.error('FAILURE: package.json missing "build" script.');
    process.exit(1);
  }

  console.log('SUCCESS: Project structure appears ready for Vercel deployment.');
}

verifyDeployReadiness();
