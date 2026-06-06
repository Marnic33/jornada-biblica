import * as THREE from 'three';
import { createSky } from '../engine/Scenery.js';

/**
 * FloodScene — cena cinematográfica 3D do dilúvio (o jogador assiste).
 *
 * Usa a Engine existente. Constrói: mar estilizado com ondas, arca
 * flutuando e balançando, chuva em partículas, relâmpagos e céu
 * tempestuoso. Tem fases internas controladas por tempo:
 *   0-4s   : céu escurece, chuva começa, água subindo
 *   4-9s   : arca se ergue e passa a flutuar/balançar no mar aberto
 *   9s+    : navega na tempestade (loop) até onComplete ser chamado
 *
 * skipCallback permite avançar com um toque/clique.
 */
export class FloodScene {
  constructor(engine, audio, { onDone } = {}) {
    this.engine = engine;
    this.audio = audio;
    this.onDone = onDone;
    this.t = 0;
    this.done = false;
  }

  setup() {
    const scene = this.engine.scene;

    // céu tempestuoso
    this.engine.setupAtmosphere({
      skyColor: 0x2a3340, fogColor: 0x3a4450, fogNear: 30, fogFar: 130,
      sunColor: 0x8a98b0, sunIntensity: 0.7, sunPos: [-30, 40, -20],
      ambientColor: 0x6a7488, ambientIntensity: 0.5,
      hemiSky: 0x5a6478, hemiGround: 0x2a3038, hemiIntensity: 0.5,
    });
    this.sky = createSky(scene, { top: 0x1e2733, bottom: 0x4a5468 });

    // MAR estilizado com ondas (plano com vértices animados)
    this.seaGeo = new THREE.PlaneGeometry(400, 400, 60, 60);
    this.sea = new THREE.Mesh(this.seaGeo, new THREE.MeshStandardMaterial({
      color: 0x2a5a78, roughness: 0.35, metalness: 0.4,
      transparent: true, opacity: 0.95, flatShading: true,
    }));
    this.sea.rotation.x = -Math.PI / 2;
    this.sea.position.y = -3; // começa baixo, vai subir
    this.sea.receiveShadow = true;
    scene.add(this.sea);
    this._seaBase = this.seaGeo.attributes.position.array.slice();

    // ARCA (grupo) — começa pousada, depois flutua
    this.ark = this._buildArk();
    this.ark.position.set(0, 0, 0);
    scene.add(this.ark);

    // CHUVA — partículas
    this._buildRain();

    // nuvens escuras baixas
    this.stormClouds = [];
    for (let i = 0; i < 14; i++) {
      const c = new THREE.Mesh(
        new THREE.IcosahedronGeometry(4 + Math.random() * 4, 0),
        new THREE.MeshStandardMaterial({ color: 0x3a4452, roughness: 1, flatShading: true, transparent: true, opacity: 0.9 })
      );
      c.position.set((Math.random() - 0.5) * 160, 30 + Math.random() * 20, (Math.random() - 0.5) * 160);
      c.scale.y = 0.5; scene.add(c); this.stormClouds.push(c);
    }

    // relâmpago (luz que pisca)
    this.lightning = new THREE.PointLight(0xcfe0ff, 0, 200);
    this.lightning.position.set(0, 50, -30);
    scene.add(this.lightning);
    this._nextBolt = 2 + Math.random() * 3;

    // câmera cinematográfica
    this.engine.camera.position.set(24, 12, 30);

    // legenda narrativa
    this._caption = document.createElement('div');
    this._caption.className = 'flood-caption';
    this._caption.innerHTML = `
      <p id="flood-text">"E veio o dilúvio sobre a terra..."</p>
      <button id="flood-skip" class="btn btn-ghost">Pular ⏭</button>
    `;
    document.getElementById('app').appendChild(this._caption);
    requestAnimationFrame(() => this._caption.classList.add('show'));
    this._captions = [
      { at: 0, text: '"E veio o dilúvio sobre a terra..." — Gênesis 7:6' },
      { at: 4.5, text: '"As águas prevaleceram e a arca flutuou sobre as águas." — Gênesis 7:18' },
      { at: 9, text: '"E ficou somente Noé, e os que com ele estavam na arca." — Gênesis 7:23' },
    ];
    this._capIndex = 0;
    document.getElementById('flood-skip').onclick = () => this.finish();

    this.engine.onUpdate((dt) => this.update(dt));
  }

