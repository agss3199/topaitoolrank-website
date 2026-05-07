/**
 * SEO Verification Script
 * Verifies:
 * - Todo 22: Sitemap completeness (all 9 tools present)
 * - Todo 23: Metadata rendering (titles, descriptions, OG tags, canonical)
 * - Todo 25: Search Console readiness (no issues, mobile-friendly)
 *
 * Usage: npx tsx scripts/verify-seo.ts
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { load } from 'cheerio';

const BASE_URL = 'http://localhost:3000';
const TOOLS = [
  'json-formatter',
  'word-counter',
  'email-subject-tester',
  'ai-prompt-generator',
  'utm-link-builder',
  'invoice-generator',
  'seo-analyzer',
  'whatsapp-link-generator',
  'whatsapp-message-formatter',
];

interface VerificationResult {
  passed: boolean;
  checks: { name: string; passed: boolean; details: string }[];
}

async function verifySitemap(): Promise<VerificationResult> {
  const result: VerificationResult = {
    passed: true,
    checks: [],
  };

  try {
    const response = await axios.get(`${BASE_URL}/sitemap.xml`);
    const sitemap = response.data;

    // Check for all 9 tools
    for (const tool of TOOLS) {
      const hasUrl = sitemap.includes(`/tools/${tool}`);
      result.checks.push({
        name: `Tool "${tool}" in sitemap`,
        passed: hasUrl,
        details: hasUrl ? '✓ Found' : '✗ Missing',
      });
      if (!hasUrl) result.passed = false;
    }

    // Check XML well-formedness
    try {
      const $ = load(sitemap, { xmlMode: true });
      const urlCount = $('url').length;
      result.checks.push({
        name: 'Sitemap XML valid',
        passed: true,
        details: `✓ Valid XML with ${urlCount} URLs`,
      });
    } catch (e) {
      result.checks.push({
        name: 'Sitemap XML valid',
        passed: false,
        details: '✗ Invalid XML format',
      });
      result.passed = false;
    }

    // Check priority and changefreq tags
    const $ = load(sitemap, { xmlMode: true });
    const urlsWithoutPriority = $('url:not(:has(priority))').length;
    const urlsWithoutChangefreq = $('url:not(:has(changefreq))').length;

    result.checks.push({
      name: 'All URLs have priority tag',
      passed: urlsWithoutPriority === 0,
      details: urlsWithoutPriority === 0 ? '✓ All have priority' : `✗ ${urlsWithoutPriority} missing`,
    });

    result.checks.push({
      name: 'All URLs have changefreq tag',
      passed: urlsWithoutChangefreq === 0,
      details: urlsWithoutChangefreq === 0 ? '✓ All have changefreq' : `✗ ${urlsWithoutChangefreq} missing`,
    });
  } catch (e) {
    result.passed = false;
    result.checks.push({
      name: 'Sitemap accessible',
      passed: false,
      details: `✗ Error: ${(e as Error).message}`,
    });
  }

  return result;
}

async function verifyToolMetadata(): Promise<VerificationResult> {
  const result: VerificationResult = {
    passed: true,
    checks: [],
  };

  for (const tool of TOOLS) {
    try {
      const response = await axios.get(`${BASE_URL}/tools/${tool}`);
      const $ = load(response.data);

      // Check title
      const title = $('title').text() || $('meta[property="og:title"]').attr('content');
      const hasTitle = title && title.length > 0;

      // Check meta description
      const description = $('meta[name="description"]').attr('content');
      const hasDescription = description && description.length > 50;

      // Check canonical
      const canonical = $('link[rel="canonical"]').attr('href');
      const hasCanonical = canonical && canonical.includes(`/tools/${tool}`);

      // Check OG image
      const ogImage = $('meta[property="og:image"]').attr('content');
      const hasOGImage = ogImage && ogImage.includes('/og-images/');

      // Check Twitter Card
      const twitterCard = $('meta[name="twitter:card"]').attr('content');
      const hasTwitterCard = twitterCard === 'summary_large_image';

      // Check structured data
      const ldJson = $('script[type="application/ld+json"]').html();
      const hasStructuredData = ldJson && ldJson.includes('WebApplication');

      const checks = [
        { name: 'Title', passed: hasTitle, details: title },
        { name: 'Meta Description', passed: hasDescription, details: `${description?.length || 0} chars` },
        { name: 'Canonical URL', passed: hasCanonical, details: canonical || 'Missing' },
        { name: 'OG Image', passed: hasOGImage, details: ogImage || 'Missing' },
        { name: 'Twitter Card', passed: hasTwitterCard, details: twitterCard || 'Missing' },
        { name: 'Structured Data', passed: hasStructuredData, details: hasStructuredData ? 'Found' : 'Missing' },
      ];

      for (const check of checks) {
        result.checks.push({
          name: `${tool} - ${check.name}`,
          passed: check.passed,
          details: check.details || '',
        });
        if (!check.passed) result.passed = false;
      }
    } catch (e) {
      result.passed = false;
      result.checks.push({
        name: `${tool} - Page accessible`,
        passed: false,
        details: (e as Error).message,
      });
    }
  }

  return result;
}

async function verifyRobotsTxt(): Promise<VerificationResult> {
  const result: VerificationResult = {
    passed: true,
    checks: [],
  };

  try {
    const response = await axios.get(`${BASE_URL}/robots.txt`);
    const content = response.data;

    // Check if /tools/ is allowed
    const allowsTools = content.includes('Allow: /') || !content.includes('Disallow: /tools/');
    result.checks.push({
      name: 'robots.txt allows /tools/ crawling',
      passed: allowsTools,
      details: allowsTools ? '✓ Tools can be crawled' : '✗ Tools are disallowed',
    });

    // Check if sitemap is referenced
    const hasSitemap = content.includes('Sitemap:');
    result.checks.push({
      name: 'Sitemap referenced in robots.txt',
      passed: hasSitemap,
      details: hasSitemap ? '✓ Sitemap declared' : '✗ Sitemap missing',
    });

    if (!allowsTools || !hasSitemap) result.passed = false;
  } catch (e) {
    result.passed = false;
    result.checks.push({
      name: 'robots.txt accessible',
      passed: false,
      details: (e as Error).message,
    });
  }

  return result;
}

async function verifyMobileResponsive(): Promise<VerificationResult> {
  const result: VerificationResult = {
    passed: true,
    checks: [],
  };

  try {
    // Test representative tool
    const response = await axios.get(`${BASE_URL}/tools/json-formatter`);
    const $ = load(response.data);

    // Check viewport meta
    const viewport = $('meta[name="viewport"]').attr('content');
    const hasViewport = viewport && viewport.includes('width=device-width');

    result.checks.push({
      name: 'Viewport meta tag present',
      passed: hasViewport,
      details: viewport || 'Missing',
    });

    // Check if user-scalable is not disabled
    const disabledScale = viewport?.includes('user-scalable=no');
    result.checks.push({
      name: 'User zoom not disabled',
      passed: !disabledScale,
      details: disabledScale ? '✗ user-scalable=no found' : '✓ Zoom allowed',
    });

    if (!hasViewport || disabledScale) result.passed = false;
  } catch (e) {
    result.passed = false;
    result.checks.push({
      name: 'Mobile responsiveness check',
      passed: false,
      details: (e as Error).message,
    });
  }

  return result;
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('SEO VERIFICATION REPORT');
  console.log('='.repeat(70) + '\n');

  const results = {
    sitemap: await verifySitemap(),
    metadata: await verifyToolMetadata(),
    robots: await verifyRobotsTxt(),
    mobile: await verifyMobileResponsive(),
  };

  // Print results
  for (const [section, result] of Object.entries(results)) {
    console.log(`\n${section.toUpperCase()}`);
    console.log('-'.repeat(70));
    for (const check of result.checks) {
      const status = check.passed ? '✓' : '✗';
      console.log(`${status} ${check.name.padEnd(50)} ${check.details}`);
    }
    const status = result.passed ? '✓ PASSED' : '✗ FAILED';
    console.log(`${status}`);
  }

  // Summary
  const allPassed = Object.values(results).every((r) => r.passed);
  console.log('\n' + '='.repeat(70));
  if (allPassed) {
    console.log('✓ ALL SEO CHECKS PASSED');
  } else {
    console.log('✗ SOME SEO CHECKS FAILED');
  }
  console.log('='.repeat(70) + '\n');

  // Write summary to file
  const reportPath = path.join(process.cwd(), '.test-results', 'seo-verification.json');
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`Report saved to ${reportPath}\n`);

  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
