import { Engine } from './engine/Engine.js';
import { HUD } from './ui/HUD.js';
import { Hub } from './ui/Hub.js';
import { WinScreen } from './ui/WinScreen.js';
import { LevelSelect } from './ui/LevelSelect.js';
import { AudioManager } from './engine/AudioManager.js';
import { NOAH_LEVELS } from './missions/noahLevels.js';

/**
 * Game — orquestra o fluxo:
 *   Hub → (Noé) LevelSelect → Missão → Vitória/Falha → LevelSelect
 * Mantém uma única Engine viva e troca o conteúdo da cena.
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
    this.audio.stopMusic();
    if (this.hub) this.hub.dispose();
    if (this.levelSelect) { this.levelSelect.dispose(); this.levelSelect = null; }
    this.hub = new Hub(this.root, (MissionClass) => this._onMissionChosen(MissionClass));
    this.hub.show();
  }

  _onMissionChosen(MissionClass) {
    this.hub.hide();
    this._currentMissionClass = MissionClass;
    // Noé tem níveis → mostra a seleção de níveis
    if (MissionClass.meta.id === 'noe') {
      this._showLevelSelect();
    } else {
      this._startMission(MissionClass, null);
    }
  }

  _showLevelSelect() {
    if (this.levelSelect) this.levelSelect.dispose();
    this.levelSelect = new LevelSelect(
      this.root,
      (level) => { this.levelSelect.hide(); this._startMission(this._currentMissionClass, level); },
      () => { this.levelSelect.hide(); this._showHub(); }
    );
    this.levelSelect.show();
  }

  _startMission(MissionClass, level) {
    if (this.currentMission) this.currentMission.dispose();
    this.engine.clearUpdates();
    this.engine.clearScene();
    this.engine.setPaused(false);
    this.audio.startMusic();

    this.currentMission = new MissionClass(this.engine, this.hud, this.audio, level);
    this.currentMission.onComplete = (meta) => this._onMissionComplete(meta);
    this.currentMission.onFail = (lv) => this._onLevelFail(lv);
    this.currentMission.setup();
    this._lastLevel = level;

    this.hud.bindControls({
      onPause: () => this.engine.setPaused(true),
      onResume: () => this.engine.setPaused(false),
      onRestart: () => this._startMission(MissionClass, level),
      onHub: () => this._returnHome(),
      onToggleSound: (muted) => this.audio.setMuted(muted),
    });
  }

  _returnHome() {
    if (this.currentMission) { this.currentMission.dispose(); this.currentMission = null; }
    this.engine.clearScene();
    this.engine.setPaused(false);
    this.audio.stopMusic();
    // volta à seleção de níveis se for Noé, senão ao hub
    if (this._currentMissionClass?.meta.id === 'noe') this._showLevelSelect();
    else this._showHub();
  }

  _onMissionComplete(meta) {
    try {
      const done = JSON.parse(localStorage.getItem('jb-completed') || '[]');
      if (!done.includes(meta.id)) { done.push(meta.id); localStorage.setItem('jb-completed', JSON.stringify(done)); }
    } catch {}
    this.hud.hide();
    const lv = this._lastLevel;
    const hasNext = lv && NOAH_LEVELS.some(l => l.n === lv.n + 1);
    this.winScreen.show(meta, {
      level: lv,
      hasNext,
      onReplay: () => this._startMission(this._currentMissionClass, lv),
      onNext: hasNext ? () => {
        const next = NOAH_LEVELS.find(l => l.n === lv.n + 1);
        this._startMission(this._currentMissionClass, next);
      } : null,
      onHub: () => this._returnHome(),
    });
  }

  _onLevelFail(lv) {
    this.audio.stopMusic();
    this.hud.hide();
    this.winScreen.showFail(lv, {
      onRetry: () => this._startMission(this._currentMissionClass, lv),
      onHub: () => this._returnHome(),
    });
  }
}
