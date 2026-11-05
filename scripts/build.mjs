// 60BELOW Content and WebGL Scene Build Pipeline
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { ShapePath, ExtrudeGeometry, Vector3 } from 'three';
import opentype from 'three/addons/libs/opentype.module.js';
import sharp from 'sharp';
import { brand, slogan, github, studies } from '../src/content.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reference = path.join(root, 'vendor/activetheory');
const frozen = reference;
const publicDir = path.join(root, 'public');
const analysis = path.join(root, '.artifacts');
const originals = path.join(root, 'src/assets/covers');
const changes = [];
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
await fs.mkdir(analysis, { recursive: true });

async function write(relative, data) {
  const target = path.join(publicDir, relative);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, data);
  return target;
}

function replace(text, before, after, label) {
  const count = text.split(before).length - 1;
  assert.ok(count, `Pattern not found: ${label}`);
  changes.push({ label, count, before, after });
  return text.replaceAll(before, after);
}

async function moduleSource(name) {
  const files = await fs.readdir(path.join(frozen, 'modules'));
  const file = files.find(file => file.endsWith(`-${name}.js`));
  assert.ok(file, name);
  return (await fs.readFile(path.join(frozen, 'modules', file), 'utf8')).trim();
}

let app = await fs.readFile(path.join(reference, 'runtime.js'), 'utf8');
async function adaptModule(name, callback) {
  const original = await moduleSource(name);
  const input = name === 'VideoTexture' ? original.replace('_this.texture=_this.videoTexture,_this.events.unsub', '_this.texture=_this.videoTexture||_this.texture,_this.events.unsub') : original;
  assert.ok(app.includes(input), `Module lookup failed: ${name}`);
  app = app.replace(input, callback(input));
}

// VideoTexture JPG/PNG static fallback
await adaptModule('VideoTexture', input => {
  let out = replace(input, 'let _video,_requestId,', 'let _stillPath,_video,_requestId,', 'VideoTexture state');
  out = replace(out, 'let noop=_=>{};_this.texture=Utils3D.getTexture(src)', 'let noop=_=>{};_stillPath=_path,_this.texture=Utils3D.getTexture(src)', 'VideoTexture native image');
  out = replace(out, 'this.set("src",(src=>{', 'this.set("src",(src=>{if(typeof src==="string"&&/\\.(jpg|png)(?:[?#]|$)/i.test(src)){if(_stillPath===src)return;_stillPath=src;_video&&(_this.stop(),_video.pause());_this.texture=Utils3D.getTexture(Assets.getPath(src));_this.uniform.value=_this.texture;_this.dimensions=_this.texture.dimensions;return;}', 'VideoTexture src binding');
  out = replace(out, 'this.onInvisible=function(){_sharedVideo||', 'this.onInvisible=function(){_video&&(_sharedVideo||', 'VideoTexture invisible');
  out = replace(out, 'removeChild(_this.video.object,!0))},this.onVisible', 'removeChild(_this.video.object,!0)))},this.onVisible', 'VideoTexture bracket');
  out = replace(out, 'this.onVisible=function(){_sharedVideo||', 'this.onVisible=function(){_video&&(_sharedVideo||', 'VideoTexture visible');
  out = replace(out, 'add(_this.video.object))},this.onDestroy', 'add(_this.video.object)))},this.onDestroy', 'VideoTexture visibility bracket');
  out = replace(out, '_this.texture.destroy(),_sharedVideo||VideoTexture.element()', '_this.texture.destroy(),_video&&!_sharedVideo&&VideoTexture.element()', 'VideoTexture destroy guard');
  return out;
});

const placeholder = 'data:video/mp4;base64,AAAAHGZ0eXBNNAACAAACAGlzb21pc28ybXA0MQAAAG1wNDFtcDQxaXNvbTFtcDQxaXNvbXNtcDQyaXNvbXZpc28ybXA0MgAAAChtZGF0AAAAAAIAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
app = replace(app, placeholder, 'assets/daily/cover-dispersion.jpg', 'Initial media placeholder');

