import * as THREE from 'three';

const SKIN_TONES = [0xffd8b0, 0xe8b487, 0xc68642, 0x8d5524];

function buildHumanoid({ jacketColor, pantsColor, scarfColor, skinTone, hairColor }) {
  const group = new THREE.Group();

  const jacketMat = new THREE.MeshStandardMaterial({ color: jacketColor, roughness: 0.75 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.8 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skinTone, roughness: 0.6 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.5 });

  // Test (felsőrész - kabát)
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.55, 4, 8), jacketMat);
  torso.position.y = 1.15;
  torso.castShadow = true;
  group.add(torso);

  // Láb (nadrág) - egyszerűsítve egy kúpos hengerpár
  const legGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.7, 8);
  [-0.14, 0.14].forEach((xOff) => {
    const leg = new THREE.Mesh(legGeo, pantsMat);
    leg.position.set(xOff, 0.35, 0);
    leg.castShadow = true;
    group.add(leg);
  });

  // Kar
  const armGeo = new THREE.CapsuleGeometry(0.09, 0.45, 4, 6);
  [-0.42, 0.42].forEach((xOff) => {
    const arm = new THREE.Mesh(armGeo, jacketMat);
    arm.position.set(xOff, 1.15, 0);
    arm.rotation.z = xOff > 0 ? -0.15 : 0.15;
    arm.castShadow = true;
    group.add(arm);
  });

  // Fej
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), skinMat);
  head.position.y = 1.68;
  head.castShadow = true;
  group.add(head);

  // Haj
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
  hair.position.y = 1.75;
  group.add(hair);

  // Sál (ha van)
  if (scarfColor !== null) {
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.06, 8, 16), new THREE.MeshStandardMaterial({ color: scarfColor }));
    scarf.rotation.x = Math.PI / 2.2;
    scarf.position.y = 1.42;
    group.add(scarf);
  }

  return group;
}

export function buildPlayerCharacter(wardrobeItem = null) {
  const group = new THREE.Group();

  const jacketColor = wardrobeItem ? wardrobeItem.jacketColor : 0x0050aa;
  const scarfColor = wardrobeItem ? wardrobeItem.scarfColor : 0xffd100;
  const cartColor = wardrobeItem ? wardrobeItem.cartColor : 0xcfd4da;

  const skinTone = SKIN_TONES[0];
  const body = buildHumanoid({
    jacketColor, // Lidl kék kabát (vagy felszerelt variáns)
    pantsColor: 0x2b3a55, // sötétkék farmer
    scarfColor, // Lidl sárga sál (vagy felszerelt variáns)
    skinTone,
    hairColor: 0x4a2e1e,
  });
  group.add(body);

  // Lidl embléma folt a kabát elején (kis sárga-piros korong)
  const badgeGeo = new THREE.CircleGeometry(0.09, 16);
  const badgeMat = new THREE.MeshStandardMaterial({ color: 0xffd100 });
  const badge = new THREE.Mesh(badgeGeo, badgeMat);
  badge.position.set(0, 1.25, 0.33);
  group.add(badge);

  // Opcionális sapka (pl. "Kék sapka" wardrobe elemhez)
  if (wardrobeItem && wardrobeItem.hasCap) {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
      new THREE.MeshStandardMaterial({ color: 0x0050aa })
    );
    cap.position.y = 1.82;
    group.add(cap);
  }

  // Bevásárlókocsi a karakter előtt
  const cart = buildShoppingCart();
  cart.position.set(0, 0, -0.85);
  cart.userData.isCart = true;
  if (cart.userData.basketMesh) {
    cart.userData.basketMesh.material.color.setHex(cartColor);
  }
  group.add(cart);

  group.userData.cart = cart;
  return group;
}

export function buildNpcCharacter() {
  // Matt, semleges tónusú ruházat - nem versenyez a főszereplő élénk színeivel
  const dullJackets = [0x6b6f76, 0x7a6a58, 0x556b5e, 0x5a5a5a, 0x74655a];
  const dullPants = [0x3d3d3d, 0x44403a, 0x3a4a42];
  const skinTone = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];

  const body = buildHumanoid({
    jacketColor: dullJackets[Math.floor(Math.random() * dullJackets.length)],
    pantsColor: dullPants[Math.floor(Math.random() * dullPants.length)],
    scarfColor: null,
    skinTone,
    hairColor: 0x2b2018,
  });

  // NPC-k néha tolnak egy kosarat is, néha nem
  if (Math.random() > 0.5) {
    const cart = buildShoppingCart();
    cart.scale.set(0.9, 0.9, 0.9);
    cart.position.set(0, 0, -0.8);
    body.add(cart);
  }

  return body;
}

function buildShoppingCart() {
  const cart = new THREE.Group();
  const wireMat = new THREE.MeshStandardMaterial({ color: 0xcfd4da, metalness: 0.6, roughness: 0.4 });
  const basket = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.7), wireMat);
  basket.position.set(0, 0.55, 0);
  basket.material.wireframe = false;
  basket.material.transparent = true;
  basket.material.opacity = 0.35;
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
