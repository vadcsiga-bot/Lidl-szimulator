import * as THREE from 'three';
import { Joystick } from './joystick.js';
import { buildStore, spawnPickupForProduct, STORE_WIDTH, STORE_DEPTH } from './store.js';
import { buildPlayerCharacter, buildNpcCharacter } from './character.js';
import { GameState, formatTime, WARDROBE_ITEMS, WARDROBE_SLOTS } from './game.js';
import { PRODUCTS } from './products.js';

// ---------- Alap Three.js felállás ----------
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeef1f5);
scene.fog = new THREE.Fog(0xeef1f5, 18, 32);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 100);

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ---------- Állapot ----------
const gameState = new GameState();
let store = null;
let player = null;
let npcs = [];
let activePickups = [];
let colliders = [];
let isGameRunning = false;
let isPaused = false;

const moveInput = { x: 0, y: 0 };
const keysDown = new Set();
let sprintHeld = false;

const clock = new THREE.Clock();

// ---------- DOM referenciák ----------
const el = (id) => document.getElementById(id);
const loadingScreen = el('loading-screen');
const loadingBarFill = el('loading-bar-fill');
const mainMenu = el('main-menu');
const wardrobeScreen = el('wardrobe-screen');
const faqScreen = el('faq-screen');
const hud = el('hud');
const shoppingListItemsEl = el('shopping-list-items');
const cartValueEl = el('cart-value');
const gameTimerEl = el('game-timer');
const cartCapacityEl = el('cart-capacity');
const eventBanner = el('event-banner');
const interactPrompt = el('interact-prompt');
const mobileControls = el('mobile-controls');
const checkoutOverlay = el('checkout-overlay');
const resultsScreen = el('results-screen');

// ---------- Betöltő képernyő szimuláció ----------
function runLoadingSequence(onDone) {
  let progress = 0;
  const tips = [
    'Polcok feltöltése...',
    'Friss zöldségek elrendezése...',
    'Akciós táblák kihelyezése...',
    'Bevásárlókocsik kenése...',
  ];
  const tipEl = el('loading-tip');
  const interval = setInterval(() => {
    progress += 8 + Math.random() * 12;
    tipEl.textContent = tips[Math.floor(Math.random() * tips.length)];
    if (progress >= 100) {
      progress = 100;
      loadingBarFill.style.width = '100%';
      clearInterval(interval);
      setTimeout(onDone, 250);
    } else {
      loadingBarFill.style.width = `${progress}%`;
    }
  }, 180);
}

// ---------- Menü logika ----------
function refreshMenuStats() {
  el('menu-loyalty-points').textContent = gameState.save.loyaltyPoints;
  el('menu-best-score').textContent = gameState.save.bestScore.toLocaleString('hu-HU');
}

function showScreen(screenEl) {
  [mainMenu, wardrobeScreen, faqScreen, checkoutOverlay, resultsScreen].forEach((s) => s.classList.add('hidden'));
  if (screenEl) screenEl.classList.remove('hidden');
}

