import * as THREE from 'three';

/**
 * Creatures — modelos low-poly caprichados, um por espécie.
 * Cada função monta o animal com silhueta reconhecível (orelhas, cauda,
 * crina, tromba, chifres, corcova...) e expõe partes para animação.
 *
 * Retorno padrão: { group, animate(t, moving) }
 * - pernas balançam ao andar
 * - cabeça/cauda têm leve idle
 */

function mat(color, rough = 0.85) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, flatShading: true });
}

function leg(material, r1 = 0.11, r2 = 0.09, h = 0.6) {
  return new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 6), material);
}

/** Monta 4 pernas e devolve as malhas para animar. */
function addLegs(group, material, { spreadX = 0.35, spreadZ = 0.32, h = 0.6, y = 0.3 } = {}) {
  const legs = [];
  const spots = [[-spreadX, -spreadZ], [spreadX, -spreadZ], [-spreadX, spreadZ], [spreadX, spreadZ]];
  for (const [dx, dz] of spots) {
    const l = leg(material, 0.11, 0.09, h);
    l.position.set(dx, y, dz);
    l.castShadow = true;
    group.add(l);
    legs.push(l);
  }
  return legs;
}

function animator(group, legs, { head = null, tail = null, seed = Math.random() * 10, bodyBaseY } = {}) {
  return (t, moving) => {
    if (bodyBaseY != null) group.children[0].position.y = bodyBaseY + Math.sin(t * 3 + seed) * 0.03;
    if (moving) {
      legs.forEach((l, i) => { l.rotation.x = Math.sin(t * 11 + i * Math.PI) * 0.55; });
      if (tail) tail.rotation.z = Math.sin(t * 8 + seed) * 0.3;
    } else {
      legs.forEach(l => { l.rotation.x *= 0.85; });
      if (tail) tail.rotation.z = Math.sin(t * 2 + seed) * 0.12;
    }
    if (head) head.rotation.z = Math.sin(t * 1.5 + seed) * 0.05;
  };
}

/* ----------------------------- LEÃO ----------------------------- */
export function createLion() {
  const g = new THREE.Group();
  const body = mat(0xc8923a), dark = mat(0x8a5a1a), face = mat(0xd9a857);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.7, 4, 8), body);
  torso.rotation.z = Math.PI / 2; torso.position.y = 0.85; torso.castShadow = true; g.add(torso);
  const legs = addLegs(g, dark, { spreadX: 0.32, spreadZ: 0.28, h: 0.7, y: 0.35 });
  // cabeça
  const head = new THREE.Group();
  const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), face);
  skull.castShadow = true; head.add(skull);
  // juba
  const mane = new THREE.Mesh(new THREE.IcosahedronGeometry(0.46, 0), dark);
  mane.scale.set(1, 1, 0.7); head.add(mane);
  // focinho
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.22), face);
  snout.position.set(0, -0.05, 0.32); head.add(snout);
  // orelhas
  for (const dx of [-0.18, 0.18]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.12, 5), face);
    ear.position.set(dx, 0.32, 0); head.add(ear);
  }
  head.position.set(0.62, 1.05, 0); g.add(head);
  // cauda com tufo
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 5), body);
  tail.position.set(-0.65, 0.95, 0); tail.rotation.z = 0.8;
  const tuft = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 0), dark);
  tuft.position.set(-0.85, 1.15, 0); g.add(tail); g.add(tuft);
  return { group: g, animate: animator(g, legs, { head, tail, bodyBaseY: 0.85 }) };
}

/* --------------------------- ELEFANTE --------------------------- */
export function createElephant() {
  const g = new THREE.Group();
  const skin = mat(0x9a9a9a), dark = mat(0x808080);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.7, 0.9, 4, 8), skin);
  torso.rotation.z = Math.PI / 2; torso.position.y = 1.35; torso.castShadow = true; g.add(torso);
  const legs = addLegs(g, dark, { spreadX: 0.5, spreadZ: 0.42, h: 1.0, y: 0.5 });
  // cabeça
  const head = new THREE.Group();
  const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), skin);
  skull.castShadow = true; head.add(skull);
  // orelhas grandes
  for (const dx of [-0.45, 0.45]) {
    const ear = new THREE.Mesh(new THREE.CircleGeometry(0.35, 8), dark);
    ear.position.set(dx, 0.05, -0.05); ear.rotation.y = dx > 0 ? -0.5 : 0.5;
    ear.material.side = THREE.DoubleSide; head.add(ear);
  }
  // tromba (segmentos)
  const trunk = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.15 - i * 0.02, 0.17 - i * 0.02, 0.25, 6), skin);
    seg.position.set(0, -0.2 - i * 0.22, 0.4 + i * 0.05);
    seg.rotation.x = 0.4 + i * 0.1; trunk.add(seg);
  }
  head.add(trunk);
  // presas
  for (const dx of [-0.18, 0.18]) {
    const tusk = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.35, 5), mat(0xf0ead6));
    tusk.position.set(dx, -0.35, 0.4); tusk.rotation.x = 0.6; head.add(tusk);
  }
  head.position.set(0.85, 1.6, 0); g.add(head);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.5, 5), dark);
  tail.position.set(-0.95, 1.25, 0); tail.rotation.z = 0.3; g.add(tail);
  return { group: g, animate: animator(g, legs, { head, tail, bodyBaseY: 1.35 }) };
}

