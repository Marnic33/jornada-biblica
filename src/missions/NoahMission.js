import * as THREE from 'three';
import { Mission } from './Mission.js';
import { createTerrain } from '../engine/WorldBuilder.js';
import { PlayerController } from '../engine/PlayerController.js';
import { ANIMAL_FACTORY, createNoah } from '../engine/Creatures.js';
import { createSky, createMountains, createRiver, createClouds, scatterVegetation } from '../engine/Scenery.js';
import { NOAH_LEVELS } from './noahLevels.js';

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

  constructor(engine, ui, audio, level) {
    super(engine, ui);
    this.audio = audio;
    this.level = level || NOAH_LEVELS[0];
    this.onFail = null;
  }

  setup() {
    this.animals = [];
    this.collectedPairs = 0;
    this.species = this.level.species;
    this.target = this.species.length;
    this.clouds = [];
    this.timeLeft = this.level.timeLimit || 0;
    this.failed = false;
    this.finished = false;

    // céu/atmosfera escurecem conforme o nível avança (tensão do dilúvio)
    const darkness = Math.min((this.level.n - 1) * 0.12, 0.4);
    this.engine.setupAtmosphere({
      skyColor: 0x2a1d0d, fogColor: 0xc88a4a, fogNear: 60, fogFar: 200,
      sunColor: 0xffd29a, sunIntensity: 2.6 - darkness * 2, sunPos: [-40, 55, 30],
      ambientColor: 0xffe0b8, ambientIntensity: 0.55 - darkness * 0.3,
      hemiSky: 0xffe8c0, hemiGround: 0x4a6b30, hemiIntensity: 0.5,
    });
    createSky(this.engine.scene, {
      top: this.level.n >= 3 ? 0x4a5570 : 0x3a6ea5,
      bottom: this.level.n >= 3 ? 0xc89060 : 0xf4b070,
    });
    this.clouds = createClouds(this.engine.scene, { count: 8 + this.level.n * 3 });
    createMountains(this.engine.scene, { radius: 135, count: 24, color: 0x5a6b4a });

    this.engine.scene.add(createTerrain({ size: 200, color: 0x6fa03d, amplitude: 0.6, segments: 80 }));
    createRiver(this.engine.scene, { color: 0x3a7a9a });

    const path = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 50),
      new THREE.MeshStandardMaterial({ color: 0x9a7340, roughness: 1 })
    );
    path.rotation.x = -Math.PI / 2; path.position.set(0, 0.04, -12);
    path.receiveShadow = true; this.engine.scene.add(path);

    this._buildArk();

    const treeObstacles = scatterVegetation(this.engine.scene, {
      area: this.level.area + 30, trees: 28, bushes: 20,
      avoid: (x, z) => Math.abs(x) < 6 || (z < -16 && Math.abs(x) < 16) || (Math.abs(z - 30) < 8),
    });
    // obstáculos sólidos do mundo: árvores + arca (caixa grande aproximada por círculo)
    this.obstacles = [
      ...treeObstacles,
      { x: 2, z: -26, r: 9 }, // casco da arca (deslocado p/ deixar a porta lateral livre)
    ];

    this.noah = createNoah();
    this.noah.position.set(0, 0, 18);
    this.engine.scene.add(this.noah);
    this.controller = new PlayerController(this.engine, this.noah, { speed: 9, bounds: 75, camHeight: 12, camDist: 16, radius: 0.9 });
    this.controller.setObstacles(this.obstacles);

    this._spawnAnimals();

    this.ui.setCounterLabel(`Nível ${this.level.n} · Pares`);
    this.ui.setCounter(0, this.target);
    this.ui.setObjective(this.level.intro);
    this.ui.setControls('Mover: <b>W A S D</b> ou <b>setas</b> · Aproxime-se dos animais · Leve-os à <b>arca</b>');
    this.ui.setTimer(this.level.timeLimit ? this.timeLeft : -1);
    this._updateList();
    this.ui.show();

    this.engine.onUpdate((dt, t) => this.update(dt, t));
  }

  _buildArk() {
    const ark = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: 0x7a4f2a, roughness: 0.85, flatShading: true });
    const woodDark = new THREE.MeshStandardMaterial({ color: 0x5a3a1d, roughness: 0.85, flatShading: true });

    const hull = new THREE.Mesh(new THREE.BoxGeometry(20, 6, 10), wood);
    hull.position.y = 3; hull.castShadow = true; hull.receiveShadow = true; ark.add(hull);
    const bow = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 9), woodDark);
    bow.position.set(11, 3.2, 0); bow.rotation.z = 0.42; bow.castShadow = true; ark.add(bow);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(13, 5, 8), woodDark);
    cabin.position.y = 8.5; cabin.castShadow = true; ark.add(cabin);
    const roof = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 5.5, 14, 4),
      new THREE.MeshStandardMaterial({ color: 0x9a4020, roughness: 0.85, flatShading: true })
    );
    roof.rotation.z = Math.PI / 2; roof.position.y = 12; roof.castShadow = true; ark.add(roof);
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.8, 3),
      new THREE.MeshStandardMaterial({ color: 0x2a1a0c }));
    door.position.set(-10, 2.1, 0); ark.add(door);
    for (let i = -9; i <= 9; i += 2) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(0.15, 6, 0.3), woodDark);
      plank.position.set(i, 3, 5.05); ark.add(plank);
    }
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(4, 0.3, 6), wood);
    ramp.position.set(-12, 0.6, 0); ramp.rotation.z = 0.18; ark.add(ramp);

    ark.position.set(0, 0, -26);
    this.engine.scene.add(ark);
    this.arkZone = new THREE.Vector3(-12, 0, -26);
  }

  _spawnAnimals() {
    const area = this.level.area;
    this.species.forEach((name, i) => {
      for (let k = 0; k < 2; k++) {
        const factory = ANIMAL_FACTORY[name];
        if (!factory) continue;
        const c = factory();
        let x, z;
        do {
          x = (Math.random() - 0.5) * area;
          z = (Math.random() * 0.55 + 0.08) * (area * 0.45) - 4;
        } while (Math.abs(x) < 5);
        c.group.position.set(x, 0, z);
        c.group.rotation.y = Math.random() * Math.PI * 2;
        this.engine.scene.add(c.group);
        this.animals.push({
          obj: c.group, animate: c.animate, name,
          partnerId: i, collected: false, following: false,
          wander: Math.random() * Math.PI * 2,
        });
      }
    });
  }

  _updateList() {
    this.ui.setList(this.species.map((name, i) => ({
      label: name,
      done: this.animals.filter(a => a.partnerId === i && a.collected).length === 2,
    })));
  }

  update(dt, t) {
    if (this.finished) return;
    this.controller.update(dt);
    this.noah.userData.animate?.(t, this.controller.moving);

    // cronômetro do dilúvio
    if (this.level.timeLimit && !this.failed) {
      this.timeLeft -= dt;
      this.ui.setTimer(this.timeLeft);
      if (this.timeLeft <= 0) { this._failLevel(); return; }
    }

    for (const c of this.clouds) {
      c.position.x += c.userData.drift * dt;
      if (c.position.x > 110) c.position.x = -110;
    }

    const pp = this.noah.position;
    let followIndex = 0;

    for (const a of this.animals) {
      let moving = false;
      if (a.collected) { a.animate(t, false); continue; }

      const dist = a.obj.position.distanceTo(pp);
      if (!a.following && dist < 2.8) {
        a.following = true;
        // versículo aparece só na PRIMEIRA vez que o jogador encosta num animal
        if (!this._verseShown) {
          this._verseShown = true;
          this.ui.showVerse(VERSES[0].t, VERSES[0].r, 4000);
        }
      }
      if (a.following) {
        followIndex++;
        const offset = 2.0 + followIndex * 1.5;
        const dir = new THREE.Vector3().subVectors(pp, a.obj.position);
        const d = dir.length();
        if (d > offset) {
          dir.normalize();
          a.obj.position.x += dir.x * 6.5 * dt;
          a.obj.position.z += dir.z * 6.5 * dt;
          a.obj.rotation.y = Math.atan2(dir.x, dir.z);
          moving = true;
        }
        this.controller.resolveCollisions(a.obj.position, 0.7);
        if (a.obj.position.distanceTo(this.arkZone) < 5) {
          a.collected = true; a.following = false;
          a.obj.position.copy(this.arkZone);
          a.obj.position.x += (Math.random() - 0.5) * 3;
          a.obj.position.z += (Math.random() - 0.5) * 3;
          this.audio?.collect();
          this._checkProgress();
        }
      } else {
        a.wander += (Math.random() - 0.5) * dt * 2;
        a.obj.position.x += Math.sin(a.wander) * 0.5 * dt;
        a.obj.position.z += Math.cos(a.wander) * 0.5 * dt;
        // mantém os animais dentro dos limites do mundo (não fogem mais!)
        const b = 72;
        if (Math.abs(a.obj.position.x) > b || Math.abs(a.obj.position.z) > b) {
          a.obj.position.x = Math.max(-b, Math.min(b, a.obj.position.x));
          a.obj.position.z = Math.max(-b, Math.min(b, a.obj.position.z));
          a.wander += Math.PI; // vira e volta para dentro
        }
        this.controller.resolveCollisions(a.obj.position, 0.7);
        a.obj.rotation.y = a.wander;
        moving = Math.random() < 0.4;
      }
      a.animate(t, moving);
    }
  }

  _checkProgress() {
    this.collectedPairs = this.species.reduce((acc, _, i) =>
      acc + (this.animals.filter(a => a.partnerId === i && a.collected).length === 2 ? 1 : 0), 0);
    this.ui.setCounter(this.collectedPairs, this.target);
    this._updateList();
    if (this.collectedPairs >= this.target) {
      this.finished = true;
      this.audio?.victory();
      this.ui.setTimer(-1); // para o cronômetro: animais a salvo
      // salva nível concluído
      try {
        const done = JSON.parse(localStorage.getItem('jb-noah-levels') || '[]');
        if (!done.includes(this.level.n)) { done.push(this.level.n); localStorage.setItem('jb-noah-levels', JSON.stringify(done)); }
      } catch {}
      // fase 2: organizar a arca (Game decide e depois chama complete)
      setTimeout(() => {
        if (this.onGatherComplete) this.onGatherComplete(this.species);
        else this.complete();
      }, 900);
    }
  }

  _failLevel() {
    this.failed = true;
    this.finished = true;
    this.ui.setTimer(-1);
    this.onFail?.(this.level);
  }
}
