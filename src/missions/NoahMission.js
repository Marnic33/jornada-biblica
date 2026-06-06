import * as THREE from 'three';
import { Mission } from './Mission.js';
import { createTerrain, scatterTrees, createRock, createCreature, createHuman } from '../engine/WorldBuilder.js';
import { PlayerController } from '../engine/PlayerController.js';

const PAIRS = [
  { name: 'Leões',     bodyColor: 0xc8923a, accent: 0x8a5a1a, bodyScale: [1.4, 1.0, 0.9], headScale: 1.1 },
  { name: 'Elefantes', bodyColor: 0x9a9a9a, accent: 0x7a7a7a, bodyScale: [1.7, 1.4, 1.2], headScale: 1.3, height: 1.4 },
  { name: 'Ovelhas',   bodyColor: 0xe8e2d0, accent: 0x3a2a1a, bodyScale: [1.3, 0.9, 0.9], headScale: 0.9, height: 0.85 },
  { name: 'Camelos',   bodyColor: 0xb48a52, accent: 0x9a7240, bodyScale: [1.3, 1.5, 0.8], headScale: 1.0, height: 1.4 },
  { name: 'Cervos',    bodyColor: 0x8a5a32, accent: 0xe8e4dc, bodyScale: [1.3, 1.1, 0.85], headScale: 0.95, height: 1.15 },
];

const VERSES = [
  { t: 'Faze uma arca de madeira de gofer; farás compartimentos na arca e a betumarás por dentro e por fora.', r: 'Gênesis 6:14' },
  { t: 'De tudo o que vive, de toda a carne, dois de cada espécie farás entrar na arca, para os conservar vivos.', r: 'Gênesis 6:19' },
  { t: 'Entrou Noé na arca, e com ele seus filhos, sua mulher e as mulheres de seus filhos.', r: 'Gênesis 7:7' },
  { t: 'Entraram para junto de Noé na arca, dois a dois, de toda carne em que havia fôlego de vida.', r: 'Gênesis 7:15' },
  { t: 'E os que entraram eram macho e fêmea de toda carne; e o Senhor fechou a porta.', r: 'Gênesis 7:16' },
];

export class NoahMission extends Mission {
  static meta = {
    id: 'noe',
    title: 'Noé e a Arca',
    subtitle: 'Reúna os pares de animais e conduza-os à arca antes do dilúvio.',
    reference: 'Gênesis 6 — 7',
    icon: '🛟',
    accent: '#cf9f43',
  };