/* ---------------------------- OVELHA ---------------------------- */
export function createSheep() {
  const g = new THREE.Group();
  const wool = mat(0xece7da, 1), faceM = mat(0x3a342c), legM = mat(0x2a2620);
  // lã (várias bolhas)
  const body = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 0), wool);
    puff.position.set((Math.random() - 0.5) * 0.5, 0.6 + (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.4);
    puff.castShadow = true; body.add(puff);
  }
  g.add(body);
  const legs = addLegs(g, legM, { spreadX: 0.22, spreadZ: 0.2, h: 0.45, y: 0.22 });
  const head = new THREE.Group();
  const face = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 1), faceM);
  head.add(face);
  for (const dx of [-0.14, 0.14]) {
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.04), faceM);
    ear.position.set(dx, 0.05, 0); ear.rotation.z = dx > 0 ? -0.5 : 0.5; head.add(ear);
  }
  head.position.set(0.42, 0.65, 0); g.add(head);
  return { group: g, animate: animator(g, legs, { head, bodyBaseY: 0 }) };
}

/* ---------------------------- CAMELO ---------------------------- */
export function createCamel() {
  const g = new THREE.Group();
  const tan = mat(0xc19a5b), dark = mat(0xa07b40);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.8, 4, 8), tan);
  torso.rotation.z = Math.PI / 2; torso.position.y = 1.25; torso.castShadow = true; g.add(torso);
  // corcova
  const hump = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 1), tan);
  hump.position.set(0, 1.6, 0); hump.scale.set(1, 0.9, 1); hump.castShadow = true; g.add(hump);
  const legs = addLegs(g, dark, { spreadX: 0.3, spreadZ: 0.26, h: 1.1, y: 0.55 });
  // pescoço longo + cabeça
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.7, 6), tan);
  neck.position.set(0.55, 1.6, 0); neck.rotation.z = -0.6; g.add(neck);
  const head = new THREE.Group();
  const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), tan);
  head.add(skull);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.16), dark);
  snout.position.set(0.18, -0.05, 0); head.add(snout);
  head.position.set(0.85, 1.95, 0); g.add(head);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.45, 5), dark);
  tail.position.set(-0.7, 1.15, 0); tail.rotation.z = 0.4; g.add(tail);
  return { group: g, animate: animator(g, legs, { head, tail, bodyBaseY: 1.25 }) };
}

/* ----------------------------- CERVO ---------------------------- */
export function createDeer() {
  const g = new THREE.Group();
  const fur = mat(0x9a6238), light = mat(0xc89a6a), antler = mat(0x6b5030);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.6, 4, 8), fur);
  torso.rotation.z = Math.PI / 2; torso.position.y = 0.95; torso.castShadow = true; g.add(torso);
  const legs = addLegs(g, fur, { spreadX: 0.24, spreadZ: 0.22, h: 0.85, y: 0.42 });
  // pescoço + cabeça
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.45, 6), fur);
  neck.position.set(0.45, 1.2, 0); neck.rotation.z = -0.7; g.add(neck);
  const head = new THREE.Group();
  const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), fur);
  head.add(skull);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.12), light);
  snout.position.set(0.15, -0.04, 0); head.add(snout);
  // chifres ramificados
  for (const dx of [-0.08, 0.08]) {
    const main = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.3, 4), antler);
    main.position.set(dx, 0.22, 0); main.rotation.z = dx > 0 ? -0.3 : 0.3; head.add(main);
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.15, 4), antler);
    branch.position.set(dx * 1.8, 0.34, 0); branch.rotation.z = dx > 0 ? -0.8 : 0.8; head.add(branch);
  }
  head.position.set(0.7, 1.45, 0); g.add(head);
  const tail = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 0), light);
  tail.position.set(-0.55, 1.0, 0); g.add(tail);
  return { group: g, animate: animator(g, legs, { head, bodyBaseY: 0.95 }) };
}

