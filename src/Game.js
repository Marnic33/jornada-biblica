import { Engine } from './engine/Engine.js';
import { HUD } from './ui/HUD.js';
import { Hub } from './ui/Hub.js';
import { WinScreen } from './ui/WinScreen.js';
import { LevelSelect } from './ui/LevelSelect.js';
import { ArkInterior } from './ui/ArkInterior.js';
import { ArkCare } from './ui/ArkCare.js';
import { Joystick } from './ui/Joystick.js';
import { FloodScene } from './ui/FloodScene.js';
import { RainbowScene } from './ui/RainbowScene.js';
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
    this.joystick = new Joystick(root, this.engine);
    this.joystick.el.style.display = 'none'; // só durante a exploração
    this.currentMission = null;
    this._showHub();
  }

  _setJoystick(visible) {
    if (!this.joystick) return;
    this.joystick.el.style.display = (visible && Joystick.shouldShow()) ? 'block' : 'none';
  }

  _showHub() {
    this.hud.hide();
    this._setJoystick(false);
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
    // após reunir os pares, abre a fase de organizar a arca (só Noé)
    if (MissionClass.meta.id === 'noe') {
      this.currentMission.onGatherComplete = (species) => this._showArkInterior(species);
    }
    this.currentMission.setup();
    this._lastLevel = level;
    // joystick só em missões com avatar que anda livre (Noé); Davi é mira
    this._setJoystick(MissionClass.meta.id === 'noe');

    this.hud.bindControls({
      onPause: () => { this.engine.setPaused(true); this._setJoystick(false); },
      onResume: () => { this.engine.setPaused(false); this._setJoystick(true); },
      onRestart: () => this._startMission(MissionClass, level),
      onHub: () => this._returnHome(),
      onToggleSound: (muted) => this.audio.setMuted(muted),
    });
  }

  _showArkInterior(species) {
    this.hud.hide();
    this._setJoystick(false);
    this.engine.setPaused(true);
    if (this.arkInterior) this.arkInterior.dispose();
    this.arkInterior = new ArkInterior(this.root, species, this.audio, {
      onComplete: () => {
        this.arkInterior.hide();
        this._showFlood(species);
      },
      onBack: () => {
        // pular tudo: conclui o nível direto
        this.arkInterior.hide();
        this.engine.setPaused(false);
        this.currentMission.complete();
      },
    });
    this.arkInterior.show();
  }

  _showFlood(species) {
    // cena 3D cinematográfica: usa a Engine, limpa a cena anterior
    this.engine.clearUpdates();
    this.engine.clearScene();
    this.engine.setPaused(false);
    this.floodScene = new FloodScene(this.engine, this.audio, {
      onDone: () => {
        this.floodScene.dispose(); this.floodScene = null;
        this._showArkCare(species);
      },
    });
    this.floodScene.setup();
  }

  _showArkCare(species) {
    // volta para a tela 2D de cuidar; pausa o 3D ao fundo
    this.engine.setPaused(true);
    if (this.arkCare) this.arkCare.dispose();
    this.arkCare = new ArkCare(this.root, species, this.audio, {
      onComplete: () => {
        this.arkCare.hide();
        this._showRainbow();
      },
      onFail: () => {
        this.arkCare.hide();
        this._onLevelFail(this._lastLevel);
      },
      onBack: () => {
        this.arkCare.hide();
        this._showRainbow();
      },
    });
    this.arkCare.show();
    this.arkCare.start();
  }

  _showRainbow() {
    // final glorioso 3D
    this.engine.clearUpdates();
    this.engine.clearScene();
    this.engine.setPaused(false);
    this.rainbowScene = new RainbowScene(this.engine, this.audio, {
      onDone: () => {
        this.rainbowScene.dispose(); this.rainbowScene = null;
        this.currentMission.complete();
      },
    });
    this.rainbowScene.setup();
  }

  _returnHome() {
    if (this.floodScene) { this.floodScene.dispose(); this.floodScene = null; }
    if (this.rainbowScene) { this.rainbowScene.dispose(); this.rainbowScene = null; }
    if (this.arkCare) { this.arkCare.dispose(); this.arkCare = null; }
    if (this.arkInterior) { this.arkInterior.dispose(); this.arkInterior = null; }
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
