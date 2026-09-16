import * as THREE from 'three';

const SKIN_TONES = [0xffd8b0, 0xe8b487, 0xc68642, 0x8d5524];

// Alapból, felszerelt Lidl-ruha nélkül, a karakter ugyanolyan szürke,
// mint a bolt hétköznapi vásárlói (NPC-k) - ld. a "Sztori" menüpontot.
const DEFAULT_JACKET = 0x6b6f76;
const DEFAULT_PANTS = 0x44403a;
const DEFAULT_SHOE = 0x2a2a2a;
const DEFAULT_SOCK = 0xffffff;

// A ruha-matrica textúrát egyszer töltjük be, minden karakter ugyanazt a
// betöltött Texture objektumot használja.
const textureLoader = new THREE.TextureLoader();
const badgeTexture = textureLoader.load('logo-badge.png');
badgeTexture.colorSpace = THREE.SRGBColorSpace;

function addLogoBadge(parent, { x = 0, y, z, scale = 0.16 }) {
  const geo = new THREE.CircleGeometry(scale, 20);
  const mat = new THREE.MeshBasicMaterial({ map: badgeTexture, transparent: true, side: THREE.DoubleSide });
  const badge = new THREE.Mesh(geo, mat);
  badge.position.set(x, y, z);
  parent.add(badge);
  return badge;
}

// Kicsi, sík "folt" a ruha felületéhez simulva (minta/csík helyett) - nem lóg ki
// a sziluettből, mert csak a testtől kifelé néző oldalra kerül, kis méretben.
function addSurfacePatch(parent, { x = 0, y, z, w = 0.1, h = 0.06, color, rx = 3 }) {
  const shape = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  shape.moveTo(-hw + rx, -hh);
  shape.lineTo(hw - rx, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + rx);
  shape.lineTo(hw, hh - rx);
  shape.quadraticCurveTo(hw, hh, hw - rx, hh);
  shape.lineTo(-hw + rx, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - rx);
  shape.lineTo(-hw, -hh + rx);
  shape.quadraticCurveTo(-hw, -hh, -hw + rx, -hh);
  const geo = new THREE.ShapeGeometry(shape);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, side: THREE.DoubleSide });
  const patch = new THREE.Mesh(geo, mat);
  patch.position.set(x, y, z);
  parent.add(patch);
  return patch;
}

// Finom, félig átlátszó "cel-shade" árnyékfolt a térfogatérzethez - a felület
// egyik oldalára kerül, nem zárt gyűrű, így semmivel nem ütközik.
function addShadowPatch(parent, { x, y, z, radius, color, rotY = 0 }) {
  const geo = new THREE.CircleGeometry(radius, 16);
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28, side: THREE.DoubleSide });
  const patch = new THREE.Mesh(geo, mat);
  patch.position.set(x, y, z);
  patch.rotation.y = rotY;
  parent.add(patch);
  return patch;
}

