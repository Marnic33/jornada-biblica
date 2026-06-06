import * as THREE from 'three';

/**
 * Scenery — elementos de ambientação ricos e reutilizáveis:
 * céu em gradiente (skydome), montanhas distantes, rio, nuvens,
 * vegetação variada (árvores em camadas, arbustos, juncos).
 */

function mat(color, rough = 1) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, flatShading: true });
}

/** Céu em domo com gradiente vertical (pôr-do-sol bíblico). */
export function createSky(scene, { top = 0x2a4a6e, bottom = 0xf0a860 } = {}) {
  const geo = new THREE.SphereGeometry(280, 32, 16);
  const matSky = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      topColor: { value: new THREE.Color(top) },
      bottomColor: { value: new THREE.Color(bottom) },
      offset: { value: 30 }, exponent: { value: 0.7 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPosition = wp.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 topColor; uniform vec3 bottomColor;
      uniform float offset; uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        float f = max(pow(max(h, 0.0), exponent), 0.0);
        gl_FragColor = vec4(mix(bottomColor, topColor, f), 1.0);
      }`,
  });
  const sky = new THREE.Mesh(geo, matSky);
  scene.add(sky);
  return sky;
}

/** Anel de montanhas low-poly ao redor do mundo. */
export function createMountains(scene, { radius = 130, count = 22, color = 0x5a6b4a } = {}) {
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const h = 14 + Math.random() * 22;
    const r = radius + (Math.random() - 0.5) * 25;
    const m = new THREE.Mesh(new THREE.ConeGeometry(10 + Math.random() * 8, h, 4 + (i % 3)),
      mat(new THREE.Color(color).offsetHSL(0, 0, (Math.random() - 0.5) * 0.08).getHex()));
    m.position.set(Math.cos(a) * r, h / 2 - 2, Math.sin(a) * r);
    m.rotation.y = Math.random() * Math.PI;
    // pico nevado nos mais altos
    if (h > 26) {
      const snow = new THREE.Mesh(new THREE.ConeGeometry(4, h * 0.3, 4), mat(0xf0f0f0));
      snow.position.set(0, h * 0.35, 0); m.add(snow);
    }
    group.add(m);
  }
  scene.add(group);
  return group;
}

/** Rio curvo atravessando o terreno. */
export function createRiver(scene, { color = 0x3a7a9a } = {}) {
  const shape = new THREE.Shape();
  shape.moveTo(-70, -4); shape.lineTo(-70, 4);
  shape.quadraticCurveTo(0, 8, 70, -2);
  shape.lineTo(70, -10); shape.quadraticCurveTo(0, 0, -70, -12);
  const geo = new THREE.ShapeGeometry(shape);
  const water = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color, roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.85,
  }));
  water.rotation.x = -Math.PI / 2; water.position.set(0, 0.08, 30);
  scene.add(water);
  return water;
}

/** Nuvens volumétricas simples (grupos de esferas achatadas). */
export function createClouds(scene, { count = 9 } = {}) {
  const clouds = [];
  for (let i = 0; i < count; i++) {
    const c = new THREE.Group();
    const n = 3 + Math.floor(Math.random() * 3);
    for (let j = 0; j < n; j++) {
      const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(2 + Math.random() * 2, 0),
        new THREE.MeshStandardMaterial({ color: 0xfff4e6, roughness: 1, flatShading: true, transparent: true, opacity: 0.9 }));
      puff.position.set(j * 2.5 - n, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 2);
      puff.scale.y = 0.6; c.add(puff);
    }
    c.position.set((Math.random() - 0.5) * 180, 40 + Math.random() * 25, (Math.random() - 0.5) * 180);
    c.userData.drift = 0.4 + Math.random() * 0.6;
    scene.add(c); clouds.push(c);
  }
  return clouds;
}

/** Árvore frondosa em camadas (mais cheia que a antiga). */
export function createLushTree({ scale = 1 } = {}) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.45, 2.8, 7), mat(0x5a3d22));
  trunk.position.y = 1.4; trunk.castShadow = true; g.add(trunk);
  const greens = [0x3a6b28, 0x457a2e, 0x386423];
  for (let i = 0; i < 4; i++) {
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7 - i * 0.32, 0), mat(greens[i % 3]));
    leaf.position.set((Math.random() - 0.5) * 0.5, 3 + i * 0.85, (Math.random() - 0.5) * 0.5);
    leaf.rotation.set(Math.random(), Math.random() * Math.PI, Math.random());
    leaf.castShadow = true; g.add(leaf);
  }
  g.scale.setScalar(scale);
  return g;
}

/** Arbusto baixo. */
export function createBush({ scale = 1 } = {}) {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5 + Math.random() * 0.3, 0), mat(0x4a7a38));
    b.position.set((Math.random() - 0.5) * 0.6, 0.4, (Math.random() - 0.5) * 0.6);
    b.castShadow = true; g.add(b);
  }
  g.scale.setScalar(scale);
  return g;
}

/** Espalha vegetação variada evitando zonas proibidas. */
export function scatterVegetation(scene, { area = 120, trees = 26, bushes = 18, avoid = () => false } = {}) {
  const place = (factory, scaleMin, scaleMax) => {
    let x, z, tries = 0;
    do { x = (Math.random() - 0.5) * area; z = (Math.random() - 0.5) * area; tries++; }
    while (avoid(x, z) && tries < 25);
    const obj = factory({ scale: scaleMin + Math.random() * (scaleMax - scaleMin) });
    obj.position.set(x, 0, z);
    obj.rotation.y = Math.random() * Math.PI * 2;
    scene.add(obj);
  };
  for (let i = 0; i < trees; i++) place(createLushTree, 0.7, 1.4);
  for (let i = 0; i < bushes; i++) place(createBush, 0.7, 1.3);
}
