import * as THREE from 'three';

const SKIN_TONES = [0xffd8b0, 0xe8b487, 0xc68642, 0x8d5524];

// Alapból, felszerelt Lidl-ruha nélkül, a karakter ugyanolyan szürke,
// mint a bolt hétköznapi vásárlói (NPC-k) - ld. a "Sztori" menüpontot.
const DEFAULT_JACKET = 0x6b6f76;
const DEFAULT_PANTS = 0x44403a;
const DEFAULT_SHOE = 0x2a2a2a;
const DEFAULT_SOCK = 0xffffff;

// A ruha-matrica textúrát egyszer töltjük be, minden karakter ugyanazt a
// betöltött Texture objektumot használja (three.js automatikusan frissíti
// a megjelenítést, amint a kép megérkezik).
const textureLoader = new THREE.TextureLoader();
const badgeTexture = textureLoader.load('logo-badge.png');
badgeTexture.colorSpace = THREE.SRGBColorSpace;

function addLogoBadge(parent, { x = 0, y, z, scale = 0.16 }) {
  const geo = new THREE.CircleGeometry(scale, 20);
  const mat = new THREE.MeshBasicMaterial({ map: badgeTexture, transparent: true });
  const badge = new THREE.Mesh(geo, mat);
  badge.position.set(x, y, z);
  parent.add(badge);
  return badge;
}

function buildLeg(xOff, { pantsColor, accentColor, isShorts, sockColor, sockAccent, shoeColor, shoeAccent, skinTone }) {
  const group = new THREE.Group();
  const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.8 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skinTone, roughness: 0.6 });
  const sockMat = new THREE.MeshStandardMaterial({ color: sockColor, roughness: 0.7 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: shoeColor, roughness: 0.5 });

  if (isShorts) {
    // Rövidnadrág: rövid színes szár (+ oldalcsík) + kilátszó lábszár + zokni + cipő
    const shortsPart = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.15, 0.24, 8), pantsMat);
    shortsPart.position.set(xOff, 0.62, 0);
    shortsPart.castShadow = true;
    group.add(shortsPart);

    if (accentColor) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.24, 0.05),
        new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.7 })
      );
      stripe.position.set(xOff + (xOff >= 0 ? 0.15 : -0.15), 0.62, 0);
      group.add(stripe);
    }

    const skinLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.115, 0.36, 8), skinMat);
    skinLeg.position.set(xOff, 0.32, 0);
    skinLeg.castShadow = true;
    group.add(skinLeg);

    const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.12, 0.16, 8), sockMat);
    sock.position.set(xOff, 0.12, 0);
    sock.castShadow = true;
    group.add(sock);

    if (sockAccent) {
      const sockStripe = new THREE.Mesh(
        new THREE.TorusGeometry(0.117, 0.018, 6, 16),
        new THREE.MeshStandardMaterial({ color: sockAccent, roughness: 0.6 })
      );
      sockStripe.rotation.x = Math.PI / 2;
      sockStripe.position.set(xOff, 0.17, 0);
      group.add(sockStripe);
    }
  } else {
    // Hosszúnadrág: teljes hosszú szár, zokni nem látszik
    const pantsLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.7, 8), pantsMat);
    pantsLeg.position.set(xOff, 0.35, 0);
    pantsLeg.castShadow = true;
    group.add(pantsLeg);

    if (accentColor) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.68, 0.05),
        new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.7 })
      );
      stripe.position.set(xOff + (xOff >= 0 ? 0.15 : -0.15), 0.35, 0);
      group.add(stripe);
    }
  }

  // Cipő - mindkét esetben látszik a láb alján (kicsit nagyobbra méretezve, hogy jól látszódjon a mintája)
  const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.32), shoeMat);
  shoe.position.set(xOff, 0.055, 0.05);
  shoe.castShadow = true;
  group.add(shoe);

  if (shoeAccent) {
    const shoeStripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.205, 0.05, 0.1),
      new THREE.MeshStandardMaterial({ color: shoeAccent, roughness: 0.5 })
    );
    shoeStripe.position.set(xOff, 0.07, 0.14);
    group.add(shoeStripe);
  }

  return group;
}