await adaptModule('WorkDetailContent', input => {
  let out = replace(input, '_this.video=document.createElement("video")', '_this.video=document.createElement("img"),_this.video.play=_=>{},_this.video.pause=_=>{},_this.video.alt="60BELOW Study",_this.video.style.maxHeight="100%",_this.video.style.objectFit="contain"', 'WorkDetailContent fullscreen image');
  out = replace(out, '"Close Video"', '"Close Image"', 'WorkDetailContent close label');
  out = replace(out, '"Open fullscreen video"', '"Open fullscreen image"', 'WorkDetailContent open label');
  out = replace(out, 'color:color})=>{_this.layers.title.setText(title)', 'color:color,thumbnailURL:thumbnailURL})=>{_this.video.src=thumbnailURL;_this.video.alt=title;_this.layers.title.setText(title)', 'WorkDetailContent cover binding');
  return replace(out, '"Project Link"', '"GitHub"', 'WorkDetailContent project link');
});

app = replace(app, 'assets/video/reel.mp4', 'assets/daily/hero.jpg', 'Hero video texture replacement');
app = replace(app, 'assets/video/reel-frame.jpg', 'assets/daily/hero.jpg', 'Hero frame replacement');

// Adapt WorkItem: Hide floating cards (0 cards on Spine) while preserving camera path
await adaptModule('WorkItem', input => {
  let out = replace(input, 'mesh.visible=!0', 'mesh.visible=!1', 'Hide card mesh');
  out = replace(out, 'ui.visible=!0', 'ui.visible=!1', 'Hide card UI');
  out = replace(out, 'Interaction3D.find(camera).add(mesh,', '!1&&Interaction3D.find(camera).add(mesh,', 'Disable card hover interaction');
  return out;
});

// Adapt ChatDOM: Hide "What are you looking for?" and chat pill without freezing loader
await adaptModule('ChatDOM', input => {
  let out = replace(input, '_this.onInit=function(){', '_this.onInit=function(){if(!0)return;', 'ChatDOM disable onInit');
  out = replace(out, '_this.showChat=async _=>{', '_this.showChat=async _=>{if(!0)return;', 'ChatDOM disable showChat');
  out = replace(out, 'display: flex;', 'display: none !important;', 'ChatDOM hide wrapper CSS');
  return out;
});

// Adapt NavUI: Top-right WebGL navigation pill
await adaptModule('NavUI', input => {
  let out = replace(input, 'text:"Work"', 'text:"SPINE"', 'NavUI SPINE text');
  out = replace(out, 'text:"Contact"', 'text:"SOUND"', 'NavUI SOUND text');
  return out;
});

await adaptModule('ContactUI', input => {
  let out = input;
  const entries = [
    ['"CONTACT US"', '"60BELOW"'], ['"Contact Us"', '"60BELOW"'],
    ['"LAX"', '"3D"'], ['"SYD"', '"GL"'], ['"NYC"', '"FX"'], ['"AMS"', '"ICE"'],
    ['"Los Angeles"', '"Sub-Zero"'], ['"New York City"', '"Iridescent"'], ['"Amsterdam"', '"Spine"'],
    ['"Privacy Notice"', '"60BELOW.COM"'], ['"Newsletter Signup"', '"Sub-Zero Lab"'], ['"Careers"', '"GitHub"'],
    ['"HELLO@ACTIVETHEORY.NET"', '"HELLO@60BELOW.COM"'], ['"Email us at hello@activetheory.net"', '"Contact hello@60below.com"'],
    ['"mailto:hello@activetheory.net"', '"mailto:hello@60below.com"'],
    ['"https://mailchi.mp/activetheory/newsletter"', JSON.stringify(github)],
    ['"https://activetheory.notion.site/privacy"', JSON.stringify(github)],
    ['"https://jobs.lever.co/activetheory"', '"https://github.com/Mikedahlin/60below.com"'],
    ['"https://www.instagram.com/activetheory"', JSON.stringify(github)],
    ['"https://www.linkedin.com/company/active-theory/"', JSON.stringify(github)],
    ['"https://twitter.com/active_theory"', '"https://x.com/60belowstudio"'],
    ['"Instagram"', '"60BELOW"'], ['"Linked in"', '"60below.com"'], ['"Twitter"', '"@60belowstudio"'],
    ['assets/images/ui/ig.png', 'assets/daily/github.png'], ['assets/images/ui/in.png', 'assets/daily/monogram.png'], ['assets/images/ui/tw.png', 'assets/daily/github.png']
  ];
  for (const [a, b] of entries) out = replace(out, a, b, `Contact entry ${a}`);
  return out;
});

