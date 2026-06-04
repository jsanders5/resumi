const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create a canvas for the OG image (1200x630 is standard for social media)
const canvas = createCanvas(1200, 630);
const ctx = canvas.getContext('2d');

// Background gradient (slate-950 to indigo)
const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
gradient.addColorStop(0, '#0f172a');
gradient.addColorStop(1, '#1e293b');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 1200, 630);

// Draw the logo circle (larger version)
const logoSize = 200;
const logoX = 150;
const logoY = 215;

// Logo background
ctx.fillStyle = '#1e293b';
ctx.strokeStyle = '#6366f1';
ctx.lineWidth = 8;
ctx.fillRect(logoX, logoY, logoSize, logoSize);
ctx.strokeRect(logoX, logoY, logoSize, logoSize);

// Logo text "R"
ctx.fillStyle = '#6366f1';
ctx.font = 'bold 140px monospace';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('R', logoX + logoSize / 2, logoY + logoSize / 2);

// Logo superscript "AI"
ctx.font = 'bold 28px monospace';
ctx.fillText('AI', logoX + logoSize - 30, logoY + 40);

// Title "Resumio-AI"
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 72px sans-serif';
ctx.textAlign = 'left';
ctx.textBaseline = 'top';
ctx.fillText('Resumio-AI', 450, 200);

// Subtitle
ctx.fillStyle = '#cbd5e1';
ctx.font = '36px sans-serif';
ctx.fillText('AI Job Matcher & Portfolio Advisor', 450, 300);

// Bottom tagline
ctx.fillStyle = '#94a3b8';
ctx.font = '24px sans-serif';
ctx.fillText('Free AI-powered job matching', 450, 380);

// Save the image
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(path.join(publicDir, 'og-image.png'), buffer);

console.log('✓ Generated og-image.png (1200x630)');
