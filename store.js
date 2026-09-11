import * as THREE from 'three';
import { PRODUCTS, CATEGORIES } from './products.js';

const STORE_WIDTH = 26;
const STORE_DEPTH = 30;

function makeFloorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f2efe6';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#dcd7c8';
  ctx.lineWidth = 3;
  for (let i = 0; i <= 256; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(STORE_WIDTH / 2, STORE_DEPTH / 2);
  return texture;
}

function makeLabelSprite(text, bgColor = '#0050aa') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.roundRect(0, 0, 512, 128, 24);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 68);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(3.2, 0.8, 1);
  return sprite;
}

// Egy polcegység létrehozása: fém váz + 3 szintnyi színes "termékdoboz"
function buildShelfUnit(products, categoryLabel) {
  const group = new THREE.Group();

  const frameMat = new THREE.MeshStandardMaterial({ color: 0xb0b0b8, metalness: 0.4, roughness: 0.6 });
  const shelfWidth = 3.4;
  const shelfDepth = 0.9;
  const shelfHeight = 1.9;

  // Váz oldalai
  [-shelfWidth / 2, shelfWidth / 2].forEach((xOff) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, shelfHeight, shelfDepth), frameMat);
    post.position.set(xOff, shelfHeight / 2, 0);
    post.castShadow = true;
    group.add(post);
  });

  const tierHeights = [0.4, 1.0, 1.6];
  tierHeights.forEach((h, tierIdx) => {
    const shelfPlank = new THREE.Mesh(new THREE.BoxGeometry(shelfWidth, 0.06, shelfDepth), frameMat);
    shelfPlank.position.set(0, h, 0);
    shelfPlank.castShadow = true;
    shelfPlank.receiveShadow = true;
    group.add(shelfPlank);

    // Termékdobozok az adott szinten
    const boxesOnTier = 4;
    for (let i = 0; i < boxesOnTier; i++) {
      const product = products[(tierIdx * boxesOnTier + i) % products.length];
      if (!product) continue;
      const boxW = shelfWidth / boxesOnTier - 0.08;
      const boxGeo = new THREE.BoxGeometry(boxW, 0.35, shelfDepth * 0.8);
      const boxMat = new THREE.MeshStandardMaterial({ color: product.color, roughness: 0.7 });
      const box = new THREE.Mesh(boxGeo, boxMat);
      const xPos = -shelfWidth / 2 + boxW / 2 + 0.08 + i * (shelfWidth / boxesOnTier);
      box.position.set(xPos, h + 0.2, 0);
      box.castShadow = true;
      box.userData.isDecorative = true;
      group.add(box);
    }
  });

  // Kategória tábla a polc tetején
  if (categoryLabel) {
    const label = makeLabelSprite(categoryLabel, '#0050aa');
    label.position.set(0, shelfHeight + 0.6, 0);
    group.add(label);
  }

  return group;
}

