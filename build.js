#!/usr/bin/env node
/*
 * Builds the live files from the content file and the design template:
 *   content/site.json + src/template.html  ->  index.html, llms.txt, sitemap.xml
 * Usage: node build.js
 * The editor (editor/) runs the same code in the browser, and the GitHub Action runs this on every content change.
 */
const fs = require('fs');
const path = require('path');
const R = require('./src/render.js');

const read = (p) => fs.readFileSync(path.join(__dirname, p), 'utf8');
const write = (p, s) => fs.writeFileSync(path.join(__dirname, p), s);

const content = JSON.parse(read('content/site.json'));
const template = read('src/template.html');
const today = new Date().toISOString().slice(0, 10);

write('index.html', R.page(content, template));
write('llms.txt', R.llms(content));

/* keep the sitemap date unless something other than the date would change */
let sitemap = R.sitemap(content, today);
try {
  const old = read('sitemap.xml');
  const strip = (x) => x.replace(/<lastmod>[^<]*<\/lastmod>/, '');
  if (strip(old) === strip(sitemap)) sitemap = old;
} catch (e) { /* first build */ }
write('sitemap.xml', sitemap);

console.log('Built index.html, llms.txt and sitemap.xml');
