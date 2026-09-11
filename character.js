import * as THREE from 'three';

const SKIN_TONES = [0xffd8b0, 0xe8b487, 0xc68642, 0x8d5524];
const DEFAULT_JACKET = 0x0050aa; // alap Lidl kék kabát, ha nincs felszerelt "felső"
const DEFAULT_PANTS = 0x2b3a55; // sötétkék hosszúnadrág alapból
const DEFAULT_SHOE = 0x2a2a2a;
const DEFAULT_SOCK = 0xffffff;

function buildLeg(xOff, { pantsColor, isShorts, sockColor, shoeColor, skinTone }) {
  const group = new THREE.Group();
  const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.8 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skinTone, roughness: 0.6 });
  const sockMat = new THREE.MeshStandardMaterial({ color: sockColor, roughness: 0.7 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: shoeColor, roughness: 0.5 });

  if (isShorts) {
    // Rövidnadrág: rövid színes szár + kilátszó lábszár + zokni + cipő
    const shortsPart = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.15, 0.24, 8), pantsMat);
    shortsPart.position.set(xOff, 0.62, 0);
    shortsPart.castShadow = true;
    group.add(shortsPart);

    const skinLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.115, 0.36, 8), skinMat);
    skinLeg.position.set(xOff, 0.32, 0);
    skinLeg.castShadow = true;
    group.add(skinLeg);

    const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.12, 0.16, 8), sockMat);
    sock.position.set(xOff, 0.12, 0);
    sock.castShadow = true;
    group.add(sock);
  } else {
    // Hosszúnadrág: teljes hosszú szár, zokni nem látszik
    const pantsLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.7, 8), pantsMat);
    pantsLeg.position.set(xOff, 0.35, 0);
    pantsLeg.castShadow = true;
    group.add(pantsLeg);
  }

  // Cipő - mindkét esetben látszik a láb alján
  const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.26), shoeMat);
  shoe.position.set(xOff, 0.05, 0.04);
  shoe.castShadow = true;
  group.add(shoe);

  return group;
}

function buildHumanoid(outfit, { skinTone, hairColor }) {
  const group = new THREE.Group();

  const top = outfit.top; // { color, meta: { style } } vagy null
  const bottom = outfit.bottom;
  const socks = outfit.socks;
  const shoes = outfit.shoes;
  const cap = outfit.cap;
  const backpack = outfit.backpack;
  const scarf = outfit.scarf;

  const topStyle = top ? top.meta?.style || 'jacket' : 'jacket';
  const topColor = top ? top.color : DEFAULT_JACKET;
  const isShorts = bottom ? bottom.meta?.style === 'shorts' : false;
  const pantsColor = bottom ? bottom.color : DEFAULT_PANTS;
  const shoeColor = shoes ? shoes.color : DEFAULT_SHOE;
  const sockColor = socks ? socks.color : DEFAULT_SOCK;

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

  // --- Lábak (nadrág/rövidnadrág + zokni + cipő) ---
  [-0.14, 0.14].forEach((xOff) => {
    const leg = buildLeg(xOff, { pantsColor, isShorts, sockColor, shoeColor, skinTone });
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

  // --- Sapka (opcionális, a haj fölé kerül) ---
  if (cap) {
    const capMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
      new THREE.MeshStandardMaterial({ color: cap.color, roughness: 0.6 })
    );
    capMesh.position.y = 1.82;
    group.add(capMesh);
  }

  // --- Sál (opcionális) ---
  if (scarf) {
    const scarfMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.06, 8, 16),
      new THREE.MeshStandardMaterial({ color: scarf.color, roughness: 0.7 })
    );
    scarfMesh.rotation.x = Math.PI / 2.2;
    scarfMesh.position.y = 1.42;
    group.add(scarfMesh);
  }

  // --- Hátizsák (opcionális, a hát mögé) ---
  if (backpack) {
    const bag = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.42, 0.2),
      new THREE.MeshStandardMaterial({ color: backpack.color, roughness: 0.75 })
    );
    bag.position.set(0, 1.15, 0.24);
    bag.castShadow = true;
    group.add(bag);

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

  // Lidl embléma folt a kabát elején (kis sárga korong)
  const badgeGeo = new THREE.CircleGeometry(0.09, 16);
  const badgeMat = new THREE.MeshStandardMaterial({ color: 0xffd100 });
  const badge = new THREE.Mesh(badgeGeo, badgeMat);
  badge.position.set(0, 1.25, 0.33);
  group.add(badge);

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
  // Matt, semleges tónusú ruházat - nem versenyez a főszereplő élénk színeivel
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