function buildLeg(xOff, { pantsColor, accentColor, isShorts, sockColor, sockAccent, shoeColor, shoeAccent, skinTone }) {
  const group = new THREE.Group();
  const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.8 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skinTone, roughness: 0.6 });
  const sockMat = new THREE.MeshStandardMaterial({ color: sockColor, roughness: 0.7 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: shoeColor, roughness: 0.5 });
  const side = xOff >= 0 ? 1 : -1;

  if (isShorts) {
    const shortsPart = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.145, 0.24, 10), pantsMat);
    shortsPart.position.set(xOff, 0.62, 0);
    shortsPart.castShadow = true;
    group.add(shortsPart);

    if (accentColor) {
      // Oldalcsík - egyértelműen a szár sugarán KÍVÜL, hogy ne vesszen bele a geometriába
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, 0.22, 0.05),
        new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.7 })
      );
      stripe.position.set(xOff + side * 0.165, 0.62, 0.02);
      group.add(stripe);
    }

    const skinLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.108, 0.36, 10), skinMat);
    skinLeg.position.set(xOff, 0.32, 0);
    skinLeg.castShadow = true;
    group.add(skinLeg);

    const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.12, 0.16, 10), sockMat);
    sock.position.set(xOff, 0.12, 0);
    sock.castShadow = true;
    group.add(sock);

    if (sockAccent) {
      const sockStripe = new THREE.Mesh(
        new THREE.TorusGeometry(0.118, 0.02, 6, 16),
        new THREE.MeshStandardMaterial({ color: sockAccent, roughness: 0.6 })
      );
      sockStripe.rotation.x = Math.PI / 2;
      sockStripe.position.set(xOff, 0.17, 0);
      group.add(sockStripe);
    }
  } else {
    const pantsLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.135, 0.7, 10), pantsMat);
    pantsLeg.position.set(xOff, 0.35, 0);
    pantsLeg.castShadow = true;
    group.add(pantsLeg);

    if (accentColor) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, 0.66, 0.05),
        new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.7 })
      );
      stripe.position.set(xOff + side * 0.175, 0.35, 0.02);
      group.add(stripe);
    }
  }

  // Cipő - oldalára kerül a csík (nem a tetejére), így nem vész el a dobozban
  const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.12, 0.32), shoeMat);
  shoe.position.set(xOff, 0.06, 0.05);
  shoe.castShadow = true;
  group.add(shoe);

  if (shoeAccent) {
    const shoeStripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.075, 0.24),
      new THREE.MeshStandardMaterial({ color: shoeAccent, roughness: 0.5 })
    );
    shoeStripe.position.set(xOff + side * 0.115, 0.065, 0.05);
    group.add(shoeStripe);
  }

  return group;
}

function buildShoppingCart(basketColor = 0xcfd4da) {
  const cart = new THREE.Group();
  const wireMat = new THREE.MeshStandardMaterial({ color: 0xcfd4da, metalness: 0.6, roughness: 0.4 });
  const basket = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.7), wireMat);
  basket.position.set(0, 0.55, 0);
  basket.material.color.setHex(basketColor);
  basket.material.transparent = true;
  basket.material.opacity = 0.4;
  cart.add(basket);

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(basket.geometry),
    new THREE.LineBasicMaterial({ color: 0x888f99 })
  );
  edges.position.copy(basket.position);
  cart.add(edges);

  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 0.06), wireMat);
  handle.position.set(0, 0.8, -0.38);
  cart.add(handle);

  const wheelGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.04, 10);
  [[-0.25, -0.3], [0.25, -0.3], [-0.25, 0.3], [0.25, 0.3]].forEach(([x, z]) => {
    const wheel = new THREE.Mesh(wheelGeo, new THREE.MeshStandardMaterial({ color: 0x222222 }));
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.08, z);
    cart.add(wheel);
  });

  cart.userData.basketMesh = basket;
  return cart;
}

// =====================================================================
// EGYSZERŰ, OLCSÓ MODELL - az NPC-k ezt kapják (nincs arc, nincs cel-shade,
// nincs anatómiai tagolás - a teljesítmény és a főszereplőtől való
// megkülönböztethetőség miatt).
// =====================================================================
function buildSimpleHumanoid(outfit, { skinTone, hairColor }) {
  const group = new THREE.Group();
  const top = outfit.top;
  const bottom = outfit.bottom;

  const jacketMat = new THREE.MeshStandardMaterial({ color: top ? top.color : DEFAULT_JACKET, roughness: 0.75 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skinTone, roughness: 0.6 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.5 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.55, 4, 8), jacketMat);
  torso.position.y = 1.15;
  torso.castShadow = true;
  group.add(torso);

  const armGeo = new THREE.CapsuleGeometry(0.09, 0.45, 4, 6);
  [-0.42, 0.42].forEach((xOff) => {
    const arm = new THREE.Mesh(armGeo, jacketMat);
    arm.position.set(xOff, 1.15, 0);
    arm.rotation.z = xOff > 0 ? -0.15 : 0.15;
    arm.castShadow = true;
    group.add(arm);
  });

  [-0.14, 0.14].forEach((xOff) => {
    const leg = buildLeg(xOff, {
      pantsColor: bottom ? bottom.color : DEFAULT_PANTS,
      accentColor: null,
      isShorts: false,
      sockColor: DEFAULT_SOCK,
      sockAccent: null,
      shoeColor: DEFAULT_SHOE,
      shoeAccent: null,
      skinTone,
    });
    group.add(leg);
  });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), skinMat);
  head.position.y = 1.68;
  head.castShadow = true;
  group.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
  hair.position.y = 1.75;
  group.add(hair);

  return group;
}