/* ------------------------- NOÉ (humano) ------------------------- */
export function createNoah() {
  const g = new THREE.Group();
  const robe = mat(0x8a6a3f, 0.9), robeDark = mat(0x6e5230, 0.9), skin = mat(0xd8a878, 0.8);
  // túnica em duas partes (corpo + base mais larga)
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.48, 1.1, 8), robe);
  torso.position.y = 1.15; torso.castShadow = true; g.add(torso);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.62, 0.7, 8), robeDark);
  skirt.position.y = 0.5; skirt.castShadow = true; g.add(skirt);
  // faixa na cintura
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 6, 12), mat(0x9a3a2a));
  belt.position.y = 0.85; belt.rotation.x = Math.PI / 2; g.add(belt);
  // braços
  const arms = [];
  for (const dx of [-0.42, 0.42]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.5, 4, 6), robe);
    arm.position.set(dx, 1.2, 0); arm.castShadow = true; g.add(arm); arms.push(arm);
  }
  // cabeça + manto na cabeça
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 2), skin);
  head.position.y = 2.0; head.castShadow = true; g.add(head);
  const hood = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), mat(0xece7da, 1));
  hood.position.y = 2.08; hood.scale.set(1, 0.9, 1); g.add(hood);
  const beard = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), mat(0xe8e4dc, 1));
  beard.position.set(0, 1.82, 0.14); beard.scale.set(1, 1.1, 0.6); g.add(beard);
  // cajado
  const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6), mat(0x4f3219, 1));
  staff.position.set(0.55, 1.1, 0.1); staff.rotation.z = 0.12; g.add(staff);

  g.userData.animate = (t, moving) => {
    if (moving) {
      arms[0].rotation.x = Math.sin(t * 8) * 0.4;
      arms[1].rotation.x = -Math.sin(t * 8) * 0.4;
    } else {
      arms[0].rotation.x *= 0.85; arms[1].rotation.x *= 0.85;
    }
  };
  return g;
}

/* ----------------------------- ZEBRA ---------------------------- */
export function createZebra() {
  const g = new THREE.Group();
  const white = mat(0xf0ece0), black = mat(0x2a2620);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.7, 4, 8), white);
  torso.rotation.z = Math.PI / 2; torso.position.y = 0.95; torso.castShadow = true; g.add(torso);
  // listras
  for (let i = 0; i < 5; i++) {
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.05, 4, 10), black);
    stripe.position.set(-0.35 + i * 0.18, 0.95, 0); stripe.rotation.y = Math.PI / 2; g.add(stripe);
  }
  const legs = addLegs(g, black, { spreadX: 0.28, spreadZ: 0.24, h: 0.85, y: 0.42 });
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.5, 6), white);
  neck.position.set(0.5, 1.2, 0); neck.rotation.z = -0.7; g.add(neck);
  const head = new THREE.Group();
  const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), white);
  head.add(skull);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.12), black);
  snout.position.set(0.16, -0.04, 0); head.add(snout);
  head.position.set(0.75, 1.5, 0); g.add(head);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.4, 5), black);
  tail.position.set(-0.6, 1.0, 0); tail.rotation.z = 0.4; g.add(tail);
  return { group: g, animate: animator(g, legs, { head, tail, bodyBaseY: 0.95 }) };
}

/* ---------------------------- GIRAFA ---------------------------- */
export function createGiraffe() {
  const g = new THREE.Group();
  const tan = mat(0xe0b050), spot = mat(0xa07028);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.6, 4, 8), tan);
  torso.rotation.z = Math.PI / 2; torso.position.y = 1.5; torso.castShadow = true; g.add(torso);
  // manchas
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 0), spot);
    s.position.set((Math.random() - 0.5) * 0.7, 1.5 + (Math.random() - 0.5) * 0.5, 0.38);
    g.add(s);
  }
  const legs = addLegs(g, tan, { spreadX: 0.32, spreadZ: 0.28, h: 1.3, y: 0.65 });
  // pescoço bem longo
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.6, 6), tan);
  neck.position.set(0.55, 2.4, 0); neck.rotation.z = -0.5; g.add(neck);
  const head = new THREE.Group();
  const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 1), tan);
  head.add(skull);
  for (const dx of [-0.08, 0.08]) {
    const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 5), spot);
    horn.position.set(dx, 0.2, 0); head.add(horn);
  }
  head.position.set(1.05, 3.1, 0); g.add(head);
  return { group: g, animate: animator(g, legs, { head, bodyBaseY: 1.5 }) };
}

