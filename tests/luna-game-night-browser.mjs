import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createGameServer } from '../server.mjs';
import { createLocalGameMaster } from '../src/local-game-master.mjs';
import { createHost, joinPlayer } from './colyseus-helpers.mjs';
import { skipBrowserTimer } from './browser-timers.mjs';

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
  await page.screenshot({ path: path.join(output, name), fullPage: true, mask: masks, maskColor: "#282131" });
}

try {
  const ai = createLocalGameMaster({ env: { CHAOS_AI: 'off', CHAOS_AI_NARRATION: 'off', CHAOS_AI_ACTION_CONTRACT: 'off' }, dataDir });
  app = await createGameServer({ port: 0, host: '127.0.0.1', dataDir, ai });
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const failedBootContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const failedBoot = await failedBootContext.newPage();
  let appRequestAborted = false;
  const bootEvents = [];
  failedBoot.on('console', message => bootEvents.push(message.text()));
  failedBoot.on('pageerror', error => bootEvents.push(error.message));
  failedBoot.on('requestfailed', request => bootEvents.push(`failed: ${request.url()}`));
  await failedBoot.route('**/app.js', route => { appRequestAborted = true; return route.abort(); });
  await failedBoot.goto(`http://127.0.0.1:${app.port}/`);
  try { await failedBoot.getByText('The tavern did not open').waitFor({ timeout: 3000 }); } catch (error) { throw new Error(`Boot handler did not render (intercepted=${appRequestAborted}; events=${JSON.stringify(bootEvents)}; body=${(await failedBoot.locator('body').innerText()).slice(0,300)})`, { cause: error }); }
  await failedBootContext.close();

  const hostContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const host = await hostContext.newPage();
  host.on('pageerror', (error) => errors.push(`host: ${error.message}`));
  host.on('console', (message) => { if (message.type() === 'error') errors.push(`host console: ${message.text()}`); });
  await host.goto(`http://127.0.0.1:${app.port}/`);
  await noHorizontalOverflow(host, 'home-1280x720');
  await screenshot(host, 'home-1280x720.png');
  await host.keyboard.press('Tab');
  assert.ok(await host.evaluate(() => document.activeElement.matches(':focus-visible') && parseFloat(getComputedStyle(document.activeElement).outlineWidth) >= 3), 'keyboard focus has a visible outline');
  await host.emulateMedia({ reducedMotion: 'reduce' });
  await host.evaluate(() => { const el = document.createElement('span'); el.className = 'loading-die'; document.body.append(el); });
  assert.ok(await host.locator('.loading-die').evaluate(el => parseFloat(getComputedStyle(el).animationDuration) < 0.001), 'decorative animation respects reduced motion');
  await host.locator('.loading-die').evaluate(el => el.remove());
  await host.emulateMedia({ reducedMotion: 'no-preference' });
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
    const nameInput = page.locator('#character-name');
    await nameInput.fill('Moss the Incredibly Long Yet Entirely Memorable Adventurer');
    await noHorizontalOverflow(page, `phone${index + 1}-long-name-${viewport.width}x${viewport.height}`);
    await nameInput.fill(index ? 'Sir Snacks the Magnificent' : 'Jinx');
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

  const roomState = () => app.rooms()[code];
  const waitForPhase = async phase => {
    const end = Date.now() + 12000;
    while (roomState()?.phase !== phase) {
      if (Date.now() > end) throw new Error(`Timed out waiting for ${phase}; found ${roomState()?.phase}`);
      await new Promise(resolve => setTimeout(resolve, 40));
    }
  };
  const takeTurn = async (page, declaration) => {
    if (['react', 'reveal'].includes(roomState().phase)) await skipBrowserTimer(host, roomState);
    await waitForPhase('open');
    await page.locator('#action-text').fill(declaration);
    await page.locator('#action-form button').click();
    await waitForPhase('react');
    await skipBrowserTimer(host, roomState);
    await waitForPhase('reveal');
    await skipBrowserTimer(host, roomState);
    await waitForPhase('open');
    return roomState().result;
  };
  await takeTurn(phones[0], 'Travel to clearing');
  assert.equal(roomState().world.expedition.current, 'clearing', 'the existing clearing travel command resolves');
  await noHorizontalOverflow(host, 'clearing-1280x720');
  await screenshot(host, 'clearing-1280x720.png');
  assert.match(await host.locator('.scene-toolbar .location').innerText(), /Clearing/i);
  assert.match(await phones[0].locator('.controller-story').innerText(), /Chapter 1|keepsake|wayfarer/i);
  await takeTurn(phones[1], 'Travel to ruins');
  assert.equal(roomState().world.expedition.current, 'ruins', 'the second independent phone can travel to the existing ruins');
  await noHorizontalOverflow(host, 'ruins-1280x720');
  await screenshot(host, 'ruins-1280x720.png');
  assert.match(await host.locator('.scene-toolbar .location').innerText(), /Ruins/i);
  await takeTurn(phones[0], 'Travel to clearing');
  assert.equal(roomState().world.expedition.current, 'clearing', 'the party can return to its prior area');
  await takeTurn(phones[1], 'Travel to tavern');
  assert.equal(roomState().world.expedition.current, 'tavern', 'the party can return to the tavern');

  // Two independent phone pages complete the generated supported chapter.
  await takeTurn(phones[0], 'Travel to clearing');
  const quest = roomState().world.expedition.regions.clearing.quest;
  assert.ok(['recover', 'rescue', 'restore'].includes(quest.kind), 'clearing uses a supported authored quest');
  const talk = await takeTurn(phones[1], 'Talk to ' + quest.patronId);
  assert.ok(talk && !talk.blocked, 'second phone completes the quest introduction');
  let befriended = false;
  for (let attempt = 0; attempt < 24 && !befriended; attempt++) befriended = !!(await takeTurn(phones[0], 'Befriend ' + quest.threatId))?.success;
  assert.equal(roomState().world.expedition.creatures[quest.threatId].attitude, 'friendly');
  let returnedItem;
  if (quest.kind === 'rescue') {
    const cloth = Object.values(roomState().world.expedition.items).find(item => item.location === 'clearing' && item.material === 'cloth');
    assert.ok(cloth, 'rescue quest has its authored treatment cloth');
    await takeTurn(phones[0], 'Take ' + cloth.id);
    await takeTurn(phones[1], 'Bandage ' + quest.patronId);
  } else if (quest.kind === 'restore') {
    await takeTurn(phones[1], 'Repair ' + quest.gateId);
  } else {
    let opened = false;
    for (let attempt = 0; attempt < 24 && !opened; attempt++) opened = !!(await takeTurn(phones[1], 'Open ' + quest.chestId))?.success;
    assert.equal(roomState().world.expedition.items[quest.chestId].open, true);
    await takeTurn(phones[0], 'Take ' + quest.relicId);
    await takeTurn(phones[1], 'Take item-5');
    const crafterId = roomState().players.find(player => player.name === 'Jinx').id;
    await takeTurn(phones[1], 'Give item-5 to ' + crafterId);
    let crafted = false;
    for (let attempt = 0; attempt < 24 && !crafted; attempt++) crafted = !!(await takeTurn(phones[0], 'Make a ridiculous heirloom hat from ' + quest.relicId + ' and item-5'))?.success;
    const heirloom = Object.values(roomState().world.expedition.items).find(item => item.name === 'ridiculous heirloom hat');
    assert.ok(crafted && heirloom, 'party crafts an item containing the recovered keepsake');
    await takeTurn(phones[0], 'Give ' + heirloom.id + ' to ' + quest.patronId);
    returnedItem = heirloom.id;
  }
  assert.equal(roomState().world.expedition.regions.clearing.quest.status, 'completed', JSON.stringify({ kind: quest.kind, steps: roomState().world.expedition.regions.clearing.quest.steps, relic: roomState().world.expedition.items[quest.relicId], patron: roomState().world.expedition.creatures[quest.patronId] }));
  await host.waitForFunction(() => document.body.innerText.includes('This chapter is complete.'));
  await noHorizontalOverflow(host, 'completed-clearing-1280x720');
  await screenshot(host, 'completed-clearing-1280x720.png');
  await noHorizontalOverflow(phones[0], 'completed-quest-phone-320x568');
  await screenshot(phones[0], 'completed-quest-phone-320x568.png');
  await noHorizontalOverflow(phones[1], 'completed-quest-phone-390x844');
  await screenshot(phones[1], 'completed-quest-phone-390x844.png');
  await takeTurn(phones[0], 'Travel to ruins');
  await takeTurn(phones[1], 'Travel to clearing');
  if (returnedItem) assert.equal(roomState().world.expedition.items[returnedItem].ownerId, quest.patronId, 'the keepsake remains with its recipient on revisit');
  await host.waitForFunction(() => document.body.innerText.includes('This chapter is complete.'));
  await screenshot(host, 'quest-revisit-1280x720.png');
  const savedItem = returnedItem ? structuredClone(roomState().world.expedition.items[returnedItem]) : null;
  const port = app.port;
  await app.close();
  app = await createGameServer({ port, host: '127.0.0.1', dataDir, ai });
  const resumedHost = await createHost(app, { resumeCode: code });
  const token = app.store.rooms[code].players.find(player => player.name === 'Jinx').token;
  const rejoined = await joinPlayer(app, resumedHost.room.roomId, { token });
  assert.equal(rejoined.identity.room.world.expedition.regions.clearing.quest.status, 'completed');
  if (returnedItem) assert.deepEqual(rejoined.identity.room.world.expedition.items[returnedItem], savedItem);
  assert.equal(rejoined.identity.room.world.expedition.creatures[quest.threatId].attitude, 'friendly');
  await rejoined.room.leave(true);

  await host.setViewportSize({ width: 1920, height: 1080 });
  await host.waitForTimeout(150);
  await noHorizontalOverflow(host, 'host-result-1920x1080');
  await screenshot(host, 'host-result-1920x1080.png');

  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ syntheticOnly: true, liveInference: false, dataDirIsTemporary: true, host: '127.0.0.1', viewports: sizes, pageAndConsoleErrors: errors, state: { declarationAcceptedAndLocked: true, otherControllerReacted: true, dieResultDisplayed: true, twoControllerQuestCompleted: true, questRevisit: true, serverRestart: true } }, null, 2));
  assert.deepEqual(errors, [], 'no page errors or browser console errors');
  console.log(`Game-night browser milestone passed: ${sizes.length} layout checks, two independent phone controllers, declaration/reaction/result, no browser errors. Evidence: ${output}`);
} finally {
  // Stop reconnecting clients at the server before closing browser contexts.
  if (app) await app.close();
  if (browser) await browser.close();
  fs.rmSync(dataDir, { recursive: true, force: true });
}
