const fs = require('fs');
const path = require('path');

const root = process.cwd();
const publisherId = 'ca-pub-5468385790252026';
const adsScript = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
const htmlFiles = fs.readdirSync(root).filter((file) => file.endsWith('.html')).sort();

let failed = false;
for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const headMatch = html.match(/<head[\s\S]*?<\/head>/i);
  const head = headMatch ? headMatch[0] : '';
  const hasAccountMeta = head.includes(`name="google-adsense-account" content="${publisherId}"`);
  const hasScript = head.includes(adsScript) && /<script\s+async\s+src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-5468385790252026"\s+crossorigin="anonymous"\s*><\/script>/i.test(head);

  if (!headMatch || !hasAccountMeta || !hasScript) {
    failed = true;
    console.error(`FAIL ${file}: head=${Boolean(headMatch)} accountMeta=${hasAccountMeta} adsScript=${hasScript}`);
  } else {
    console.log(`OK ${file}`);
  }
}

const adsTxtPath = path.join(root, 'ads.txt');
const adsTxt = fs.existsSync(adsTxtPath) ? fs.readFileSync(adsTxtPath, 'utf8') : '';
if (!adsTxt.includes(`google.com, pub-5468385790252026, DIRECT, f08c47fec0942fa0`)) {
  failed = true;
  console.error('FAIL ads.txt: missing authorized Google seller record');
} else {
  console.log('OK ads.txt');
}

if (failed) process.exit(1);
