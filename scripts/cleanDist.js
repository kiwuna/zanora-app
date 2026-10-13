const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');

// Clean the dist folder before building
try {
  if (fs.existsSync(distPath)) {
    console.log('Cleaning dist folder...');
    fs.rmSync(distPath, { recursive: true, force: true });
    console.log('Dist folder cleaned successfully');
  }
} catch (error) {
  console.error('Error cleaning dist folder:', error);
  process.exit(1);
}