/* ----------------------------- URSO ----------------------------- */
export function createBear() {
  const g = new THREE.Group();
  const brown = mat(0x6b4326), dark = mat(0x4a2e18);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 0.6, 4, 8), brown);
  torso.rotation.z = Math.PI / 2; torso.position.y = 0.9; torso.castShadow = true; g.add(torso);
  const legs = addLegs(g, dark, { spreadX: 0.34, spreadZ: 0.3, h: 0.6, y: 0.3 });
  const head = new THREE.Group();
  const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 1), brown);
  head.add(skull);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.2), dark);
  snout.position.set(0, -0.06, 0.3); head.add(snout);
  for (const dx of [-0.2, 0.2]) {
    const ear = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 0), brown);
    ear.position.set(dx, 0.3, 0); head.add(ear);
  }
  head.position.set(0.6, 1.05, 0); g.add(head);
  return { group: g, animate: animator(g, legs, { head, bodyBaseY: 0.9 }) };
}

/* ---------------------------- MACACO ---------------------------- */
export function createMonkey() {
  const g = new THREE.Group();
  const brown = mat(0x7a5230), light = mat(0xc99a6a);
  const torso = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), brown);
  torso.scale.set(1, 1.2, 0.9); torso.position.y = 0.65; torso.castShadow = true; g.add(torso);
  const legs = addLegs(g, brown, { spreadX: 0.18, spreadZ: 0.16, h: 0.4, y: 0.2 });
  const head = new THREE.Group();
  const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1), brown);
  head.add(skull);
  const face = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 1), light);
  face.position.set(0, -0.02, 0.12); face.scale.set(1, 1, 0.6); head.add(face);
  for (const dx of [-0.2, 0.2]) {
    const ear = new THREE.Mesh(new THREE.CircleGeometry(0.08, 8), brown);
    ear.position.set(dx, 0, 0); ear.material.side = THREE.DoubleSide; head.add(ear);
  }
  head.position.set(0.3, 1.1, 0); g.add(head);
  // cauda curva
  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.04, 5, 10, Math.PI * 1.3), brown);
  tail.position.set(-0.35, 0.65, 0); tail.rotation.set(0, 0, -0.5); g.add(tail);
  return { group: g, animate: animator(g, legs, { head, bodyBaseY: 0.65 }) };
}

/** Mapa espécie → fábrica, para a missão usar por nome. */
export const ANIMAL_FACTORY = {
  'Leões': createLion,
  'Elefantes': createElephant,
  'Ovelhas': createSheep,
  'Camelos': createCamel,
  'Cervos': createDeer,
  'Zebras': createZebra,
  'Girafas': createGiraffe,
  'Ursos': createBear,
  'Macacos': createMonkey,
};

/* -------------------- GIGANTE (figura sombria) -------------------- */
/** Figura colossal e sombria — "os gigantes daqueles dias" (Gn 6:4).
 *  Estilizada como uma silhueta escura e ameaçadora, não realista. */
export function createGiant() {
  const g = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1622, roughness: 1, flatShading: true, emissive: 0x0a0810 });
  const darker = new THREE.MeshStandardMaterial({ color: 0x0e0b16, roughness: 1, flatShading: true });

  // tronco enorme
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, 6, 7), dark);
  torso.position.y = 7; torso.castShadow = true; g.add(torso);
  // ombros largos
  const shoulders = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4, 1), dark);
  shoulders.position.y = 9.5; shoulders.scale.set(1.4, 0.7, 1); shoulders.castShadow = true; g.add(shoulders);
  // cabeça
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, 1), dark);
  head.position.y = 11.6; head.castShadow = true; g.add(head);
  // olhos brilhantes (a única luz)
  for (const dx of [-0.5, 0.5]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff6a2a }));
    eye.position.set(dx, 11.7, 1.1); g.add(eye);
  }
  // braços longos
  const arms = [];
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 6.5, 6), darker);
    arm.position.set(s * 2.6, 7.5, 0); arm.rotation.z = s * 0.25; arm.castShadow = true;
    g.add(arm); arms.push(arm);
  }
  // pernas
  const legs = [];
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 5, 6), darker);
    leg.position.set(s * 1, 2.5, 0); leg.castShadow = true; g.add(leg); legs.push(leg);
  }

  g.userData.animate = (t, walking) => {
    if (walking) {
      legs[0].rotation.x = Math.sin(t * 3) * 0.4;
      legs[1].rotation.x = -Math.sin(t * 3) * 0.4;
      arms[0].rotation.x = -Math.sin(t * 3) * 0.3;
      arms[1].rotation.x = Math.sin(t * 3) * 0.3;
    }
    g.children[2].rotation.z = Math.sin(t * 0.8) * 0.05; // cabeça
  };
  g.userData.arms = arms;
  return g;
}

