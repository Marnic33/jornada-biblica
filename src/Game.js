import { Engine } from './engine/Engine.js';
import { HUD } from './ui/HUD.js';
import { Hub } from './ui/Hub.js';
import { WinScreen } from './ui/WinScreen.js';
import { AudioManager } from './engine/AudioManager.js';

/**
 * Game — orquestra o fluxo: Hub → Missão → Vitória → Hub.
 * Mantém uma única Engine viva e troca o conteúdo da cena entre missões.
 */
export class Game {
  constructor(root) {
    this.root = root;
    this.engine = new Engine(root);
    this.engine.start();
    this.hud = new HUD(root);
    this.winScreen = new WinScreen(root);
    this.audio = new AudioManager();
    this.currentMission = null;
    this._showHub();
  }

  _showHub() {
    this.hud.hide();
    if (this.hub) this.hub.dispose();
    this.hub = new Hub(this.root, (MissionClass) => this._startMission(MissionClass));
    this.hub.show();
  }

  _startMission(MissionClass) {
    this.hub.hide();
    if (this.currentMission) this.currentMission.dispose();
    this.engine.clearUpdates();
    this.engine.clearScene();
    this.engine.setPaused(false);

    // áudio começa a partir do clique (exigência do navegador)
    this.audio.startMusic();

    this.currentMission = new MissionClass(this.engine, this.hud, this.audio);
    this.currentMission.onComplete = (meta) => this._onMissionComplete(meta);
    this.currentMission.setup();
    this._lastMissionClass = MissionClass;

    // conecta os botões do HUD
    this.hud.bindControls({
      onPause: () => this.engine.setPaused(true),
      onResume: () => this.engine.setPaused(false),
      onRestart: () => this._startMission(MissionClass),
      onHub: () => this._returnToHub(),
      onToggleSound: (muted) => this.audio.setMuted(muted),
    });
  }

  _returnToHub() {
    if (this.currentMission) { this.currentMission.dispose(); this.currentMission = null; }
    this.engine.clearScene();
    this.engine.setPaused(false);
    this.audio.stopMusic();
    this._showHub();
  }

  _onMissionComplete(meta) {
    try {
      const done = JSON.parse(localStorage.getItem('jb-completed') || '[]');
      if (!done.includes(meta.id)) {
        done.push(meta.id);
        localStorage.setItem('jb-completed', JSON.stringify(done));
      }
    } catch {}
    this.hud.hide();
    this.winScreen.show(meta, {
      onReplay: () => this._startMission(this._lastMissionClass),
      onHub: () => this._returnToHub(),
    });
  }
}
