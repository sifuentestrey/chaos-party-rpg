import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createGameServer } from '../server.mjs';
import { createLocalGameMaster } from '../src/local-game-master.mjs';

const playwrightPath = process.env.CHAOS_PLAYWRIGHT_MODULE || '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js';
const imported = await import(pathToFileURL(playwrightPath));
const { chromium } = imported.default || imported;
const output = path.resolve(process.env.CHAOS_EVIDENCE_DIR || 'artifacts/luna-game-night');
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chaos-luna-game-night-'));
fs.mkdirSync(output, { recursive: true });
const errors = [];
const sizes = [];
let app;
let browser;

async function noHorizontalOverflow(page, label) {
  const measurements = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, page: document.documentElement.scrollWidth }));
  sizes.push({ label, ...measurements });
  assert.ok(measurements.page <= measurements.viewport + 1, `${label} horizontal page overflow: ${JSON.stringify(measurements)}`);
}

async function screenshot(page, name) {
  const masks = await page.locator('.recovery').count() ? [page.locator('.recovery')] : [];
  await page.screenshot({ path: path.join(output, name), fullPage: true, mask: masks });
}

try {
  const ai = createLocalGameMaster({ env: { CHAOS_AI: 'off', CHAOS_AI_NARRATION: 'off', CHAOS_AI_ACTION_CONTRACT: 'off' }, dataDir });
  app = await createGameServer({ port: 0, host: '127.0.0.1', dataDir, ai });
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const hostContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const host = await hostContext.newPage();
  host.on('pageerror', (error) => errors.push(`host: ${error.message}`));
  host.on('console', (message) => { if (message.type() === 'error') errors.push(`host console: ${message.text()}`); });
  await host.goto(`http://127.0.0.1:${app.port}/`);
  await noHorizontalOverflow(host, 'home-1280x720');
  await screenshot(host, 'home-1280x720.png');
  await host.locator('[data-action=how]').click();
  await host.locator('dialog').waitFor({ state: 'visible' });
  assert.match(await host.locator('dialog').innerText(), /first valid declaration/i);
  await screenshot(host, 'host-help-dialog-1280x720.png');
  await host.keyboard.press('Escape');
  await host.goto(`http://127.0.0.1:${app.port}/host`);
  await noHorizontalOverflow(host, 'host-create-1280x720');
  await screenshot(host, 'host-create-1280x720.png');
  await host.locator('#reaction-length').selectOption('12000');
  await host.locator('[data-action=createRoom]').click();
  await host.waitForSelector('.room-code');
  await host.locator('[data-action=settings]').click();
  await host.locator('dialog').waitFor({ state: 'visible' });
  assert.ok(await host.locator('dialog [data-host]').count() >= 3, 'host controls dialog exposes existing controls');
  await screenshot(host, 'host-controls-dialog-1280x720.png');
  await host.locator('dialog [data-close]').click();
  const code = (await host.locator('.room-code').innerText()).trim();
  await noHorizontalOverflow(host, 'host-lobby-1280x720');
  await screenshot(host, 'host-lobby-1280x720.png');

  const phones = [];
  for (const [index, viewport] of [[0, { width: 320, height: 568 }], [1, { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(`phone${index + 1}: ${error.message}`));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(`phone${index + 1} console: ${message.text()}`); });
    await page.goto(`http://127.0.0.1:${app.port}/`);
    if (index === 0) {
      await page.locator('[data-action=join]').click();
      await page.locator('#room-code').waitFor({ state: 'visible' });
      await page.locator('[data-action=recover]').click();
      await page.locator('dialog').waitFor({ state: 'visible' });
      assert.ok(await page.locator('#recover-room').isVisible() && await page.locator('#recover-pin').isVisible());
      await screenshot(page, 'phone-recovery-dialog-320x568.png');
      await page.setViewportSize({ width: 568, height: 320 });
      await noHorizontalOverflow(page, 'phone-recovery-dialog-landscape-568x320');
      await screenshot(page, 'phone-recovery-dialog-568x320.png');
      await page.setViewportSize(viewport);
      await page.keyboard.press('Escape');
      await page.locator('#room-code').fill(code);
      await page.locator('#join-form button[type=submit]').click();
      await page.locator('#character-name').waitFor({ state: 'visible' });
    } else {
      await page.goto(`http://127.0.0.1:${app.port}/join?room=${code}`);
    }
    await noHorizontalOverflow(page, `phone${index + 1}-join-${viewport.width}x${viewport.height}`);
    await screenshot(page, `phone${index + 1}-join.png`);
    await page.locator('#character-name').fill(index ? 'Sir Snacks the Magnificent' : 'Jinx');
    await page.locator('[data-action=creatorTab][data-value=role]').click();
    await page.locator('[data-action=enter]').click();
    await page.waitForSelector('.player-card');
    assert.ok(await page.locator('.inventory').isVisible(), 'phone inventory remains visible');
    await noHorizontalOverflow(page, `phone${index + 1}-lobby-${viewport.width}x${viewport.height}`);
    await screenshot(page, `phone${index + 1}-lobby.png`);
    phones.push(page);
  }
  await host.locator('[data-action=startStory]').click();
  await host.waitForTimeout(1200);
  await host.waitForFunction(() => document.body.innerText.includes('ACCEPTING DECLARATIONS'), { timeout: 15000 });
  await phones[0].locator('#action-form button:not([disabled])').waitFor({ state: 'visible', timeout: 15000 });
  await phones[0].locator('#action-text').fill('Ask Marnie about the crown');
  const declarationPending = phones[0].locator('#action-form button').click();
  try {
    await Promise.all([phones[0].waitForFunction(() => document.body.innerText.includes('YOU GOT THERE FIRST'), { timeout: 8000 }), phones[1].waitForSelector('[data-action=react]', { timeout: 8000 })]);
  } catch (error) {
    await screenshot(phones[0], 'debug-phone1-after-declare.png');
    await screenshot(phones[1], 'debug-phone2-after-declare.png');
    await screenshot(host, 'debug-host-after-declare.png');
    const room = app.rooms()[code];
    const diagnostic = { phase: room?.phase, reactionMs: room?.reactionMs, deadlineInMs: room?.turn?.deadline ? room.turn.deadline - Date.now() : null, result: room?.result ? { action: room.result.action, success: room.result.success, reactions: room.result.reactions?.length, phase: room.result.phase } : null, recentEvents: room?.events?.slice(-5).map(({ type, text }) => ({ type, text: text?.slice(0, 100) })), players: room?.players?.map(({ name, connected }) => ({ name, connected })), actorId: room?.turn?.actorId, turnAction: room?.turn?.action, phone1: (await phones[0].locator('body').innerText()).slice(0, 700), phone2: (await phones[1].locator('body').innerText()).slice(0, 700), sceneLabel: await host.locator('.scene-label').innerText() };
    fs.writeFileSync(path.join(output, 'blocked-reaction-diagnostic.json'), JSON.stringify(diagnostic, null, 2));
    throw new Error(`No reaction control appeared: ${JSON.stringify(diagnostic)}`, { cause: error });
  }
  assert.equal(await phones[0].locator('#action-text').count(), 0, 'accepted actor cannot edit or resubmit during reaction');
  assert.match(await phones[0].locator('.controller-status').innerText(), /YOU GOT THERE FIRST/i);
  await phones[1].locator('[data-action=react]').first().click();
  await declarationPending;
  await host.waitForSelector('.dice-result', { timeout: 20000 });
  assert.ok(await host.locator('.dice-result').count(), 'host should show the turn result');
  await noHorizontalOverflow(phones[0], 'phone1-result-390-or-320');
  await noHorizontalOverflow(phones[1], 'phone2-result-390-or-320');
  await screenshot(host, 'host-result-1280x720.png');
  await screenshot(phones[0], 'phone1-result.png');

  await host.setViewportSize({ width: 1920, height: 1080 });
  await host.waitForTimeout(150);
  await noHorizontalOverflow(host, 'host-result-1920x1080');
  await screenshot(host, 'host-result-1920x1080.png');

  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ syntheticOnly: true, liveInference: false, dataDirIsTemporary: true, host: '127.0.0.1', viewports: sizes, pageAndConsoleErrors: errors, state: { declarationAcceptedAndLocked: true, otherControllerReacted: true, dieResultDisplayed: true } }, null, 2));
  assert.deepEqual(errors, [], 'no page errors or browser console errors');
  console.log(`Game-night browser milestone passed: ${sizes.length} layout checks, two independent phone controllers, declaration/reaction/result, no browser errors. Evidence: ${output}`);
} finally {
  if (browser) await browser.close();
  if (app) await app.close();
  fs.rmSync(dataDir, { recursive: true, force: true });
}