export function buildNpcCharacter() {
  const dullJackets = [0x6b6f76, 0x7a6a58, 0x556b5e, 0x5a5a5a, 0x74655a];
  const dullPants = [0x3d3d3d, 0x44403a, 0x3a4a42];
  const skinTone = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];

  const npcOutfit = {
    top: { color: dullJackets[Math.floor(Math.random() * dullJackets.length)] },
    bottom: { color: dullPants[Math.floor(Math.random() * dullPants.length)] },
  };

  const body = buildSimpleHumanoid(npcOutfit, { skinTone, hairColor: 0x2b2018 });

  if (Math.random() > 0.5) {
    const cart = buildShoppingCart(0xcfd4da);
    cart.scale.set(0.9, 0.9, 0.9);
    cart.position.set(0, 0, -0.8);
    body.add(cart);
  }

  return body;
}

// =====================================================================
// ANATÓMIAI MODELL - csak a főszereplő kapja: valódi nyak, keskenyedő
// derekú törzs (lathe geometria), arc, cel-shade árnyékfoltok.
// =====================================================================

// A törzs függőleges vázpontjai (sugár, magasság) stílusonként - a VÁLL
// magassága minden stílusnál ugyanott van, hogy a kar mindig illeszkedjen;
// csak a szélesség és az alsó szegély (hossz) változik stílusonként.
function getTorsoProfile(style) {
  const base = [
    [0.19, 0.70], // csípő alja (a lábhoz csatlakozik)
    [0.27, 0.80], // csípő legszélesebb pontja
    [0.25, 0.90],
    [0.20, 0.97], // derék - legkeskenyebb pont
    [0.23, 1.05],
    [0.27, 1.15], // mellkas szélesedik
    [0.30, 1.28], // váll töve (legszélesebb) - a kar innen indul
    [0.24, 1.35], // váll lejt a nyak felé
    [0.13, 1.40], // nyak töve
  ];

  if (style === 'tshirt') {
    return base.map(([r, y]) => [r * 0.93, y]);
  }
  if (style === 'sweater') {
    return base.map(([r, y]) => [r * 1.12, y]);
  }
  if (style === 'coat') {
    // Kabát: a felső rész kicsit vaskosabb, ÉS lejjebb ér (combközépig)
    const upper = base.map(([r, y]) => [r * 1.06, y]);
    return [
      [0.27, 0.42], // kabát alja - a comb közepéig ér
      [0.29, 0.55],
      [0.28, 0.66],
      ...upper.filter(([, y]) => y > 0.66),
    ];
  }
  return base; // 'jacket' - alapértelmezett Lidl kabát
}

const SHOULDER_Y = 1.28;
const NECK_TOP_Y = 1.48;
const HEAD_RADIUS = 0.22;
const HEAD_CENTER_Y = NECK_TOP_Y + HEAD_RADIUS;