function renderWardrobe() {
  const list = el('wardrobe-list');
  list.innerHTML = '';

  WARDROBE_SLOTS.forEach(({ key, label }) => {
    const itemsInSlot = WARDROBE_ITEMS.filter((i) => i.slot === key);
    if (itemsInSlot.length === 0) return;

    const groupDiv = document.createElement('div');
    groupDiv.className = 'wardrobe-group';

    const title = document.createElement('div');
    title.className = 'wardrobe-group-title';
    title.textContent = label;
    groupDiv.appendChild(title);

    const itemsDiv = document.createElement('div');
    itemsDiv.className = 'wardrobe-group-items';

    itemsInSlot.forEach((item) => {
      const unlocked = gameState.save.unlockedWardrobe.includes(item.id);
      const equipped = gameState.save.equipped[key] === item.id;
      const div = document.createElement('div');
      div.className = `wardrobe-item ${unlocked ? '' : 'locked'} ${equipped ? 'equipped' : ''}`;

      const swatch = `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#${item.color.toString(16).padStart(6, '0')};margin-right:5px;vertical-align:middle;"></span>`;
      div.innerHTML = unlocked
        ? `${swatch}${item.name}${equipped ? ' ✓' : ''}`
        : `${swatch}${item.name} (${item.cost} pont)`;

      div.addEventListener('click', () => {
        if (!unlocked) {
          if (gameState.unlockWardrobeItem(item.id)) {
            gameState.toggleEquipWardrobeItem(item.id);
            refreshMenuStats();
            renderWardrobe();
          } else {
            flashInsufficientPoints(div);
          }
        } else {
          gameState.toggleEquipWardrobeItem(item.id);
          renderWardrobe();
        }
      });
      itemsDiv.appendChild(div);
    });

    groupDiv.appendChild(itemsDiv);
    list.appendChild(groupDiv);
  });
}

function flashInsufficientPoints(div) {
  const original = div.style.background;
  div.style.background = '#ffd6d6';
  setTimeout(() => { div.style.background = original; }, 350);
}

el('btn-start').addEventListener('click', () => {
  showScreen(null);
  mainMenu.classList.add('hidden');
  startShoppingSession();
});

el('btn-wardrobe').addEventListener('click', () => {
  renderWardrobe();
  showScreen(wardrobeScreen);
});

el('btn-wardrobe-back').addEventListener('click', () => {
  showScreen(mainMenu);
});

el('btn-faq').addEventListener('click', () => {
  showScreen(faqScreen);
});

el('btn-faq-back').addEventListener('click', () => {
  showScreen(mainMenu);
});

el('btn-results-continue').addEventListener('click', () => {
  showScreen(mainMenu);
  refreshMenuStats();
});

// ---------- Bemenet: billentyűzet ----------
window.addEventListener('keydown', (e) => {
  keysDown.add(e.key.toLowerCase());
  if (e.key.toLowerCase() === 'shift') sprintHeld = true;
  if (e.key.toLowerCase() === 'e') tryInteract();
});
window.addEventListener('keyup', (e) => {
  keysDown.delete(e.key.toLowerCase());
  if (e.key.toLowerCase() === 'shift') sprintHeld = false;
});

function keyboardVector() {
  let x = 0, y = 0;
  if (keysDown.has('w') || keysDown.has('arrowup')) y -= 1;
  if (keysDown.has('s') || keysDown.has('arrowdown')) y += 1;
  if (keysDown.has('a') || keysDown.has('arrowleft')) x -= 1;
  if (keysDown.has('d') || keysDown.has('arrowright')) x += 1;
  const len = Math.hypot(x, y);
  if (len > 0) { x /= len; y /= len; }
  return { x, y };
}

// ---------- Mobil vezérlők ----------
let joystick = null;
function setupMobileControls() {
  if (joystick) return;
  joystick = new Joystick(el('joystick-zone'));
  el('btn-interact').addEventListener('touchstart', (e) => { e.preventDefault(); tryInteract(); });
  el('btn-interact').addEventListener('click', () => tryInteract());
  el('btn-sprint').addEventListener('touchstart', (e) => { e.preventDefault(); sprintHeld = true; });
  el('btn-sprint').addEventListener('touchend', (e) => { e.preventDefault(); sprintHeld = false; });
}

// ---------- Bevásárlólista HUD ----------
function renderShoppingList() {
  shoppingListItemsEl.innerHTML = '';
  gameState.shoppingList.forEach((item) => {
    const li = document.createElement('li');
    li.className = item.collected ? 'done' : '';
    li.innerHTML = `<span class="dot"></span>${item.name}`;
    shoppingListItemsEl.appendChild(li);
  });
}

function updateStatsHud() {
  cartValueEl.textContent = gameState.formatCartValue();
  cartCapacityEl.textContent = `${gameState.cartItems.length} / ${gameState.cartCapacity}`;
  gameTimerEl.textContent = formatTime(gameState.elapsedSeconds);
}