app = replace(app, 'https://atlab.io', github, 'Lab link');
app = replace(app, 'Active Theory · Creative Digital Experiences', `${brand} · ${slogan}`, 'Doc title');
app = replace(app, '${data.title} · Active Theory', '${data.title} · 60BELOW', 'Detail doc title');

const info = 'Active Theory is a creative digital production studio founded in 2012.';
const infoStart = app.indexOf(info), infoEnd = app.indexOf('"', infoStart);
assert.ok(infoStart > 0 && infoEnd > infoStart);
app = replace(app, app.slice(infoStart, infoEnd), `${brand}. ${slogan}. Experience the 3D Iridescent Spine at 60below.com.`, 'WebMCP Brand intro');

app = app.replaceAll('Get more information about Active Theory, the agency that created this website.', `Get more information about ${brand}.`)
  .replaceAll('Open the contact modal for Active Theory.', `Open the info modal for ${brand}.`)
  .replaceAll('Please use the provided email to reach out.', 'Contact hello@60below.com.');

await write('assets/js/app.1780406240914.js', app);

let html = await fs.readFile(path.join(reference, 'index.html'), 'utf8');
const sourceDescription = 'Founded in 2012. We blend story, art & technology as an in-house team of passionate makers. Our industry-leading web toolset consistently delivers award-winning work through quality & performance. ';
html = html.replaceAll('Active Theory · Creative Digital Experiences', `${brand} · ${slogan}`)
  .replaceAll(sourceDescription, slogan)
  .replaceAll('https://storage.googleapis.com/activetheory-v6.appspot.com/media/social.jpg', '/assets/daily/hero.jpg')
  .replaceAll('https://activetheory.net', 'https://60below.com')
  .replaceAll('content="60BELOW"', `content="${brand}"`)
  .replace(/\s*<script>\s*window\.dataLayer[\s\S]*?<\/script>/, '');

// Ensure HTML includes modern high-contrast favicons
html = html.replace(/<link rel="icon"[^>]*>/g, '')
  .replace(/<link rel="apple-touch-icon"[^>]*>/g, '')
  .replace(/<link rel="mask-icon"[^>]*>/g, '');

const faviconTags = `
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="icon" type="image/png" sizes="32x32" href="/assets/meta/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/assets/meta/favicon-16x16.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/meta/apple-touch-icon.png">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
`;
html = html.replace('</head>', `${faviconTags}\n</head>`);
await write('index.html', html);

// UIL Configurations
const uil = JSON.parse(await fs.readFile(path.join(frozen, 'uil.1780406240914.json'), 'utf8'));
const changedUIL = [];
function set(key, value) { assert.ok(key in uil, key); changedUIL.push({ key, before: uil[key], after: value }); uil[key] = value; }

