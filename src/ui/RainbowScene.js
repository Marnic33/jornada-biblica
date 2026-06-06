import * as THREE from 'three';
import { createSky } from '../engine/Scenery.js';

/**
 * RainbowScene — final glorioso (o jogador assiste).
 * A tempestade passa: o sol volta, a pomba voa com o ramo de oliveira,
 * e o arco-íris aparece sobre a arca — o pacto.
 */
export class RainbowScene {
  constructor(engine, audio, { onDone } = {}) {
    this.engine = engine;
    this.audio = audio;
    this.onDone = onDone;
    this.t = 0;
    this.done = false;
  }

  setup() {
    const scene = this.engine.scene;

    this.engine.setupAtmosphere({
      skyColor: 0x7ab8e0, fogColor: 0xbfe0f0, fogNear: 50, fogFar: 180,
      sunColor: 0xfff0d0, sunIntensity: 2.6, sunPos: [30, 45, 20],
      ambientColor: 0xfff4e0, ambientIntensity: 0.7,
      hemiSky: 0xbfe0ff, hemiGround: 0x6fa03d, hemiIntensity: 0.6,
    });
    this.sky = createSky(scene, { top: 0x5aa8e0, bottom: 0xffe6c0 });

    // mar calmo
    this.seaGeo = new THREE.PlaneGeometry(400, 400, 50, 50);
    this.sea = new THREE.Mesh(this.seaGeo, new THREE.MeshStandardMaterial({
      color: 0x4a90b8, roughness: 0.3, metalness: 0.4, flatShading: true,
    }));
    this.sea.rotation.x = -Math.PI / 2; this.sea.position.y = 1.5;
    scene.add(this.sea);
    this._seaBase = this.seaGeo.attributes.position.array.slice();

    this.ark = this._buildArk();
    this.ark.position.set(0, 1, 0);
    scene.add(this.ark);

    // ARCO-ÍRIS — sete arcos concêntricos
    this.rainbow = new THREE.Group();
    const colors = [0xff595e, 0xff924c, 0xffca3a, 0x8ac926, 0x52a675, 0x1982c4, 0x6a4c93];
    colors.forEach((col, i) => {
      const r = 38 - i * 1.4;
      const tube = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.7, 8, 60, Math.PI),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0 })
      );
      tube.position.y = 2;
      this.rainbow.add(tube);
    });
    this.rainbow.position.set(0, 0, -30);
    scene.add(this.rainbow);

    // POMBA com ramo
    this.dove = this._buildDove();
    scene.add(this.dove);

    // sol brilhante
    const sunBall = new THREE.Mesh(
      new THREE.SphereGeometry(6, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfff2d0 })
    );
    sunBall.position.set(50, 40, -40);
    scene.add(sunBall);

    this.engine.camera.position.set(20, 12, 34);

    this._caption = document.createElement('div');
    this._caption.className = 'flood-caption';
    this._caption.innerHTML = `
      <p id="rain-text">"E a pomba voltou a ele... e eis que trazia uma folha de oliveira." — Gênesis 8:11</p>
      <button id="rain-cont" class="btn">Continuar</button>
    `;
    document.getElementById('app').appendChild(this._caption);
    requestAnimationFrame(() => this._caption.classList.add('show'));
    this._captions = [
      { at: 0, text: '"E a pomba voltou a ele... e eis que trazia uma folha de oliveira." — Gênesis 8:11' },
      { at: 4, text: '"Porei o meu arco nas nuvens... por sinal do concerto entre mim e a terra." — Gênesis 9:13' },
    ];
    this._capIndex = 0;
    document.getElementById('rain-cont').onclick = () => this.finish();

    this.audio?.victory?.();
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
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(13, 5, 8), woodDark);
    cabin.position.y = 8.5; ark.add(cabin);
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 5.5, 14, 4),
      new THREE.MeshStandardMaterial({ color: 0x9a4020, roughness: 0.85, flatShading: true }));
    roof.rotation.z = Math.PI / 2; roof.position.y = 12; ark.add(roof);
    return ark;
  }

  _buildDove() {
    const g = new THREE.Group();
    const white = new THREE.MeshStandardMaterial({ color: 0xfdfdfd, roughness: 0.6, flatShading: true });
    const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), white);
    body.scale.set(1.4, 0.9, 0.9); g.add(body);
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 1), white);
    head.position.set(0.55, 0.25, 0); g.add(head);
    // asas
    this.wings = [];
    for (const s of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 0), white);
      wing.scale.set(0.3, 0.15, 1.1); wing.position.set(0, 0.1, s * 0.5);
      g.add(wing); this.wings.push(wing);
    }
    // ramo de oliveira
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 4),
      new THREE.MeshStandardMaterial({ color: 0x4a6b28 }));
    branch.position.set(0.8, 0.05, 0); branch.rotation.z = 0.5; g.add(branch);
    g.scale.setScalar(1.6);
    return g;
  }

  update(dt) {
    if (this.done) return;
    this.t += dt;

    if (this._capIndex < this._captions.length && this.t >= this._captions[this._capIndex].at) {
      document.getElementById('rain-text').textContent = this._captions[this._capIndex].text;
      this._capIndex++;
    }

    // ondas suaves
    const arr = this.seaGeo.attributes.position.array;
    for (let i = 0; i < arr.length; i += 3) {
      const x = this._seaBase[i], y = this._seaBase[i + 1];
      arr[i + 2] = Math.sin(x * 0.04 + this.t) * 0.6 + Math.cos(y * 0.05 + this.t * 0.8) * 0.5;
    }
    this.seaGeo.attributes.position.needsUpdate = true;
    this.seaGeo.computeVertexNormals();

    // arca balança de leve
    this.ark.rotation.z = Math.sin(this.t * 0.8) * 0.03;
    this.ark.position.y = 1 + Math.sin(this.t) * 0.1;

    // arco-íris surge gradualmente (fade-in dos arcos, um a um)
    this.rainbow.children.forEach((tube, i) => {
      const start = 3 + i * 0.3;
      if (this.t > start) tube.material.opacity = Math.min(0.85, tube.material.opacity + dt * 0.6);
    });

    // pomba voa em arco ao redor da arca
    const a = this.t * 0.5;
    this.dove.position.set(Math.cos(a) * 14, 9 + Math.sin(this.t * 0.7) * 1.5, Math.sin(a) * 14 - 5);
    this.dove.rotation.y = -a + Math.PI / 2;
    // bater de asas
    this.wings.forEach((w, i) => { w.rotation.x = Math.sin(this.t * 12) * 0.6 * (i ? 1 : -1); });

    // câmera lenta
    this.engine.camera.position.x = 18 + Math.sin(this.t * 0.2) * 6;
    this.engine.camera.position.y = 12;
    this.engine.camera.lookAt(0, 6, -8);
  }

  finish() {
    if (this.done) return;
    this.done = true;
    this._caption?.classList.remove('show');
    setTimeout(() => this._caption?.remove(), 500);
    this.onDone?.();
  }

  dispose() { this._caption?.remove(); }
}
