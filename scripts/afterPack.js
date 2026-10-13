const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');

// Clean old builds - keep only the latest version
try {
  if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(distPath);

    // Remove old version directories
    files.forEach(file => {
      const filePath = path.join(distPath, file);
      const stat = fs.statSync(filePath);

      // Remove old builder directories (blockmap, yaml files from old builds)
      if (file.endsWith('.yaml') || file.endsWith('.blockmap')) {
        fs.unlinkSync(filePath);
        console.log(`Removed old file: ${file}`);
      }
    });

    console.log('Build cleanup completed');
  }
} catch (error) {
  console.error('Error during cleanup:', error);
}
