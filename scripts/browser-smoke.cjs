// Isolated browser QA; only the caller-selected local ROM is loaded.
const { chromium } = require('../.tools/qa/node_modules/playwright');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({headless: true});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000}});
    const events = [];
    page.on('console', msg => events.push({type:msg.type(),text:msg.text()}));
    page.on('pageerror', error => events.push({type:'pageerror',text:error.message}));
    await page.goto('http://127.0.0.1:8765/', {waitUntil:'networkidle'});
    await page.screenshot({path:'reports/desktop-launcher.png',fullPage:true});
    await page.setViewportSize({width:375,height:812});
    await page.screenshot({path:'reports/mobile-launcher.png',fullPage:true});
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (overflow) throw Error('Horizontal overflow at 375px');
    await page.setViewportSize({width:1440,height:1000});
    if (process.argv[2] || process.env.SM64_LOCAL_ROM === '1') {
      if (process.argv[2]) await page.locator('#rom').setInputFiles(process.argv[2]);
      await page.locator('#start').click();
      await page.waitForTimeout(15000);
      await page.screenshot({path:'reports/runtime-smoke.png',fullPage:true});
      if (process.env.SM64_CHECK_MENU === '1') {
        const canvas = page.locator('#canvas');
        const bounds = await canvas.boundingBox();
        await canvas.click({delay:120,position:{x:bounds.width*0.637,y:bounds.height*0.393}});
        await page.waitForTimeout(1800);
        await canvas.click({delay:120,position:{x:bounds.width*0.5,y:bounds.height*0.668}});
        await page.waitForTimeout(900);
        await canvas.screenshot({path:'reports/menu-smoke.png'});
        if (process.env.SM64_CHECK_SOLO === '1') {
          const y = Number(process.env.SM64_SOLO_Y);
          if (!Number.isFinite(y) || y <= 0 || y >= 1) throw Error('Set SM64_SOLO_Y from the observed menu.');
          await canvas.click({delay:120,position:{x:bounds.width*0.5,y:bounds.height*y}});
          await page.waitForTimeout(34000);
          for (let i = 0; i < 3; i++) {
            await page.keyboard.press('l', {delay:120});
            await page.waitForTimeout(450);
          }
          await canvas.screenshot({path:'reports/solo-smoke.png'});
          await page.keyboard.down('w');
          await page.waitForTimeout(700);
          await page.keyboard.up('w');
          await page.keyboard.down('l');
          await page.waitForTimeout(220);
          await page.keyboard.up('l');
          await canvas.screenshot({path:'reports/solo-input.png'});
        }
      }
    }
    let storage;
    if (process.env.SM64_CHECK_STORAGE === '1') {
      await page.waitForFunction(() => document.querySelector('#save-status').textContent.includes('Cambios guardados'));
      const keys = await page.evaluate(async () => {
        const db = await storageRequest(indexedDB.open('sm64coopdx-web', 1));
        try { return await storageRequest(db.transaction('files').objectStore('files').getAllKeys()); }
        finally { db.close(); }
      });
      if (!keys.includes('sm64config.txt') || keys.some(key => !['sm64config.txt','sm64_save_file.bin'].includes(key))) {
        throw Error('Expected only explicitly allowed game files in IndexedDB');
      }
      await page.reload({waitUntil:'networkidle'});
      if (process.argv[2]) await page.locator('#rom').setInputFiles(process.argv[2]);
      await page.locator('#start').click();
      await page.waitForFunction(() => document.querySelector('#status').textContent.startsWith('Motor en ejecución'));
      const log = await page.locator('#log').textContent();
      if (log.includes("Config file 'sm64config.txt' not found")) throw Error('Persisted config was not hydrated');
      storage = {keys, configRestored:true};
    }
    if (process.env.SM64_CHECK_AV === '1') {
      const measure = page.evaluate(async () => {
        const {audioContext: context, audio} = runtime.SDL2;
        const firstFrame = runtime._web_frame_count();
        const startTime = performance.now();
        let peak = 0;
        let callbacks = 0;
        function inspect(event) {
          callbacks++;
          for (const sample of event.outputBuffer.getChannelData(0)) {
            peak = Math.max(peak, Math.abs(sample));
          }
        }
        audio.scriptProcessorNode.addEventListener('audioprocess', inspect);
        try {
          await new Promise(resolve => setTimeout(resolve, 3000));
          return {
            ticksPerSecond: (runtime._web_frame_count() - firstFrame) * 1000 / (performance.now() - startTime),
            audioState: context.state,
            callbacks,
            peak,
          };
        } finally {
          audio.scriptProcessorNode.removeEventListener('audioprocess', inspect);
        }
      });
      await page.waitForTimeout(250);
      await page.keyboard.press('l', {delay:150});
      const av = await measure;
      console.log(JSON.stringify(av));
      if (av.ticksPerSecond < 27 || av.ticksPerSecond > 33 || av.audioState !== 'running' || av.peak < 0.0001) {
        throw Error('Expected 30 Hz simulation and non-silent Web Audio output');
      }
    }
    const diagnostics = await page.evaluate(() => typeof runtime === 'undefined' || !runtime ? null : {phase: runtime._web_phase?.(), frames: runtime._web_frame_count?.(), width: document.querySelector('#canvas').width, height: document.querySelector('#canvas').height, log: document.querySelector('#log').textContent});
    const result = {diagnostics,storage,status:await page.locator('#status').textContent(), mobileOverflow:overflow, events};
    fs.writeFileSync('reports/browser-smoke.json',JSON.stringify(result,null,2));
    console.log(JSON.stringify({status:result.status,events:events.length,mobileOverflow:overflow}));
    if (events.some(e=>e.type==='pageerror')) process.exitCode=1;
    if ((process.argv[2] || process.env.SM64_LOCAL_ROM === '1') && (diagnostics?.phase !== 7 || diagnostics?.frames < 1 || /FATAL ERROR|shader compilation failed/i.test(diagnostics?.log ?? ''))) throw Error('Engine failed to render without fatal errors');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
