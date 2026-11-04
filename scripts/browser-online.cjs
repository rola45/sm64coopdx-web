const {chromium} = require('../.tools/qa/node_modules/playwright');
const assert = require('node:assert/strict');

const base = process.env.COOP_TEST_URL || 'http://127.0.0.1:8765/';
const rom = process.argv[2];
const timeout = 90000;

async function verify() {
  const browser = await chromium.launch({
    args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
  });
  try {
    async function launch(url, mobile = false) {
      const page = await browser.newPage(mobile ?
        {viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true} : {});
      await page.goto(url);
      if (rom) await page.locator('#rom').setInputFiles(rom);
      await page.locator('#start').click();
      try {
        await page.locator('#game-controls').waitFor({timeout});
      } catch (error) {
        console.error(await page.locator('#status').textContent());
        console.error(await page.locator('#log').textContent());
        throw error;
      }
      return page;
    }

    async function joined(page) {
      await page.waitForFunction(() => runtime._web_session_state() % 256 === 2, null,
        {timeout, polling: 100});
      return page.evaluate(() => runtime._web_session_state() >> 8);
    }

    const host = await launch(base);
    const guest = await launch(base, true);
    assert.equal(await host.evaluate(() => runtime.coopTransport.id), 1);
    assert.equal(await guest.evaluate(() => runtime.coopTransport.id), 2);
    const [hostLevel, guestLevel] = await Promise.all([joined(host), joined(guest)]);
    assert.ok(hostLevel > 0);
    assert.equal(hostLevel, guestLevel);
    await guest.locator('#online-menu').click();
    assert.equal(await guest.locator('#online-status').textContent(), 'Sala pública');
    assert.ok(await guest.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await guest.close();
    console.log('Public room: two engines joined level', hostLevel);

    await host.locator('#online-menu').click();
    await host.locator('#invite-room').click();
    const invite = host.locator('#invite-link');
    await invite.waitFor();
    const link = await invite.inputValue();
    assert.match(new URL(link).searchParams.get('room'), /^[a-f0-9]{32}$/);
    const friend = await launch(link);
    assert.equal(await friend.evaluate(() => runtime.coopTransport.id), 2);
    assert.equal(await joined(friend), await joined(host));
    await friend.locator('#online-menu').click();
    await friend.locator('#solo-room').click();
    await friend.waitForFunction(() => !runtime.coopTransport && runtime._web_session_state() % 256 === 1);
    assert.equal(await friend.locator('#online-status').textContent(), 'Jugando solo');
    console.log('Private room: invite joined and guest switched to solo');
  } finally {
    await browser.close();
  }
}

verify().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
