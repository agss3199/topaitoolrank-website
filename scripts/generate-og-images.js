#!/usr/bin/env node

/**
 * Generate Open Graph images for all tool pages
 * Creates 1200×630px images for social media previews
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 630;
const OUTPUT_DIR = path.join(__dirname, '../public/og-images');

// Tool configurations with their themes
const tools = [
  {
    slug: 'json-formatter',
    name: 'JSON Formatter',
    color: '#3b82f6',
    bgColor: '#eff6ff',
    emoji: '{}',
  },
  {
    slug: 'word-counter',
    name: 'Word Counter',
    color: '#10b981',
    bgColor: '#ecfdf5',
    emoji: '📊',
  },
  {
    slug: 'email-subject-tester',
    name: 'Email Subject Tester',
    color: '#f97316',
    bgColor: '#fff7ed',
    emoji: '✉️',
  },
  {
    slug: 'ai-prompt-generator',
    name: 'AI Prompt Generator',
    color: '#a855f7',
    bgColor: '#faf5ff',
    emoji: '✨',
  },
  {
    slug: 'utm-link-builder',
    name: 'UTM Link Builder',
    color: '#ef4444',
    bgColor: '#fef2f2',
    emoji: '🔗',
  },
  {
    slug: 'invoice-generator',
    name: 'Invoice Generator',
    color: '#6b7280',
    bgColor: '#f9fafb',
    emoji: '📄',
  },
  {
    slug: 'seo-analyzer',
    name: 'SEO Analyzer',
    color: '#06b6d4',
    bgColor: '#ecf9fe',
    emoji: '📈',
  },
  {
    slug: 'whatsapp-link-generator',
    name: 'WhatsApp Link Generator',
    color: '#25d366',
    bgColor: '#f0fdf4',
    emoji: '💬',
  },
  {
    slug: 'whatsapp-message-formatter',
    name: 'WhatsApp Message Formatter',
    color: '#25d366',
    bgColor: '#f0fdf4',
    emoji: '📝',
  },
];

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`✓ Created ${OUTPUT_DIR}`);
}

// Generate images for each tool
tools.forEach((tool) => {
  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = tool.bgColor;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Brand bar (left side)
  ctx.fillStyle = tool.color;
  ctx.fillRect(0, 0, 8, CANVAS_HEIGHT);

  // Brand name (top-left corner)
  ctx.fillStyle = '#666';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('Top AI Tool Rank', 40, 50);

  // Tool emoji (large, left side)
  ctx.font = 'bold 120px Arial';
  ctx.fillText(tool.emoji, 120, 380);

  // Tool name (center, large)
  ctx.fillStyle = tool.color;
  ctx.font = 'bold 72px Arial';
  const textX = 420;
  const textY = 320;
  ctx.fillText(tool.name, textX, textY);

  // Subtitle
  ctx.fillStyle = '#999';
  ctx.font = '24px Arial';
  ctx.fillText('Free Online Tool', textX, textY + 60);

  // Save as PNG
  const imagePath = path.join(OUTPUT_DIR, `${tool.slug}.png`);
  const stream = canvas.createPNGStream();
  const writeStream = fs.createWriteStream(imagePath);

  stream.pipe(writeStream);

  writeStream.on('finish', () => {
    const stats = fs.statSync(imagePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`✓ ${tool.slug}.png (${sizeKB}KB)`);
  });

  writeStream.on('error', (err) => {
    console.error(`✗ Error writing ${tool.slug}.png:`, err);
  });
});

console.log('\nGenerating OG images for 9 tools...');
console.log(`Output directory: ${OUTPUT_DIR}\n`);