// ---------- Vásárlási munkamenet indítása ----------
function clearSceneContents() {
  while (scene.children.length > 0) {
    scene.remove(scene.children[0]);
  }
}

function startShoppingSession() {
  clearSceneContents();
  gameState.reset();
  activePickups = [];
  npcs = [];

  store = buildStore(scene);
  colliders = store.colliders;

  player = buildPlayerCharacter(gameState.getOutfit());
  player.position.copy(store.spawnPosition);
  player.userData.facingAngle = Math.PI;
  scene.add(player);

  spawnNpcs(6);
  spawnShoppingListPickups();

  hud.classList.remove('hidden');
  mobileControls.classList.remove('hidden');
  setupMobileControls();
  renderShoppingList();
  updateStatsHud();
  eventBanner.classList.add('hidden');

  isGameRunning = true;
  isPaused = false;
  gameState.nextEventAt = 12 + Math.random() * 8;
  clock.getDelta();
}

function spawnNpcs(count) {
  for (let i = 0; i < count; i++) {
    const npc = buildNpcCharacter();
    const x = (Math.random() - 0.5) * (STORE_WIDTH - 4);
    const z = (Math.random() - 0.5) * (STORE_DEPTH - 6);
    npc.position.set(x, 0, z);
    npc.userData.target = new THREE.Vector3(x, 0, z);
    npc.userData.speed = 0.6 + Math.random() * 0.4;
    scene.add(npc);
    npcs.push(npc);
  }
}

function pickRandomShelfPosition() {
  const slots = store.shelfSlots;
  const shelf = slots[Math.floor(Math.random() * slots.length)];
  const pos = shelf.userData.position;
  const jitterX = (Math.random() - 0.5) * 2.4;
  return new THREE.Vector3(pos.x + jitterX, 0, pos.z + 0.7);
}

function spawnShoppingListPickups() {
  gameState.shoppingList.forEach((item) => {
    const position = pickRandomShelfPosition();
    const pickup = spawnPickupForProduct(scene, item, position);
    pickup.id = item.id;
    activePickups.push(pickup);
  });
}

function spawnDealEvent() {
  const dealPool = PRODUCTS.filter((p) => p.isDeal);
  const deal = dealPool[Math.floor(Math.random() * dealPool.length)];
  const position = pickRandomShelfPosition();
  const pickup = spawnPickupForProduct(scene, deal, position);
  pickup.id = `event-${deal.id}-${Date.now()}`;
  pickup.isEvent = true;
  pickup.expiresAt = gameState.elapsedSeconds + 9;
  activePickups.push(pickup);

  eventBanner.textContent = `⚡ AKCIÓS ROHAM: ${deal.name}! Siess!`;
  eventBanner.classList.remove('hidden');
  gameState.activeEventPickup = pickup;
}

function clearExpiredEvent() {
  eventBanner.classList.add('hidden');
  gameState.activeEventPickup = null;
}

// ---------- Interakció / felvétel ----------
let nearestPickup = null;

function tryInteract() {
  if (!nearestPickup || nearestPickup.taken) return;
  const result = gameState.collectProduct(nearestPickup.product);
  if (!result.success) {
    flashEventBanner('A kosarad megtelt! Menj a pénztárhoz.');
    return;
  }
  nearestPickup.taken = true;
  scene.remove(nearestPickup.mesh);
  activePickups = activePickups.filter((p) => p !== nearestPickup);

  if (nearestPickup.isEvent) {
    gameState.addLoyaltyPoints(15);
    clearExpiredEvent();
  }

  renderShoppingList();
  updateStatsHud();
  interactPrompt.classList.add('hidden');
  nearestPickup = null;

  if (result.listCompleted) {
    flashEventBanner('Lista kész! Irány a pénztár! 🛒');
  }
}

