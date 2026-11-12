const { chromium } = require('playwright');
const html = `<html><body style="margin:0;width:1280px;height:360px;background:#f6f3ec;color:#1d1d1b;font-family:Georgia,'Times New Roman',serif;position:relative">
<div style="position:absolute;left:80px;top:46px;font-size:54px;font-weight:700;letter-spacing:-1px">awesome-ai-governance</div>
<div style="position:absolute;left:80px;top:122px;font-size:24px;color:#55534e;font-family:Helvetica,Arial,sans-serif">A short list of primary sources and open-source tools. Checked, not ranked.</div>
<div style="position:absolute;left:80px;top:190px;width:1120px;font-family:Menlo,Consolas,monospace;font-size:20px;line-height:1.7">
<div><span style="color:#55534e">law</span>  EU AI Act, Council of Europe convention, UNESCO</div>
<div><span style="color:#55534e">standards</span>  ISO/IEC 42001, NIST AI RMF, OECD, CSA</div>
<div><span style="color:#55534e">security</span>  OWASP, MITRE ATLAS, NCSC <span style="color:#2e7d32;font-weight:700">35 links checked</span></div></div>
<div style="position:absolute;left:80px;bottom:26px;font-size:17px;color:#55534e;font-family:Helvetica,Arial,sans-serif">Generated from one data file. No ratings, no referral links.</div></body></html>`;
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 360 } });
await p.setContent(html); await p.screenshot({ path: process.argv[2] }); await b.close(); })();