function buildHumanoid(outfit, { skinTone, hairColor }) {
  const group = new THREE.Group();

  const top = outfit.top; // { color, accentColor, hasLogo, meta: { style } } vagy null
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

  const jacketMat = new THREE.MeshStandardMaterial({ color: topColor, roughness: 0.75 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skinTone, roughness: 0.6 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.5 });

  // --- Torzó a felső stílusa szerint ---
  let torsoRadius = 0.32;
  let torsoLength = 0.55;
  let torsoY = 1.15;
  if (topStyle === 'tshirt') {
    torsoRadius = 0.3;
    torsoLength = 0.5;
    torsoY = 1.13;
  } else if (topStyle === 'sweater') {
    torsoRadius = 0.36;
    torsoLength = 0.56;
    torsoY = 1.16;
  } else if (topStyle === 'coat') {
    torsoRadius = 0.34;
    torsoLength = 0.78;
    torsoY = 1.05;
  }

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(torsoRadius, torsoLength, 4, 8), jacketMat);
  torso.position.y = torsoY;
  torso.castShadow = true;
  group.add(torso);

  // --- Felső mintázata: a márka másik színe mindig megjelenik valahol a felsőn ---
  if (topAccent) {
    const accentMat = new THREE.MeshStandardMaterial({ color: topAccent, roughness: 0.7 });
    if (topStyle === 'sweater') {
      // Pulóver: több vékony csík a mellkason (kötött minta hatás)
      [torsoY + 0.16, torsoY, torsoY - 0.16].forEach((y) => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(torsoRadius + 0.005, 0.025, 8, 20), accentMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = y;
        group.add(ring);
      });
    } else if (topStyle === 'coat') {
      // Kabát: sárga szegély az alján és a gallérnál
      const hem = new THREE.Mesh(new THREE.TorusGeometry(torsoRadius + 0.01, 0.03, 8, 20), accentMat);
      hem.rotation.x = Math.PI / 2;
      hem.position.y = torsoY - torsoLength / 2 - 0.05;
      group.add(hem);

      const collar = new THREE.Mesh(new THREE.TorusGeometry(torsoRadius - 0.02, 0.025, 8, 16), accentMat);
      collar.rotation.x = Math.PI / 2;
      collar.position.y = torsoY + torsoLength / 2 + 0.12;
      group.add(collar);
    } else {
      // Póló: egyetlen vízszintes csík a mellkas magasságában
      const stripe = new THREE.Mesh(new THREE.TorusGeometry(torsoRadius + 0.005, 0.035, 8, 20), accentMat);
      stripe.rotation.x = Math.PI / 2;
      stripe.position.y = torsoY;
      group.add(stripe);
    }
  }

  // --- Bolti embléma matrica a mellkason, ha az adott felső "hasLogo" ---
  if (top && top.hasLogo) {
    addLogoBadge(group, { y: torsoY + 0.14, z: torsoRadius + 0.01, scale: 0.14 });
  }

  // --- Karok - póló esetén rövid ujj (kilátszó bőrrel) ---
  const isShortSleeve = topStyle === 'tshirt';
  const fullArmGeo = new THREE.CapsuleGeometry(0.09, 0.45, 4, 6);
  const shortArmGeo = new THREE.CapsuleGeometry(0.095, 0.22, 4, 6);
  const forearmGeo = new THREE.CapsuleGeometry(0.075, 0.22, 4, 6);

  [-0.42, 0.42].forEach((xOff) => {
    const tilt = xOff > 0 ? -0.15 : 0.15;
    if (isShortSleeve) {
      const upperArm = new THREE.Mesh(shortArmGeo, jacketMat);
      upperArm.position.set(xOff, 1.32, 0);
      upperArm.rotation.z = tilt;
      upperArm.castShadow = true;
      group.add(upperArm);

      const forearm = new THREE.Mesh(forearmGeo, skinMat);
      forearm.position.set(xOff * 1.05, 1.02, 0);
      forearm.rotation.z = tilt;
      forearm.castShadow = true;
      group.add(forearm);
    } else {
      const arm = new THREE.Mesh(fullArmGeo, jacketMat);
      arm.position.set(xOff, 1.15, 0);
      arm.rotation.z = tilt;
      arm.castShadow = true;
      group.add(arm);
    }
  });

  // --- Lábak (nadrág/rövidnadrág + zokni + cipő, mindegyik kétszínű) ---
  [-0.14, 0.14].forEach((xOff) => {
    const leg = buildLeg(xOff, {
      pantsColor,
      accentColor: pantsAccent,
      isShorts,
      sockColor,
      sockAccent,
      shoeColor,
      shoeAccent,
      skinTone,
    });
    group.add(leg);
  });

  // --- Fej ---
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), skinMat);
  head.position.y = 1.68;
  head.castShadow = true;
  group.add(head);

  // --- Haj ---
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
  hair.position.y = 1.75;
  group.add(hair);

  // --- Sapka (opcionális, a haj fölé kerül, sárga szegéllyel + logóval) ---
  if (cap) {
    const capMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
      new THREE.MeshStandardMaterial({ color: cap.color, roughness: 0.6 })
    );
    capMesh.position.y = 1.82;
    group.add(capMesh);

    if (cap.accentColor) {
      const brim = new THREE.Mesh(
        new THREE.TorusGeometry(0.26, 0.02, 8, 20),
        new THREE.MeshStandardMaterial({ color: cap.accentColor, roughness: 0.6 })
      );
      brim.rotation.x = Math.PI / 2;
      brim.position.y = 1.82;
      group.add(brim);
    }

    if (cap.hasLogo) {
      addLogoBadge(group, { y: 1.85, z: 0.25, scale: 0.09 });
    }
  }

  // --- Sál (opcionális, kétszínű) ---
  if (scarf) {
    const scarfMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.06, 8, 16),
      new THREE.MeshStandardMaterial({ color: scarf.color, roughness: 0.7 })
    );
    scarfMesh.rotation.x = Math.PI / 2.2;
    scarfMesh.position.y = 1.42;
    group.add(scarfMesh);

    if (scarf.accentColor) {
      const scarfStripe = new THREE.Mesh(
        new THREE.TorusGeometry(0.22, 0.025, 8, 16, Math.PI),
        new THREE.MeshStandardMaterial({ color: scarf.accentColor, roughness: 0.7 })
      );
      scarfStripe.rotation.x = Math.PI / 2.2;
      scarfStripe.position.y = 1.42;
      group.add(scarfStripe);
    }
  }

  // --- Hátizsák (opcionális, kétszínű, logóval) ---
  if (backpack) {
    const bag = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.42, 0.2),
      new THREE.MeshStandardMaterial({ color: backpack.color, roughness: 0.75 })
    );
    bag.position.set(0, 1.15, 0.24);
    bag.castShadow = true;
    group.add(bag);

    if (backpack.accentColor) {
      const pocket = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.18, 0.02),
        new THREE.MeshStandardMaterial({ color: backpack.accentColor, roughness: 0.7 })
      );
      pocket.position.set(0, 1.06, 0.345);
      group.add(pocket);
    }

    if (backpack.hasLogo) {
      addLogoBadge(group, { y: 1.25, z: 0.345, scale: 0.1 });
    }

    // Pántok
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
  const body = buildHumanoid(outfit, { skinTone, hairColor: 0x4a2e1e });
  group.add(body);

  // Bevásárlókocsi a karakter előtt
  const cartColor = outfit.cart ? outfit.cart.color : 0xcfd4da;
  const cart = buildShoppingCart(cartColor);
  cart.position.set(0, 0, -0.85);
  cart.userData.isCart = true;
  group.add(cart);

  group.userData.cart = cart;
  return group;
}

export function buildNpcCharacter() {
  // Matt, semleges tónusú ruházat, márkajelzés és minta nélkül - egyszerű hétköznapi vásárlók.
  const dullJackets = [0x6b6f76, 0x7a6a58, 0x556b5e, 0x5a5a5a, 0x74655a];
  const dullPants = [0x3d3d3d, 0x44403a, 0x3a4a42];
  const skinTone = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];

  const npcOutfit = {
    top: { color: dullJackets[Math.floor(Math.random() * dullJackets.length)], meta: { style: 'jacket' } },
    bottom: { color: dullPants[Math.floor(Math.random() * dullPants.length)], meta: { style: 'pants' } },
    socks: null,
    shoes: { color: 0x2a2a2a },
    cap: null,
    scarf: null,
    backpack: null,
    cart: null,
  };

  const body = buildHumanoid(npcOutfit, { skinTone, hairColor: 0x2b2018 });

  // NPC-k néha tolnak egy kosarat is, néha nem
  if (Math.random() > 0.5) {
    const cart = buildShoppingCart(0xcfd4da);
    cart.scale.set(0.9, 0.9, 0.9);
    cart.position.set(0, 0, -0.8);
    body.add(cart);
  }

  return body;
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