function flashEventBanner(text, duration = 2500) {
  eventBanner.textContent = text;
  eventBanner.classList.remove('hidden');
  clearTimeout(flashEventBanner._t);
  flashEventBanner._t = setTimeout(() => {
    if (!gameState.activeEventPickup) eventBanner.classList.add('hidden');
  }, duration);
}

// ---------- Ütközésvizsgálat (egyszerű AABB) ----------
const playerRadius = 0.35;
function resolveCollision(nextPos) {
  const playerBox = new THREE.Box3(
    new THREE.Vector3(nextPos.x - playerRadius, 0, nextPos.z - playerRadius),
    new THREE.Vector3(nextPos.x + playerRadius, 2, nextPos.z + playerRadius)
  );
  for (const box of colliders) {
    if (playerBox.intersectsBox(box)) {
      return false;
    }
  }
  return true;
}

// ---------- Fő játékhurok ----------
const cameraOffset = new THREE.Vector3(0, 4.2, 6.2);
const cameraLookOffset = new THREE.Vector3(0, 1.2, 0);

function updatePlayer(delta) {
  const kb = keyboardVector();
  const jx = joystick ? joystick.value.x : 0;
  const jy = joystick ? joystick.value.y : 0;

  let x = kb.x !== 0 || kb.y !== 0 ? kb.x : jx;
  let y = kb.x !== 0 || kb.y !== 0 ? kb.y : jy;

  const len = Math.hypot(x, y);
  if (len > 1) { x /= len; y /= len; }

  moveInput.x = x;
  moveInput.y = y;

  if (len > 0.05) {
    const speed = (sprintHeld ? 4.6 : 2.8) * delta;
    const nextX = player.position.x + x * speed;
    const nextZ = player.position.z + y * speed;

    const targetAngle = Math.atan2(x, y) + Math.PI;
    player.userData.facingAngle = smoothAngle(player.userData.facingAngle, targetAngle, delta * 8);
    player.rotation.y = player.userData.facingAngle;

    if (resolveCollision(new THREE.Vector3(nextX, 0, player.position.z))) {
      player.position.x = nextX;
    }
    if (resolveCollision(new THREE.Vector3(player.position.x, 0, nextZ))) {
      player.position.z = nextZ;
    }

    const halfW = STORE_WIDTH / 2 - 0.6;
    const halfD = STORE_DEPTH / 2 - 0.6;
    player.position.x = THREE.MathUtils.clamp(player.position.x, -halfW, halfW);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -halfD, halfD);
  }
}

function smoothAngle(current, target, t) {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * Math.min(t, 1);
}

function updateCamera(delta) {
  const targetPos = new THREE.Vector3(
    player.position.x + cameraOffset.x,
    player.position.y + cameraOffset.y,
    player.position.z + cameraOffset.z
  );
  camera.position.lerp(targetPos, Math.min(delta * 4, 1));
  const lookAt = new THREE.Vector3().copy(player.position).add(cameraLookOffset);
  camera.lookAt(lookAt);
}

function updateNpcs(delta) {
  npcs.forEach((npc) => {
    const dir = new THREE.Vector3().subVectors(npc.userData.target, npc.position);
    dir.y = 0;
    const dist = dir.length();
    if (dist < 0.3) {
      const x = (Math.random() - 0.5) * (STORE_WIDTH - 4);
      const z = (Math.random() - 0.5) * (STORE_DEPTH - 6);
      npc.userData.target.set(x, 0, z);
    } else {
      dir.normalize();
      npc.position.x += dir.x * npc.userData.speed * delta;
      npc.position.z += dir.z * npc.userData.speed * delta;
      npc.rotation.y = Math.atan2(dir.x, dir.z);
    }
  });
}