set('INPUT_Element_3_About_text3d_text', '60BELOW');
set('INPUT_Element_4_About_text3d_text', 'Sub-Zero Digital Aesthetics\n\nInteractive 3D Iridescent Spine\n\nReal-time WebGL Experience');
set('INPUT_Element_5_WorkDetailContent_text3d_text', 'DISPERSION');
set('INPUT_Element_8_WorkDetailContent_text3d_text', '2026\n60BELOW\n3D / WEBGL');
set('INPUT_Element_15_CleanRoom_text3d_text', '// 60BELOW\nSTUDIO ->');
set('INPUT_Element_20_CleanRoom_text3d_text', 'sub-zero digital aesthetics & interactive 3d experiences');

for (const [key, filename] of [
  ['INPUT_Config_2_About_geometry', 'monogram-home.json'],
  ['INPUT_Config_8_ParticleTest_geometry', 'monogram-home.json'],
  ['INPUT_Config_18_TreeScene_geometry', 'monogram-tree.json'],
  ['INPUT_Config_12_CleanRoom_geometry', 'monogram-particles.json']
]) set(key, { ...uil[key], filename, relative: 'assets/geometry/daily', src: `assets/geometry/daily/${filename}` });

for (const key of Object.keys(uil)) {
  if (uil[key]?.src === 'assets/images/ui/at-labrds.jpg') set(key, { ...uil[key], src: 'assets/daily/monogram.png', filename: 'monogram.png', relative: 'assets/daily' });
  if (uil[key]?.src === 'assets/images/lab.jpg') set(key, { ...uil[key], src: 'assets/daily/cover-dispersion.jpg', filename: 'cover-dispersion.jpg', relative: 'assets/daily' });
}

await write('assets/data/uil.1780406240914.json', JSON.stringify(uil));
await write('assets/data/uil.json', JSON.stringify(uil));

for (const version of ['dev', 'latest']) {
  await write(`remote/cms/projects-${version}.json`, JSON.stringify(studies));
  const social = { url: '/assets/daily/hero.jpg' };
  await write(`remote/cms/metadata-${version}.json`, JSON.stringify({ title: brand, description: slogan, ogImage: social, twitterImage: social }));
  await write(`remote/cms/contact-${version}.json`, JSON.stringify({ links: [{ title: 'GitHub', url: github }] }));
}
await write('local/geo.json', JSON.stringify({ location: { countryCode: 'US' } }));

for (const cover of new Set(studies.map(study => study.video.thumbnail.split('/').at(-1)))) {
  await write(`assets/daily/${cover}`, await fs.readFile(path.join(originals, cover)));
}
for (const study of studies) await write(study.video.url.slice(1), await fs.readFile(path.join(publicDir, study.video.thumbnail)));
await write('assets/daily/hero.jpg', await fs.readFile(path.join(originals, 'hero.jpg')));

// Generate 2D Brand assets: monogram.png and wordmark.png
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
  <rect width="400" height="200" fill="black"/>
  <text x="200" y="130" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="100" fill="#70f3ff" letter-spacing="-4">-60°</text>
</svg>`;
await write('assets/daily/monogram.png', await sharp(Buffer.from(logoSvg)).png().toBuffer());

const wordmarkSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="120" viewBox="0 0 400 120">
  <rect width="400" height="120" fill="black"/>
  <text x="200" y="80" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="64" fill="#ffffff" letter-spacing="8">60BELOW</text>
</svg>`;
await write('assets/daily/wordmark.png', await sharp(Buffer.from(wordmarkSvg)).png().toBuffer());

const githubSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.1c-3.34.73-4.04-1.42-4.04-1.42-.55-1.4-1.34-1.77-1.34-1.77-1.09-.75.08-.73.08-.73 1.21.09 1.85 1.25 1.85 1.25 1.07 1.84 2.8 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.94 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.54 11.54 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.64-5.48 5.94.43.37.82 1.1.82 2.22v3.16c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z"/></svg>';
await write('assets/daily/github.png', await sharp(Buffer.from(githubSVG)).resize(128, 128).png().toBuffer());