  _buildArk() {
    const ark = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: 0x7a4f2a, roughness: 0.85, flatShading: true });
    const woodDark = new THREE.MeshStandardMaterial({ color: 0x5a3a1d, roughness: 0.85, flatShading: true });
    const hull = new THREE.Mesh(new THREE.BoxGeometry(20, 6, 10), wood);
    hull.position.y = 3; hull.castShadow = true; ark.add(hull);
    const bow = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 9), woodDark);
    bow.position.set(11, 3.2, 0); bow.rotation.z = 0.42; ark.add(bow);
    const stern = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 9), woodDark);
    stern.position.set(-11, 3.2, 0); stern.rotation.z = -0.42; ark.add(stern);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(13, 5, 8), woodDark);
    cabin.position.y = 8.5; cabin.castShadow = true; ark.add(cabin);
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 5.5, 14, 4),
      new THREE.MeshStandardMaterial({ color: 0x9a4020, roughness: 0.85, flatShading: true }));
    roof.rotation.z = Math.PI / 2; roof.position.y = 12; ark.add(roof);
    for (let i = -9; i <= 9; i += 2) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(0.15, 6, 0.3), woodDark);
      plank.position.set(i, 3, 5.05); ark.add(plank);
    }
    return ark;
  }

  _buildRain() {
    const count = 2500;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    this._rainVel = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 140;
      pos[i * 3 + 1] = Math.random() * 80;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 140;
      this._rainVel[i] = 30 + Math.random() * 30;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const matRain = new THREE.PointsMaterial({
      color: 0xaac4e0, size: 0.35, transparent: true, opacity: 0.6, sizeAttenuation: true,
    });
    this.rain = new THREE.Points(geo, matRain);
    this.engine.scene.add(this.rain);
  }

  update(dt) {
    if (this.done) return;
    this.t += dt;

    // legendas
    if (this._capIndex < this._captions.length && this.t >= this._captions[this._capIndex].at) {
      document.getElementById('flood-text').textContent = this._captions[this._capIndex].text;
      this._capIndex++;
    }

    // água subindo (fase 1)
    if (this.t < 5) {
      this.sea.position.y = -3 + (this.t / 5) * 5; // sobe de -3 a +2
    } else {
      this.sea.position.y = 2;
    }

    // ondas no mar
    const arr = this.seaGeo.attributes.position.array;
    for (let i = 0; i < arr.length; i += 3) {
      const x = this._seaBase[i], y = this._seaBase[i + 1];
      arr[i + 2] = Math.sin(x * 0.05 + this.t * 1.5) * 1.2 + Math.cos(y * 0.06 + this.t * 1.2) * 1.0;
    }
    this.seaGeo.attributes.position.needsUpdate = true;
    this.seaGeo.computeVertexNormals();

    // arca: pousada até 4s, depois flutua e balança
    if (this.t < 4) {
      this.ark.position.y = 0;
    } else {
      const floatT = this.t - 4;
      const targetY = this.sea.position.y - 0.5;
      this.ark.position.y += (targetY - this.ark.position.y) * Math.min(floatT * 0.5, 1) * dt * 3;
      // balanço
      this.ark.rotation.z = Math.sin(this.t * 1.1) * 0.06;
      this.ark.rotation.x = Math.sin(this.t * 0.8 + 1) * 0.04;
      this.ark.position.y += Math.sin(this.t * 1.3) * 0.15;
    }

    // chuva caindo
    const rpos = this.rain.geometry.attributes.position.array;
    for (let i = 0; i < this._rainVel.length; i++) {
      rpos[i * 3 + 1] -= this._rainVel[i] * dt;
      if (rpos[i * 3 + 1] < this.sea.position.y) {
        rpos[i * 3 + 1] = 70 + Math.random() * 20;
        rpos[i * 3] = (Math.random() - 0.5) * 140;
        rpos[i * 3 + 2] = (Math.random() - 0.5) * 140;
      }
    }
    this.rain.geometry.attributes.position.needsUpdate = true;

    // câmera orbita devagar ao redor da arca
    const ang = this.t * 0.12;
    this.engine.camera.position.x = Math.cos(ang) * 32;
    this.engine.camera.position.z = Math.sin(ang) * 32;
    this.engine.camera.position.y = 11 + Math.sin(this.t * 0.5) * 2;
    this.engine.camera.lookAt(this.ark.position.x, this.ark.position.y + 5, this.ark.position.z);

    // relâmpagos
    this._nextBolt -= dt;
    if (this._nextBolt <= 0) {
      this.lightning.intensity = 6;
      this.lightning.position.set((Math.random() - 0.5) * 80, 50, (Math.random() - 0.5) * 80);
      this._nextBolt = 2.5 + Math.random() * 4;
      this.audio?.thunder?.();
    } else {
      this.lightning.intensity *= 0.82; // decai rápido (flash)
    }

    // termina sozinha após ~14s (ou ao pular)
    if (this.t > 14) this.finish();
  }

  finish() {
    if (this.done) return;
    this.done = true;
    this._caption?.classList.remove('show');
    setTimeout(() => this._caption?.remove(), 500);
    this.onDone?.();
  }

  dispose() {
    this._caption?.remove();
  }
}