function updatePickups(delta) {
  nearestPickup = null;
  let nearestDist = 1.6;

  activePickups.forEach((pickup) => {
    pickup.mesh.rotation.y += delta * pickup.mesh.userData.spinSpeed;
    pickup.mesh.position.y = 1.1 + Math.sin(clock.elapsedTime * 2 + pickup.mesh.userData.bobOffset) * 0.08;

    const dist = pickup.mesh.position.distanceTo(player.position);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestPickup = pickup;
    }

    if (pickup.isEvent && gameState.elapsedSeconds > pickup.expiresAt) {
      scene.remove(pickup.mesh);
      activePickups = activePickups.filter((p) => p !== pickup);
      if (gameState.activeEventPickup === pickup) clearExpiredEvent();
    }
  });

  if (nearestPickup) {
    interactPrompt.classList.remove('hidden');
  } else {
    interactPrompt.classList.add('hidden');
  }
}

function checkCheckoutProximity() {
  if (!store) return;
  const nearCheckout = store.checkoutPositions.some(
    (pos) => pos.distanceTo(player.position) < 1.8
  );
  if (nearCheckout && gameState.cartItems.length > 0 && !isPaused) {
    beginCheckout();
  }
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);

  if (isGameRunning && !isPaused) {
    gameState.elapsedSeconds += delta;
    updatePlayer(delta);
    updateCamera(delta);
    updateNpcs(delta);
    updatePickups(delta);
    checkCheckoutProximity();
    updateStatsHud();

    if (gameState.elapsedSeconds > gameState.nextEventAt && !gameState.activeEventPickup) {
      spawnDealEvent();
      gameState.nextEventAt = gameState.elapsedSeconds + 18 + Math.random() * 10;
    }
  }

  renderer.render(scene, camera);
}

// ---------- Pénztár mini-game ----------
function beginCheckout() {
  isPaused = true;
  showScreen(checkoutOverlay);
  el('checkout-result').textContent = '';

  const marker = el('checkout-marker');
  let pos = 0;
  let dir = 1;
  let hits = 0;
  const totalNeeded = Math.max(3, Math.min(6, gameState.cartItems.length));
  let running = true;

  function step() {
    if (!running) return;
    pos += dir * 1.6;
    if (pos >= 100) { pos = 100; dir = -1; }
    if (pos <= 0) { pos = 0; dir = 1; }
    marker.style.left = `${pos}%`;
    requestAnimationFrame(step);
  }
  step();

  function onHit() {
    const inGreen = pos >= 40 && pos <= 60;
    if (inGreen) {
      hits++;
      el('checkout-result').textContent = `Talált! (${hits}/${totalNeeded})`;
    } else {
      el('checkout-result').textContent = 'Majdnem! Próbáld újra.';
    }
    if (hits >= totalNeeded) {
      running = false;
      finishCheckout(hits, totalNeeded);
    }
  }

  const btn = el('btn-checkout-hit');
  btn.onclick = onHit;
}

function finishCheckout(hits, totalNeeded) {
  const bonus = hits * 8;
  gameState.addLoyaltyPoints(bonus);
  gameState.updateBestScore(gameState.cartValue);

  const breakdown = el('results-breakdown');
  breakdown.innerHTML = `
    <div class="row"><span>Kosár értéke</span><span>${gameState.formatCartValue()}</span></div>
    <div class="row"><span>Idő</span><span>${formatTime(gameState.elapsedSeconds)}</span></div>
    <div class="row"><span>Gyorspénztár bónusz</span><span>+${bonus} hűségpont</span></div>
    <div class="row total"><span>Összesen</span><span>${gameState.formatCartValue()}</span></div>
  `;

  isGameRunning = false;
  setTimeout(() => {
    showScreen(resultsScreen);
    hud.classList.add('hidden');
    mobileControls.classList.add('hidden');
  }, 400);
}

// ---------- Indítás ----------
loadingBarFill.style.width = '0%';
runLoadingSequence(() => {
  loadingScreen.classList.add('hidden');
  refreshMenuStats();
  showScreen(mainMenu);
});

animate();
