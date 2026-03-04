#!/usr/bin/env node

/**
 * Re-import all 6 practice/industry pages with corrected hero-practice layout.
 * Simple block: 2 rows × 1 cell, with field hints, imageAlt collapsed.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from '/home/node/.claude/plugins/cache/excat-marketplace/excat/2.1.1/skills/excat-content-import/scripts/node_modules/playwright/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const HELIX_IMPORTER_PATH = '/home/node/.claude/plugins/cache/excat-marketplace/excat/2.1.1/skills/excat-content-import/scripts/static/inject/helix-importer.js';

const PAGES = [
  { url: 'https://www.mcguirewoods.com/services/practices/business-litigation', bundle: resolve(__dirname, 'import-practice-page.bundle.js'), outputPath: 'services/practices/business-litigation' },
  { url: 'https://www.mcguirewoods.com/services/practices/intellectual-property', bundle: resolve(__dirname, 'import-practice-page.bundle.js'), outputPath: 'services/practices/intellectual-property' },
  { url: 'https://www.mcguirewoods.com/services/practices/data-privacy-cybersecurity', bundle: resolve(__dirname, 'import-practice-page.bundle.js'), outputPath: 'services/practices/data-privacy-cybersecurity' },
  { url: 'https://www.mcguirewoods.com/services/industries/healthcare', bundle: resolve(__dirname, 'import-industry-page.bundle.js'), outputPath: 'services/industries/healthcare' },
  { url: 'https://www.mcguirewoods.com/services/industries/energy', bundle: resolve(__dirname, 'import-industry-page.bundle.js'), outputPath: 'services/industries/energy' },
  { url: 'https://www.mcguirewoods.com/services/industries/private-equity', bundle: resolve(__dirname, 'import-industry-page.bundle.js'), outputPath: 'services/industries/private-equity' },
];

const OUTPUT_DIR = resolve(process.cwd(), 'content');

function ensureDir(p) { mkdirSync(p, { recursive: true }); }

async function importPage(page, { url, bundle, outputPath }) {
  console.log(`\n--- ${url} ---`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);

  const title = await page.title();
  const h1 = await page.evaluate(() => document.querySelector('h1')?.textContent?.trim() || '(none)');
  console.log(`  Title: ${title} | H1: ${h1}`);

  const helixScript = readFileSync(HELIX_IMPORTER_PATH, 'utf-8');
  await page.evaluate(script => {
    const orig = window.define; if (typeof window.define !== 'undefined') delete window.define;
    const el = document.createElement('script'); el.textContent = script; document.head.appendChild(el);
    if (orig) window.define = orig;
  }, helixScript);

  const bundleScript = readFileSync(bundle, 'utf-8');
  await page.evaluate(script => {
    const el = document.createElement('script'); el.textContent = script; document.head.appendChild(el);
  }, bundleScript);

  await page.waitForFunction(() => window.CustomImportScript?.default, { timeout: 10000 });

  const result = await page.evaluate(async pageUrl => {
    const config = window.CustomImportScript.default;
    const r = await window.WebImporter.html2md(pageUrl, document, config, { toDocx: false, toMd: true, originalURL: pageUrl });
    r.html = window.WebImporter.md2da(r.md);
    return { html: r.html, path: r.path };
  }, url);

  if (!result.html) throw new Error('No HTML output');

  const outPath = join(OUTPUT_DIR, `${outputPath}.plain.html`);
  ensureDir(dirname(outPath));
  writeFileSync(outPath, result.html, 'utf-8');

  const reportPath = join('tools/importer/reports', `${outputPath}.report.json`);
  ensureDir(dirname(reportPath));
  writeFileSync(reportPath, JSON.stringify({ status: 'success', url, path: outputPath, timestamp: new Date().toISOString(), title }, null, 2), 'utf-8');

  console.log(`  OK -> content/${outputPath}.plain.html`);
  return true;
}

async function main() {
  console.log('=== Re-importing 6 pages (2-row hero-practice with field hints) ===');
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
  let ok = 0;

  for (const pg of PAGES) {
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    page.on('console', m => { if (m.type() === 'error') console.error(`  [Browser] ${m.text()}`); });
    try { if (await importPage(page, pg)) ok++; } catch (e) { console.error(`  FAILED: ${e.message}`); }
    finally { await page.close().catch(() => {}); await ctx.close().catch(() => {}); }
    await new Promise(r => setTimeout(r, 3000));
  }

  await browser.close();
  console.log(`\n=== Done: ${ok}/${PAGES.length} ===`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
