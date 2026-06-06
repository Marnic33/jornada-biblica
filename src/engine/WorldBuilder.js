import * as THREE from 'three';

/**
 * WorldBuilder — fábrica de geometria estilizada refinada.
 * Reutilizável por todas as missões. Sem assets externos.
 */

export function createTerrain({ size = 140, color = 0x6b8e3d, amplitude = 0.5, segments = 60 } = {}) {
  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    const h = (Math.sin(x * 0.25) * Math.cos(y * 0.25) +
               Math.sin(x * 0.07 + 2) * 1.5) * amplitude;
    pos.setZ(i, h);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  return mesh;
}

export function createTree({ scale = 1, leafColor = 0x3f6b2a, trunkColor = 0x5a3d22 } = {}) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.4, 2.4, 7),
    new THREE.MeshStandardMaterial({ color: trunkColor, roughness: 1, flatShading: true })
  );
  trunk.position.y = 1.2; trunk.castShadow = true; g.add(trunk);
  // copa em camadas (estilizado, low-poly)
  for (let i = 0; i < 3; i++) {
    const leaf = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.5 - i * 0.35, 0),
      new THREE.MeshStandardMaterial({ color: leafColor, roughness: 1, flatShading: true })
    );
    leaf.position.y = 2.8 + i * 0.9;
    leaf.rotation.y = Math.random() * Math.PI;
    leaf.castShadow = true; g.add(leaf);
  }
  g.scale.setScalar(scale);
  return g;
}

export function scatterTrees(scene, count, { area = 90, avoid = () => false, leafColor } = {}) {
  for (let i = 0; i < count; i++) {
    let x, z, tries = 0;
    do {
      x = (Math.random() - 0.5) * area;
      z = (Math.random() - 0.5) * area;
      tries++;
    } while (avoid(x, z) && tries < 20);
    const t = createTree({ scale: 0.7 + Math.random() * 0.8, leafColor });
    t.position.set(x, 0, z);
    t.rotation.y = Math.random() * Math.PI * 2;
    scene.add(t);
  }
}

export function createRock({ scale = 1, color = 0x7a7068 } = {}) {
  const geo = new THREE.DodecahedronGeometry(1, 0);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(i,
      pos.getX(i) * (0.8 + Math.random() * 0.4),
      pos.getY(i) * (0.7 + Math.random() * 0.4),
      pos.getZ(i) * (0.8 + Math.random() * 0.4));
  }
  geo.computeVertexNormals();
  const rock = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true }));
  rock.scale.setScalar(scale); rock.castShadow = true; rock.receiveShadow = true;
  return rock;
}

/**
 * Cria uma criatura estilizada (quadrúpede ou bípede) a partir de um perfil.
 * Profile: { bodyColor, bodyScale:[x,y,z], legColor, legs:4|2, height, accent }
 * Retorna { group, animate(t) } — animate faz idle bob + balanço de pernas.
 */
export function createCreature(profile = {}) {
  const {
    bodyColor = 0xc8923a, bodyScale = [1.4, 1.0, 0.9], legColor,
    legs = 4, height = 1.0, accent = null, headScale = 1
  } = profile;
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.85, flatShading: true });
  const legMat = new THREE.MeshStandardMaterial({ color: legColor ?? bodyColor, roughness: 0.9, flatShading: true });

  // corpo
  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), mat);
  body.scale.set(...bodyScale);
  body.position.y = 0.6 * height + 0.25;
  body.castShadow = true; g.add(body);

  // cabeça
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3 * headScale, 1), mat);
  head.position.set(0.7 * bodyScale[0], 0.7 * height + 0.35, 0);
  head.castShadow = true; g.add(head);

  // detalhe de cor (crina, presas etc.)
  if (accent) {
    const acc = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32 * headScale, 0),
      new THREE.MeshStandardMaterial({ color: accent, roughness: 1, flatShading: true }));
    acc.position.copy(head.position); acc.position.x -= 0.12; acc.scale.setScalar(1.05);
    g.add(acc);
  }

  // pernas
  const legMeshes = [];
  const legPositions = legs === 4
    ? [[-0.4, -0.3], [0.4, -0.3], [-0.4, 0.3], [0.4, 0.3]]
    : [[0, -0.2], [0, 0.2]];
  for (const [dx, dz] of legPositions) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.55 * height, 6), legMat);
    leg.position.set(dx * bodyScale[0], 0.27 * height, dz);
    leg.castShadow = true; g.add(leg); legMeshes.push(leg);
  }

  const seed = Math.random() * 10;
  return {
    group: g,
    animate(t, moving) {
      g.children[0].position.y = (0.6 * height + 0.25) + Math.sin(t * 3 + seed) * 0.04;
      if (moving) {
        legMeshes.forEach((leg, i) => {
          leg.rotation.x = Math.sin(t * 10 + i * Math.PI) * 0.5;
        });
      } else {
        legMeshes.forEach(leg => { leg.rotation.x *= 0.85; });
      }
    }
  };
}

/** Personagem humano estilizado (túnica + cajado), reutilizável. */
export function createHuman({ robeColor = 0x9a7b4f, skinColor = 0xd8a878, staff = true } = {}) {
  const g = new THREE.Group();
  const robe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.7, 1.6, 8),
    new THREE.MeshStandardMaterial({ color: robeColor, roughness: 0.9, flatShading: true })
  );
  robe.position.y = 0.9; robe.castShadow = true; g.add(robe);
  const head = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.32, 2),
    new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.8 })
  );
  head.position.y = 1.95; head.castShadow = true; g.add(head);
  const beard = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.26, 1),
    new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 1, flatShading: true })
  );
  beard.position.set(0, 1.78, 0.12); beard.scale.set(1, 0.85, 0.65); g.add(beard);
  if (staff) {
    const s = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 2.5, 6),
      new THREE.MeshStandardMaterial({ color: 0x4f3219, roughness: 1 })
    );
    s.position.set(0.62, 1.05, 0); s.rotation.z = 0.12; g.add(s);
  }
  return g;
}