function buildPickupMarker(product) {
  const group = new THREE.Group();
  const geo = new THREE.IcosahedronGeometry(0.22, 0);
  const mat = new THREE.MeshStandardMaterial({
    color: product.color,
    emissive: product.isDeal ? 0xdd0741 : 0x333300,
    emissiveIntensity: product.isDeal ? 0.6 : 0.3,
    metalness: 0.2,
    roughness: 0.4,
  });
  const gem = new THREE.Mesh(geo, mat);
  gem.castShadow = true;
  group.add(gem);

  const ringGeo = new THREE.RingGeometry(0.35, 0.42, 24);
  const ringMat = new THREE.MeshBasicMaterial({
    color: product.isDeal ? 0xdd0741 : 0xffd100,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -0.55;
  group.add(ring);

  const priceTag = makeLabelSprite(`${product.price} Ft`, product.isDeal ? '#dd0741' : '#0050aa');
  priceTag.scale.set(1.1, 0.28, 1);
  priceTag.position.y = 0.55;
  group.add(priceTag);

  group.userData = { spinSpeed: 1.2 + Math.random() * 0.6, bobOffset: Math.random() * Math.PI * 2 };
  return group;
}

export function buildStore(scene) {
  const colliders = []; // THREE.Box3 lista az ütközéshez
  const pickupPoints = []; // { mesh, product, id, taken }

  // --- Padló ---
  const floorGeo = new THREE.PlaneGeometry(STORE_WIDTH, STORE_DEPTH);
  const floorMat = new THREE.MeshStandardMaterial({ map: makeFloorTexture(), roughness: 0.9 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // --- Falak (hátul + oldalt, elöl nyitott bejárat) ---
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xe8e4d8 });
  const wallHeight = 4;

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(STORE_WIDTH, wallHeight, 0.3), wallMat);
  backWall.position.set(0, wallHeight / 2, -STORE_DEPTH / 2);
  backWall.receiveShadow = true;
  scene.add(backWall);
  colliders.push(new THREE.Box3().setFromObject(backWall));

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, wallHeight, STORE_DEPTH), wallMat);
  leftWall.position.set(-STORE_WIDTH / 2, wallHeight / 2, 0);
  scene.add(leftWall);
  colliders.push(new THREE.Box3().setFromObject(leftWall));

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, wallHeight, STORE_DEPTH), wallMat);
  rightWall.position.set(STORE_WIDTH / 2, wallHeight / 2, 0);
  scene.add(rightWall);
  colliders.push(new THREE.Box3().setFromObject(rightWall));

  // Bejárati felirat - a jobb szélső pénztártól jobbra, szabad sávban
  const ENTRANCE_X = 10;
  const entranceSign = makeLabelSprite('BEJÁRAT', '#ffd100');
  entranceSign.material.map.needsUpdate = true;
  entranceSign.position.set(ENTRANCE_X, 3, STORE_DEPTH / 2 - 0.5);
  scene.add(entranceSign);

  // --- Polcsorok kialakítása (3 sor, soronként 3 egység) ---
  const categoryKeys = Object.keys(CATEGORIES);
  const rowZPositions = [-8, -2, 4];
  const aisleXPositions = [-7.5, 0, 7.5];

  let categoryCursor = 0;
  rowZPositions.forEach((rowZ) => {
    aisleXPositions.forEach((aisleX) => {
      const catKey = categoryKeys[categoryCursor % categoryKeys.length];
      categoryCursor++;
      const catProducts = PRODUCTS.filter((p) => p.category === catKey);
      const shelf = buildShelfUnit(catProducts, CATEGORIES[catKey].label);
      shelf.position.set(aisleX, 0, rowZ);
      scene.add(shelf);
      const box = new THREE.Box3().setFromObject(shelf);
      // Kicsit szűkítjük a collidert, hogy ne legyen túl akadékoskodó
      colliders.push(box);

      shelf.userData.categoryKey = catKey;
      shelf.userData.position = { x: aisleX, z: rowZ };
    });
  });

  // --- Pénztár pultok elöl ---
  const checkoutMat = new THREE.MeshStandardMaterial({ color: 0xffd100 });
  const checkoutPositions = [-6, 0, 6];
  checkoutPositions.forEach((x) => {
    const counter = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 1), checkoutMat);
    counter.position.set(x, 0.55, STORE_DEPTH / 2 - 3);
    counter.castShadow = true;
    counter.receiveShadow = true;
    scene.add(counter);
    colliders.push(new THREE.Box3().setFromObject(counter));
  });

  const checkoutLabel = makeLabelSprite('PÉNZTÁR', '#dd0741');
  checkoutLabel.position.set(0, 2.3, STORE_DEPTH / 2 - 3);
  scene.add(checkoutLabel);

  // --- Fény ---
  const hemi = new THREE.HemisphereLight(0xffffff, 0x8a8a8a, 0.9);
  scene.add(hemi);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
  dirLight.position.set(8, 14, 6);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(1024, 1024);
  dirLight.shadow.camera.left = -18;
  dirLight.shadow.camera.right = 18;
  dirLight.shadow.camera.top = 18;
  dirLight.shadow.camera.bottom = -18;
  scene.add(dirLight);

  // Néhány pontfény a bolti "neon" hangulathoz
  [-8, 0, 8].forEach((x) => {
    const p = new THREE.PointLight(0xffffff, 0.4, 12);
    p.position.set(x, 3.6, 0);
    scene.add(p);
  });

  return {
    colliders,
    checkoutPositions: checkoutPositions.map((x) => new THREE.Vector3(x, 0, STORE_DEPTH / 2 - 4.2)),
    spawnPosition: new THREE.Vector3(ENTRANCE_X, 0, STORE_DEPTH / 2 - 1.5),
    shelfSlots: scene.children.filter((c) => c.userData && c.userData.categoryKey),
    bounds: { width: STORE_WIDTH, depth: STORE_DEPTH },
  };
}

export function spawnPickupForProduct(scene, product, position) {
  const marker = buildPickupMarker(product);
  marker.position.copy(position);
  marker.position.y = 1.1;
  scene.add(marker);
  return { mesh: marker, product, taken: false };
}

export { buildPickupMarker, STORE_WIDTH, STORE_DEPTH };