function buildTorsoMesh(color, style) {
  const profile = getTorsoProfile(style);
  const points = profile.map(([r, y]) => new THREE.Vector2(r, y));
  const geo = new THREE.LatheGeometry(points, 20);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.75 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

function addTopAccentPatches(group, { style, accentColor, chestR, hasLogo }) {
  const frontZ = -(chestR + 0.01);

  if (style === 'sweater') {
    // Kötött minta hatás: több kis pötty a mellkason, nem egy kilógó gyűrű
    const dots = [
      [-0.1, 1.2], [0.1, 1.2],
      [-0.16, 1.1], [0, 1.1], [0.16, 1.1],
      [-0.1, 1.0], [0.1, 1.0],
    ];
    dots.forEach(([x, y]) => {
      addSurfacePatch(group, { x, y, z: frontZ, w: 0.055, h: 0.055, color: accentColor, rx: 27 });
    });
  } else if (style === 'coat') {
    // Elöl végigfutó "gombsor" csík + szegély elöl, nem körbefutó gyűrű
    addSurfacePatch(group, { x: 0, y: 1.0, z: -(chestR + 0.02), w: 0.05, h: 0.62, color: accentColor, rx: 4 });
    addSurfacePatch(group, { x: 0, y: 0.46, z: -0.29, w: 0.4, h: 0.05, color: accentColor, rx: 4 });
    addSurfacePatch(group, { x: 0, y: 1.38, z: -0.16, w: 0.18, h: 0.045, color: accentColor, rx: 4 });
  } else {
    // Póló: két kisebb, egymás melletti csík elöl (nem körbefutó)
    addSurfacePatch(group, { x: -0.08, y: 1.18, z: frontZ, w: 0.13, h: 0.05, color: accentColor, rx: 4 });
    addSurfacePatch(group, { x: 0.08, y: 1.18, z: frontZ, w: 0.13, h: 0.05, color: accentColor, rx: 4 });
  }

  if (hasLogo) {
    addLogoBadge(group, { x: 0, y: 1.28, z: frontZ - 0.015, scale: 0.13 });
  }
}

function buildAnatomicalHumanoid(outfit, { skinTone, hairColor }) {
  const group = new THREE.Group();

  const top = outfit.top;
  const bottom = outfit.bottom;
  const socks = outfit.socks;
  const shoes = outfit.shoes;
  const cap = outfit.cap;
  const backpack = outfit.backpack;
  const scarf = outfit.scarf;

  const topStyle = top ? top.meta?.style || 'jacket' : 'jacket';
  const topColor = top ? top.color : DEFAULT_JACKET;
  const topAccent = top ? top.accentColor : null;
  const isShorts = bottom ? bottom.meta?.style === 'shorts' : false;
  const pantsColor = bottom ? bottom.color : DEFAULT_PANTS;
  const pantsAccent = bottom ? bottom.accentColor : null;
  const shoeColor = shoes ? shoes.color : DEFAULT_SHOE;
  const shoeAccent = shoes ? shoes.accentColor : null;
  const sockColor = socks ? socks.color : DEFAULT_SOCK;
  const sockAccent = socks ? socks.accentColor : null;

  const skinMat = new THREE.MeshStandardMaterial({ color: skinTone, roughness: 0.6 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.5 });

  // --- Törzs (lathe geometria - keskenyedő derék, valódi váll) ---
  const torso = buildTorsoMesh(topColor, topStyle);
  group.add(torso);

  const chestRAtShoulder = getTorsoProfile(topStyle).find(([, y]) => Math.abs(y - 1.15) < 0.001)?.[0] || 0.27;
  if (topAccent) {
    addTopAccentPatches(group, { style: topStyle, accentColor: topAccent, chestR: chestRAtShoulder, hasLogo: !!(top && top.hasLogo) });
  } else if (top && top.hasLogo) {
    addLogoBadge(group, { x: 0, y: 1.28, z: -(chestRAtShoulder + 0.025), scale: 0.13 });
  }

  // Finom cel-shade árnyékfolt a törzs oldalán (hátul) - térfogatérzet, nem lóg ki
  addShadowPatch(group, { x: 0, y: 1.05, z: 0.24, radius: 0.16, color: 0x000000, rotY: 0 });

  // --- Nyak (valódi henger a fej és a törzs között - ide kerül a sál) ---
  const neckMat = new THREE.MeshStandardMaterial({ color: skinTone, roughness: 0.6 });
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, NECK_TOP_Y - SHOULDER_Y - 0.08, 10), neckMat);
  neck.position.y = (SHOULDER_Y + 0.08 + NECK_TOP_Y) / 2;
  neck.castShadow = true;
  group.add(neck);

  // --- Karok - vállból indulnak (mindig SHOULDER_Y magasságban, stílustól függetlenül) ---
  const isShortSleeve = topStyle === 'tshirt';
  const armColor = topColor;
  const armMat = new THREE.MeshStandardMaterial({ color: armColor, roughness: 0.75 });
  const shoulderX = chestRAtShoulder + 0.06;

  [-1, 1].forEach((side) => {
    const xBase = side * shoulderX;

    if (isShortSleeve) {
      const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.2, 4, 6), armMat);
      upperArm.position.set(xBase, SHOULDER_Y - 0.14, 0);
      upperArm.castShadow = true;
      group.add(upperArm);

      const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.072, 0.24, 4, 6), skinMat);
      forearm.position.set(xBase, SHOULDER_Y - 0.44, 0);
      forearm.castShadow = true;
      group.add(forearm);
    } else {
      const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.32, 4, 6), armMat);
      upperArm.position.set(xBase, SHOULDER_Y - 0.2, 0);
      upperArm.castShadow = true;
      group.add(upperArm);

      const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.28, 4, 6), armMat);
      forearm.position.set(xBase, SHOULDER_Y - 0.56, 0);
      forearm.castShadow = true;
      group.add(forearm);

      if (topAccent && topStyle === 'coat') {
        // Kabátujj-szegély - gyűrű a KARON, nem a törzsön, így nem lóghat ki
        const cuff = new THREE.Mesh(
          new THREE.TorusGeometry(0.078, 0.016, 6, 14),
          new THREE.MeshStandardMaterial({ color: topAccent, roughness: 0.6 })
        );
        cuff.rotation.x = Math.PI / 2;
        cuff.position.set(xBase, SHOULDER_Y - 0.7, 0);
        group.add(cuff);
      }
    }

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), skinMat);
    hand.position.set(xBase, SHOULDER_Y - (isShortSleeve ? 0.58 : 0.72), 0);
    hand.castShadow = true;
    group.add(hand);
  });

  // --- Lábak ---
  [-0.14, 0.14].forEach((xOff) => {
    const leg = buildLeg(xOff, { pantsColor, accentColor: pantsAccent, isShorts, sockColor, sockAccent, shoeColor, shoeAccent, skinTone });
    group.add(leg);
  });

  // --- Fej ---
  const head = new THREE.Mesh(new THREE.SphereGeometry(HEAD_RADIUS, 20, 18), skinMat);
  head.position.y = HEAD_CENTER_Y;
  head.castShadow = true;
  group.add(head);

  // Finom cel-shade árnyék a fej oldalán
  addShadowPatch(group, { x: 0.16, y: HEAD_CENTER_Y - 0.02, z: -0.1, radius: 0.11, color: 0x000000, rotY: Math.PI * 0.35 });

  const hair = new THREE.Mesh(new THREE.SphereGeometry(HEAD_RADIUS + 0.01, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
  hair.position.y = HEAD_CENTER_Y + 0.06;
  group.add(hair);

  // --- Arc: szemek (fénypont-tükröződéssel), szemöldök, mosoly - CSAK a főszereplőn ---
  const eyeY = HEAD_CENTER_Y - 0.01;
  const eyeZ = -(HEAD_RADIUS - 0.03);
  [-1, 1].forEach((side) => {
    const eyeX = side * 0.09;
    const eye = new THREE.Mesh(new THREE.CircleGeometry(0.032, 12), new THREE.MeshBasicMaterial({ color: 0x1a1a1a, side: THREE.DoubleSide }));
    eye.position.set(eyeX, eyeY, eyeZ);
    group.add(eye);

    const highlight = new THREE.Mesh(new THREE.CircleGeometry(0.011, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    highlight.position.set(eyeX + 0.008, eyeY + 0.008, eyeZ - 0.002);
    group.add(highlight);

    const browMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.7 });
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.014, 0.01), browMat);
    brow.position.set(eyeX, eyeY + 0.06, eyeZ - 0.01);
    brow.rotation.z = side * -0.18;
    group.add(brow);

    const cheek = new THREE.Mesh(new THREE.CircleGeometry(0.045, 10), new THREE.MeshBasicMaterial({ color: 0xff9d80, transparent: true, opacity: 0.4, side: THREE.DoubleSide }));
    cheek.position.set(side * 0.16, eyeY - 0.05, eyeZ + 0.03);
    group.add(cheek);
  });

  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.055, 0.009, 6, 12, Math.PI * 0.7),
    new THREE.MeshStandardMaterial({ color: 0xa8563f })
  );
  smile.rotation.z = Math.PI + Math.PI * 0.15;
  smile.position.set(0, eyeY - 0.09, eyeZ + 0.005);
  group.add(smile);

  // --- Sapka ---
  if (cap) {
    const capRadius = HEAD_RADIUS + 0.015; // szinte pont fejméret - nem lóg el
    const capY = HEAD_CENTER_Y + 0.04; // dóm alja (egyenlítője) - szorosan a fejhez simulva

    const capMesh = new THREE.Mesh(
      new THREE.SphereGeometry(capRadius, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
      new THREE.MeshStandardMaterial({ color: cap.color, roughness: 0.6 })
    );
    capMesh.position.y = capY;
    group.add(capMesh);

    // Előre néző napellenző (silt) a körbefutó gyűrű helyett - egyértelműen
    // az elülső (-Z) irányba mutat, ahogy az arc és a kocsi is
    const billColor = cap.accentColor || cap.color;
    const bill = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.018, 0.1),
      new THREE.MeshStandardMaterial({ color: billColor, roughness: 0.6 })
    );
    bill.position.set(0, capY - 0.015, -(capRadius * 0.82));
    bill.rotation.x = -0.18;
    group.add(bill);

    if (cap.hasLogo) {
      addLogoBadge(group, { y: capY + 0.07, z: -(capRadius - 0.01), scale: 0.08 });
    }
  }

  // --- Sál - most már a NYAK köré kerül, ahol tényleg látszik ---
  if (scarf) {
    const scarfY = NECK_TOP_Y - 0.03;
    const scarfMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.05, 8, 16),
      new THREE.MeshStandardMaterial({ color: scarf.color, roughness: 0.7 })
    );
    scarfMesh.rotation.x = Math.PI / 2.3;
    scarfMesh.position.y = scarfY;
    group.add(scarfMesh);

    if (scarf.accentColor) {
      const scarfStripe = new THREE.Mesh(
        new THREE.TorusGeometry(0.16, 0.02, 8, 16, Math.PI),
        new THREE.MeshStandardMaterial({ color: scarf.accentColor, roughness: 0.7 })
      );
      scarfStripe.rotation.x = Math.PI / 2.3;
      scarfStripe.position.y = scarfY;
      group.add(scarfStripe);
    }

    // Lelógó vég elöl
    const tail = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.22, 0.02),
      new THREE.MeshStandardMaterial({ color: scarf.color, roughness: 0.7 })
    );
    tail.position.set(0.05, scarfY - 0.16, -0.15);
    tail.rotation.x = -0.15;
    group.add(tail);
  }

  // --- Hátizsák - a zseb és a logó egyértelműen egymás előtt, nincs átfedés ---
  if (backpack) {
    const bagFrontZ = 0.34;
    const bag = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.42, 0.2),
      new THREE.MeshStandardMaterial({ color: backpack.color, roughness: 0.75 })
    );
    bag.position.set(0, 1.15, 0.24);
    bag.castShadow = true;
    group.add(bag);

    if (backpack.accentColor) {
      const pocket = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.18, 0.015),
        new THREE.MeshStandardMaterial({ color: backpack.accentColor, roughness: 0.7 })
      );
      pocket.position.set(0, 1.06, bagFrontZ + 0.008);
      group.add(pocket);
    }

    if (backpack.hasLogo) {
      addLogoBadge(group, { y: 1.25, z: bagFrontZ + 0.02, scale: 0.1 });
    }

    const strapMat = new THREE.MeshStandardMaterial({ color: backpack.color, roughness: 0.8 });
    [-0.14, 0.14].forEach((xOff) => {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.42, 0.06), strapMat);
      strap.position.set(xOff, 1.28, 0.1);
      group.add(strap);
    });
  }

  return group;
}

export function buildPlayerCharacter(outfit) {
  const group = new THREE.Group();

  const skinTone = SKIN_TONES[0];
  const body = buildAnatomicalHumanoid(outfit, { skinTone, hairColor: 0x4a2e1e });
  group.add(body);

  const cartColor = outfit.cart ? outfit.cart.color : 0xcfd4da;
  const cart = buildShoppingCart(cartColor);
  cart.position.set(0, 0, -0.85);
  cart.userData.isCart = true;
  group.add(cart);

  group.userData.cart = cart;
  return group;
}
