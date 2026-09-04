#!/usr/bin/env node
// Script to inject security headers into HTML files for GitHub Pages
// This runs during the GitHub Actions build process

const fs = require('fs');
const path = require('path');

// Security headers to inject as meta tags
const securityHeaders = [
  { httpEquiv: 'Content-Security-Policy', content: "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.github.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; frame-src 'self' https://github.com; connect-src 'self' https://api.github.com https://ghchart.rshah.org https://formsubmit.co; frame-ancestors 'none'; upgrade-insecure-requests" },
  { httpEquiv: 'X-Content-Type-Options', content: 'nosniff' },
  { httpEquiv: 'X-Frame-Options', content: 'SAMEORIGIN' },
  { httpEquiv: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' },
  { httpEquiv: 'Permissions-Policy', content: 'geolocation=(), microphone=(), camera=()' }
];

// Find HTML files without downloading a build dependency in CI.
function findHtmlFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
      continue;
    }

    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...findHtmlFiles(entryPath));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(entryPath);
    }
  }
  return files;
}

const htmlFiles = findHtmlFiles('.');

console.log(`Found ${htmlFiles.length} HTML files to process`);

htmlFiles.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');

    // Check if headers are already present
    if (content.includes('<!-- Security Headers -->')) {
      console.log(`⏭️  Skipping ${file} (already has security headers)`);
      return;
    }

    // Generate security header meta tags
    const headerTags = securityHeaders.map(header =>
      `  <meta http-equiv="${header.httpEquiv}" content="${header.content}">`
    ).join('\n');

    const securityBlock = `  <!-- Security Headers -->\n${headerTags}\n`;

    // Inject after <head> tag
    const headRegex = /(<head[^>]*>)/i;
    if (headRegex.test(content)) {
      content = content.replace(headRegex, `$1\n${securityBlock}`);
      fs.writeFileSync(file, content, 'utf8');
      console.log(`✅ Added security headers to ${file}`);
    } else {
      console.log(`⚠️  No <head> tag found in ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log('\n✅ Security headers injection complete!');