  setup() {
    this.animals = [];
    this.collectedPairs = 0;
    this.target = PAIRS.length;
    this.creatureAnimators = [];

    this.engine.setupAtmosphere({
      skyColor: 0x2a1d0d, fogColor: 0x3a2810, fogNear: 28, fogFar: 95,
      sunColor: 0xffb55c, sunIntensity: 2.4, sunPos: [-35, 50, 25],
      ambientColor: 0xffd9a0, ambientIntensity: 0.5,
    });

    // terreno + caminho
    this.engine.scene.add(createTerrain({ size: 150, color: 0x6b8e3d, amplitude: 0.55 }));
    const path = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 44),
      new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 1 })
    );
    path.rotation.x = -Math.PI / 2; path.position.set(0, 0.03, -10);
    path.receiveShadow = true; this.engine.scene.add(path);

    this._buildArk();

    scatterTrees(this.engine.scene, 30, {
      area: 110,
      avoid: (x, z) => Math.abs(x) < 5 || (z < -14 && Math.abs(x) < 14),
    });
    for (let i = 0; i < 12; i++) {
      const r = createRock({ scale: 0.5 + Math.random() * 1.2 });
      r.position.set((Math.random() - 0.5) * 110, 0, (Math.random() - 0.5) * 110);
      this.engine.scene.add(r);
    }

    // jogador (Noé)
    this.noah = createHuman({ robeColor: 0x9a7b4f });
    this.noah.position.set(0, 0, 16);
    this.engine.scene.add(this.noah);
    this.controller = new PlayerController(this.engine, this.noah, { speed: 9, bounds: 70 });

    this._spawnAnimals();

    // HUD
    this.ui.setCounterLabel('Pares na Arca');
    this.ui.setCounter(0, this.target);
    this.ui.setObjective('Aproxime-se de cada animal para que ele o siga, e conduza os pares até a porta da arca.');
    this.ui.setControls('Mover: <b>W A S D</b> ou <b>setas</b> · Aproxime-se dos animais · Leve-os à <b>arca</b>');
    this._updateList();
    this.ui.show();
    this.ui.showVerse(VERSES[0].t, VERSES[0].r);

    this.engine.onUpdate((dt, t) => this.update(dt, t));
  }

  _buildArk() {
    const ark = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.9, flatShading: true });
    const woodDark = new THREE.MeshStandardMaterial({ color: 0x4f3219, roughness: 0.9, flatShading: true });

    const hull = new THREE.Mesh(new THREE.BoxGeometry(18, 5.5, 9), wood);
    hull.position.y = 2.75; hull.castShadow = true; hull.receiveShadow = true; ark.add(hull);
    const bow = new THREE.Mesh(new THREE.BoxGeometry(3.5, 4.5, 8), woodDark);
    bow.position.set(10, 2.9, 0); bow.rotation.z = 0.4; bow.castShadow = true; ark.add(bow);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(12, 4.5, 7), woodDark);
    cabin.position.y = 7.7; cabin.castShadow = true; ark.add(cabin);
    const roof = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 5, 13, 4),
      new THREE.MeshStandardMaterial({ color: 0x8a3a1a, roughness: 0.85, flatShading: true })
    );
    roof.rotation.z = Math.PI / 2; roof.position.y = 11; roof.castShadow = true; ark.add(roof);
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.4, 2.6),
      new THREE.MeshStandardMaterial({ color: 0x2a1a0c }));
    door.position.set(-9, 1.9, 0); ark.add(door);
    // tábuas verticais decorativas
    for (let i = -8; i <= 8; i += 2) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(0.15, 5.4, 0.3), woodDark);
      plank.position.set(i, 2.75, 4.55); ark.add(plank);
    }

    ark.position.set(0, 0, -24);
    this.engine.scene.add(ark);
    this.arkZone = new THREE.Vector3(-9, 0, -24);
  }

  _spawnAnimals() {
    PAIRS.forEach((pair, i) => {
      for (let k = 0; k < 2; k++) {
        const c = createCreature(pair);
        let x, z;
        do {
          x = (Math.random() - 0.5) * 90;
          z = (Math.random() * 0.55 + 0.1) * 44 - 4;
        } while (Math.abs(x) < 4);
        c.group.position.set(x, 0, z);
        c.group.rotation.y = Math.random() * Math.PI * 2;
        this.engine.scene.add(c.group);
        this.animals.push({
          obj: c.group, animate: c.animate, name: pair.name,
          partnerId: i, collected: false, following: false,
          wander: Math.random() * Math.PI * 2,
        });
        this.creatureAnimators.push(c);
      }
    });
  }

  _updateList() {
    this.ui.setList(PAIRS.map((p, i) => ({
      label: p.name,
      done: this.animals.filter(a => a.partnerId === i && a.collected).length === 2,
    })));
  }

  update(dt, t) {
    this.controller.update(dt);
    const pp = this.noah.position;
    let followIndex = 0;

    for (const a of this.animals) {
      let moving = false;
      if (a.collected) {
        a.animate(t, false);
        continue;
      }
      const dist = a.obj.position.distanceTo(pp);
      if (!a.following && dist < 2.6) {
        a.following = true;
        this.ui.showVerse(VERSES[Math.min(a.partnerId, VERSES.length - 1)].t,
                          VERSES[Math.min(a.partnerId, VERSES.length - 1)].r);
      }
      if (a.following) {
        followIndex++;
        const offset = 1.8 + followIndex * 1.4;
        const dir = new THREE.Vector3().subVectors(pp, a.obj.position);
        const d = dir.length();
        if (d > offset) {
          dir.normalize();
          a.obj.position.x += dir.x * 6.5 * dt;
          a.obj.position.z += dir.z * 6.5 * dt;
          a.obj.rotation.y = Math.atan2(dir.x, dir.z);
          moving = true;
        }
        if (a.obj.position.distanceTo(this.arkZone) < 4.5) {
          a.collected = true; a.following = false;
          a.obj.position.copy(this.arkZone);
          a.obj.position.x += (Math.random() - 0.5) * 2.5;
          a.obj.position.z += (Math.random() - 0.5) * 2.5;
          this._checkProgress();
        }
      } else {
        a.wander += (Math.random() - 0.5) * dt * 2;
        a.obj.position.x += Math.sin(a.wander) * 0.5 * dt;
        a.obj.position.z += Math.cos(a.wander) * 0.5 * dt;
        a.obj.rotation.y = a.wander;
        moving = Math.random() < 0.5;
      }
      a.animate(t, moving);
    }
  }

  _checkProgress() {
    this.collectedPairs = PAIRS.reduce((acc, _, i) =>
      acc + (this.animals.filter(a => a.partnerId === i && a.collected).length === 2 ? 1 : 0), 0);
    this.ui.setCounter(this.collectedPairs, this.target);
    this._updateList();
    if (this.collectedPairs >= this.target) {
      setTimeout(() => this.complete(), 900);
    }
  }
}