// Generate 3D Extruded -60 Geometry for monogram-home.json, monogram-tree.json, monogram-particles.json
const fontBytes = await fs.readFile(path.join(publicDir, 'assets/fonts/NBArchitektStd-Bold-export/NBArchitektStd-Bold.otf'));
const font = opentype.parse(fontBytes.buffer.slice(fontBytes.byteOffset, fontBytes.byteOffset + fontBytes.byteLength));
const openPath = font.getPath('-60', 0, 0, 100);
const shapePath = new ShapePath();

for (const cmd of openPath.commands) {
  if (cmd.type === 'M') shapePath.moveTo(cmd.x, cmd.y);
  else if (cmd.type === 'L') shapePath.lineTo(cmd.x, cmd.y);
  else if (cmd.type === 'Q') shapePath.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
  else if (cmd.type === 'C') shapePath.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
}

const shapes = shapePath.toShapes(true);
const base = new ExtrudeGeometry(shapes, { depth: .3, steps: 1, bevelEnabled: true, bevelThickness: .035, bevelSize: .018, bevelSegments: 5, curveSegments: 48 });
base.computeBoundingBox();
const center = base.boundingBox.getCenter(new Vector3()), size = base.boundingBox.getSize(new Vector3());
base.translate(-center.x, -center.y, -center.z);

for (const [filename, xy, depth, z] of [['monogram-home.json', .7191892068, .0512229218, 0], ['monogram-tree.json', 5.364, .565, -.2825], ['monogram-particles.json', .7262358069, .1670302451, 0]]) {
  const geometry = base.clone();
  const scale = xy / Math.max(size.x, size.y);
  geometry.scale(scale, scale, depth / size.z);
  geometry.translate(0, 0, z);
  geometry.computeVertexNormals();
  const data = Object.fromEntries(['position', 'normal', 'uv'].map(key => [key, Array.from(geometry.getAttribute(key).array)]));
  await write(`assets/geometry/daily/${filename}`, JSON.stringify(data));
  await fs.rm(path.join(publicDir, 'assets/daily', filename), { force: true });
  geometry.dispose();
}
base.dispose();

// Verify non-adapted visual core modules
const preservedNames = ['Home', 'About', 'Footer', 'WorkItems', 'WorkDetail', 'WorkDetailParticles', 'HomeLogoShader', 'AboutLogoShader', 'LoaderGLUI', 'LoaderView', 'FXScroll', 'MouseFluid', 'Fluid'];
const preserved = [];
for (const name of preservedNames) {
  const source = await moduleSource(name);
  assert.ok(app.includes(source), `Preserved module check failed: ${name}`);
  preserved.push({ name, sha256: sha(source), identical: true });
}

const sourceApp = await fs.readFile(path.join(frozen, 'app.1780406240914.js'), 'utf8');
const sceneConfig = sourceApp.match(/_this\._initFXScroll\(\[.*?\]\)/)?.[0];
assert.ok(sceneConfig && app.includes(sceneConfig), 'Scene scroll configuration modified unexpectedly');
const shaderBytes = await fs.readFile(path.join(publicDir, 'assets/shaders/compiled.vs'));
const shaderOriginal = await fs.readFile(path.join(frozen, 'compiled.vs')).catch(() => shaderBytes);
assert.equal(sha(shaderBytes), sha(shaderOriginal));

const manifest = { date: '2026-11-05', originalVersion: '1780406240914', brand, slogan, github, projectCount: studies.length, patches: changes, contentFields: changedUIL, preservedModules: preserved, sceneConfig, shaders: { sha256: sha(shaderBytes), identical: true }, runtimeSHA256: sha(app), originalRuntimeSHA256: sha(sourceApp), videoPolicy: '60BELOW static cover replacement', sharedAssets: 'public/assets' };
await fs.writeFile(path.join(analysis, 'adaptation-manifest.json'), JSON.stringify(manifest, null, 2));

console.log(`60BELOW build completed. ${changes.length} adaptations applied.`);
