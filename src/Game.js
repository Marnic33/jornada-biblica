import { Engine } from './engine/Engine.js';
import { HUD } from './ui/HUD.js';
import { Hub } from './ui/Hub.js';
import { WinScreen } from './ui/WinScreen.js';

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
    // limpa missão anterior
    if (this.currentMission) this.currentMission.dispose();
    this.engine.clearUpdates();
    this.engine.clearScene();

    this.currentMission = new MissionClass(this.engine, this.hud);
    this.currentMission.onComplete = (meta) => this._onMissionComplete(meta);
    this.currentMission.setup();
    this._lastMissionClass = MissionClass;
  }

  _onMissionComplete(meta) {
    // salva progresso
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
      onHub: () => {
        if (this.currentMission) { this.currentMission.dispose(); this.currentMission = null; }
        this.engine.clearScene();
        this._showHub();
      },
    });
  }
}
