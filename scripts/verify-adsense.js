const fs = require('fs');
const path = require('path');

const root = process.cwd();
const publisherId = 'ca-pub-5468385790252026';
const sellerPublisherId = publisherId.replace(/^ca-/, '');
const adsScript = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
const authorizedSellerRecord = `google.com, ${sellerPublisherId}, DIRECT, f08c47fec0942fa0`;
const htmlFiles = fs.readdirSync(root).filter((file) => file.endsWith('.html')).sort();
const indexableFiles = htmlFiles.filter((file) => !['search.html', 'favorites.html'].includes(file));

let failed = false;
function fail(message) { failed = true; console.error(`FAIL ${message}`); }
function ok(message) { console.log(`OK ${message}`); }
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }

for (const file of htmlFiles) {
  const html = read(file);
  const headMatch = html.match(/<head[\s\S]*?<\/head>/i);
  const head = headMatch ? headMatch[0] : '';
  const hasAccountMeta = head.includes(`name="google-adsense-account" content="${publisherId}"`);
  const hasScript = head.includes(adsScript) && /<script\s+async\s+src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-5468385790252026"\s+crossorigin="anonymous"\s*><\/script>/i.test(head);
  const canonical = head.match(/<link\s+[^>]*rel="canonical"[^>]*href="https:\/\/careerpk\.online\/[^"]*"[^>]*>/i);
  const navCount = (html.match(/<nav\s+class="navbar"\s+id="navbar"/g) || []).length;
  const navLinksIdCount = (html.match(/id="navLinks"/g) || []).length;
  const navSearchIdCount = (html.match(/id="navSearch"/g) || []).length;

  if (!headMatch || !hasAccountMeta || !hasScript) {
    fail(`${file}: head=${Boolean(headMatch)} accountMeta=${hasAccountMeta} adsScript=${hasScript}`);
  } else if (indexableFiles.includes(file) && !canonical) {
    fail(`${file}: missing absolute careerpk.online canonical URL`);
  } else if (navCount > 1 || navLinksIdCount > 1 || navSearchIdCount > 1) {
    fail(`${file}: duplicate navigation markup navbar=${navCount} navLinks=${navLinksIdCount} navSearch=${navSearchIdCount}`);
  } else {
    console.log(`OK ${file}`);
  }
}

const adsTxtPath = path.join(root, 'ads.txt');
const adsTxt = fs.existsSync(adsTxtPath) ? fs.readFileSync(adsTxtPath, 'utf8').trim() : '';
if (adsTxt !== authorizedSellerRecord) {
  fail('ads.txt: must contain the exact authorized Google seller record only');
} else {
  ok('ads.txt');
}

const privacy = read('privacy.html');
for (const required of ['Google AdSense', 'advertising cookies', 'personalized advertising', 'Google Ads Settings']) {
  if (!privacy.includes(required)) fail(`privacy.html: missing advertising disclosure phrase "${required}"`);
}

const robots = read('robots.txt');
if (!robots.includes('Sitemap: https://careerpk.online/sitemap.xml')) fail('robots.txt: missing sitemap');
if (/Disallow:\s*\/ads\.txt/i.test(robots)) fail('robots.txt: ads.txt must be crawlable');
else ok('robots.txt allows ads.txt');

const vercel = JSON.parse(read('vercel.json'));
const allHeaders = JSON.stringify(vercel.headers);
for (const domain of ['pagead2.googlesyndication.com', 'googleads.g.doubleclick.net', 'tpc.googlesyndication.com', 'fundingchoicesmessages.google.com']) {
  if (!allHeaders.includes(domain)) fail(`vercel.json CSP: missing ${domain}`);
}
if (!vercel.headers.some((entry) => entry.source === '/ads.txt' && JSON.stringify(entry.headers).includes('text/plain'))) {
  fail('vercel.json: missing text/plain header for /ads.txt');
} else {
  ok('vercel.json AdSense headers');
}

if (failed) process.exit(1);
