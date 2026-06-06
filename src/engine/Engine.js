import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/**
 * Engine — núcleo reutilizável para todas as missões.
 * Cuida de: renderer, cena, câmera, luzes, pós-processamento,
 * loop de animação, input de teclado e redimensionamento.
 * Cada missão recebe a Engine e popula a cena com seu conteúdo.
 */
export class Engine {
  constructor(container) {
    this.container = container;
    this.keys = {};
    this.updateCallbacks = [];
    this.clock = new THREE.Clock();

    this._initRenderer();
    this._initScene();
    this._initCamera();
    this._initPostProcessing();
    this._initInput();

    window.addEventListener('resize', () => this._onResize());
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Tone mapping cinematográfico — base do "realismo"
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);
  }

  _initScene() {
    this.scene = new THREE.Scene();
  }

  _initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      55, window.innerWidth / window.innerHeight, 0.1, 400
    );
    this.camera.position.set(0, 14, 20);
  }

  _initPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    // Bloom suave — dá o brilho dourado da atmosfera bíblica
    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.55,  // força
      0.6,   // raio
      0.85   // limiar (só luzes fortes brilham)
    );
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
  }

  _initInput() {
    window.addEventListener('keydown', (e) => { this.keys[e.key.toLowerCase()] = true; });
    window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });
  }

  /** Aplica um preset de iluminação atmosférica. Missões podem customizar. */
  setupAtmosphere({ skyColor = 0x2a1d0d, fogColor = 0x3a2810, fogNear = 25, fogFar = 90,
                    sunColor = 0xffb55c, sunIntensity = 2.2, sunPos = [-30, 45, 20],
                    ambientColor = 0xffd9a0, ambientIntensity = 0.5,
                    hemiSky = 0xffe0b0, hemiGround = 0x3a2810, hemiIntensity = 0.45 } = {}) {
    this.scene.background = new THREE.Color(skyColor);
    this.scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);

    const ambient = new THREE.AmbientLight(ambientColor, ambientIntensity);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(sunColor, sunIntensity);
    sun.position.set(...sunPos);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 140;
    const d = 60;
    sun.shadow.camera.left = -d; sun.shadow.camera.right = d;
    sun.shadow.camera.top = d; sun.shadow.camera.bottom = -d;
    sun.shadow.bias = -0.0004;
    this.scene.add(sun);
    this.sun = sun;

    const hemi = new THREE.HemisphereLight(hemiSky, hemiGround, hemiIntensity);
    this.scene.add(hemi);

    return { ambient, sun, hemi };
  }

  onUpdate(cb) { this.updateCallbacks.push(cb); }

  clearUpdates() { this.updateCallbacks = []; }

  /** Remove todos os objetos da cena (usado ao trocar de missão). */
  clearScene() {
    while (this.scene.children.length > 0) {
      const obj = this.scene.children[0];
      this.scene.remove(obj);
      obj.traverse?.((c) => {
        c.geometry?.dispose?.();
        if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
        else c.material?.dispose?.();
      });
    }
  }

  start() {
    const loop = () => {
      this._raf = requestAnimationFrame(loop);
      const dt = Math.min(this.clock.getDelta(), 0.05);
      for (const cb of this.updateCallbacks) cb(dt, this.clock.elapsedTime);
      this.composer.render();
    };
    loop();
  }

  stop() { cancelAnimationFrame(this._raf); }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }
}
