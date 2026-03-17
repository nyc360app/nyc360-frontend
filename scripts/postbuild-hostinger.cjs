const fs = require('node:fs');
const path = require('node:path');

const browserDir = path.resolve('dist/my-ssr-app/browser');
const csrIndex = path.join(browserDir, 'index.csr.html');
const htmlIndex = path.join(browserDir, 'index.html');
const sourceHtaccess = path.resolve('.htaccess');
const targetHtaccess = path.join(browserDir, '.htaccess');

if (!fs.existsSync(browserDir)) {
  console.error(`Build output folder not found: ${browserDir}`);
  process.exit(1);
}

if (!fs.existsSync(csrIndex)) {
  console.error(`Expected CSR index not found: ${csrIndex}`);
  process.exit(1);
}

fs.copyFileSync(csrIndex, htmlIndex);
console.log('Created dist/my-ssr-app/browser/index.html from index.csr.html');

if (fs.existsSync(sourceHtaccess)) {
  fs.copyFileSync(sourceHtaccess, targetHtaccess);
  console.log('Copied .htaccess to dist/my-ssr-app/browser/.htaccess');
} else {
  console.log('No root .htaccess found, skipped copying.');
}
