const { chromium } = require('C:/Users/gamer/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path = require('path');
const { pathToFileURL } = require('url');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(path.resolve('outputs/index.html')).href);
  for (const [width, height] of [[1366,768],[1920,1080],[1280,720]]) {
    await page.setViewportSize({width,height});
    const bounds = await page.locator('canvas').boundingBox();
    if (bounds.x < 0 || bounds.y < 0 || bounds.x + bounds.width > width + 1 || bounds.y + bounds.height > height + 1 || Math.abs(bounds.x + bounds.width / 2 - width / 2) > 1) throw Error('Canvas fit or centering failed');
  }
  await page.setViewportSize({width:1366,height:768});
  await page.screenshot({path:'work/ui-start.png'});
  await page.keyboard.press('Enter');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(150);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.press('Space');
  await page.evaluate(() => { score = 123400; wave = 4; player.health = 2; waveAnnouncementRemaining = 0; });
  await page.screenshot({path:'work/ui-playing.png'});
  await page.evaluate(() => { invulnerabilityRemaining = 0; player.health = 1; damagePlayer(); });
  await page.screenshot({path:'work/ui-game-over.png'});
  await page.keyboard.press('r');
  const reset = await page.evaluate(() => gameState === GameState.PLAYING && score === 0 && wave === 1 && player.health === 3 && enemies.length === 7);
  if (!reset || errors.length) throw Error(JSON.stringify({reset,errors}));
  console.log('Browser layouts, movement, firing, game over, restart, and console checks passed.');
  await browser.close();
})();