/* -------------------- GOLIAS (gigante filisteu) -------------------- */
/** Golias — guerreiro filisteu colossal, com armadura de bronze.
 *  Estilizado, imponente mas não sombrio (é humano, não demônio). */
export function createGoliath() {
  const g = new THREE.Group();
  const bronze = mat(0x9a7b3a, 0.6), bronzeD = mat(0x6e5526, 0.6);
  const skin = mat(0xc89a6a, 0.8), tunic = mat(0x6a2a2a, 0.9);

  // pernas
  const legs = [];
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 3.2, 7), bronzeD);
    leg.position.set(s * 0.6, 1.6, 0); leg.castShadow = true; g.add(leg); legs.push(leg);
  }
  // túnica/saiote
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 1.6, 8), tunic);
  skirt.position.y = 3.6; skirt.castShadow = true; g.add(skirt);
  // tronco com couraça
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 2.6, 8), bronze);
  torso.position.y = 5.4; torso.castShadow = true; g.add(torso);
  // ombros
  const shoulders = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), bronze);
  shoulders.position.y = 6.6; shoulders.scale.set(1.4, 0.6, 1); shoulders.castShadow = true; g.add(shoulders);
  // cabeça + elmo
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 2), skin);
  head.position.y = 7.6; head.castShadow = true; g.add(head);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.78, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), bronze);
  helmet.position.y = 7.7; g.add(helmet);
  // a TESTA (alvo) — pequeno marcador claro
  const target = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), mat(0xe8c0a0, 0.5));
  target.position.set(0, 7.75, 0.62); g.add(target);
  g.userData.targetWorld = target;
  // braços
  const arms = [];
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 2.8, 6), skin);
    arm.position.set(s * 1.4, 5.4, 0); arm.rotation.z = s * 0.2; arm.castShadow = true;
    g.add(arm); arms.push(arm);
  }
  // lança na mão direita
  const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 6, 6), mat(0x5a3d22));
  spear.position.set(1.8, 5.5, 0); g.add(spear);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 6), bronze);
  tip.position.set(1.8, 8.6, 0); g.add(tip);

  g.userData.animate = (t, walking) => {
    if (walking) {
      legs[0].rotation.x = Math.sin(t * 2.5) * 0.25;
      legs[1].rotation.x = -Math.sin(t * 2.5) * 0.25;
    }
    g.children[g.children.length - 5].rotation.z = Math.sin(t * 0.6) * 0.04;
  };
  return g;
}

/* -------------------- DAVI (jovem pastor) -------------------- */
export function createDavid() {
  const g = new THREE.Group();
  const tunic = mat(0xc8a050, 0.9), tunicD = mat(0xa07c38, 0.9), skin = mat(0xd8a878, 0.8);
  const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.45, 1.1, 8), tunic);
  robe.position.y = 0.85; robe.castShadow = true; g.add(robe);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.5, 8), tunicD);
  skirt.position.y = 0.35; g.add(skirt);
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 2), skin);
  head.position.y = 1.6; head.castShadow = true; g.add(head);
  const hair = new THREE.Mesh(new THREE.IcosahedronGeometry(0.29, 1), mat(0x5a3d22, 1));
  hair.position.y = 1.66; hair.scale.set(1, 0.8, 1); g.add(hair);
  // braços
  const arms = [];
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.4, 4, 6), tunic);
    arm.position.set(s * 0.35, 1.0, 0); g.add(arm); arms.push(arm);
  }
  g.userData.arms = arms;
  g.userData.animate = (t, moving) => {
    if (moving) { arms[0].rotation.x = Math.sin(t * 8) * 0.4; arms[1].rotation.x = -Math.sin(t * 8) * 0.4; }
  };
  return g;
}
