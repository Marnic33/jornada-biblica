/**
 * Mission — contrato base que toda história bíblica implementa.
 *
 * O sistema garante extensibilidade: para adicionar uma nova missão
 * (Davi e Golias, Moisés...), basta criar uma classe que estende Mission,
 * implementar setup()/update()/dispose() e registrá-la em missions/index.js.
 * Nada mais no projeto precisa mudar.
 */
export class Mission {
  /** Metadados estáticos exibidos no hub de seleção. */
  static meta = {
    id: 'base',
    title: 'Missão',
    subtitle: '',
    reference: '',
    icon: '📖',
    accent: '#d4a853',
  };

  constructor(engine, ui) {
    this.engine = engine;
    this.ui = ui;
    this.onComplete = null; // callback definido pelo Game
  }

  /** Constrói a cena, HUD e objetivos. Chamado uma vez ao iniciar. */
  setup() {}

  /** Chamado a cada frame pela Engine. dt em segundos. */
  update(dt, elapsed) {}

  /** Limpeza ao sair da missão. */
  dispose() {
    this.engine.clearUpdates();
    this.engine.clearScene();
  }

  /** A missão chama isto quando o objetivo é cumprido. */
  complete() {
    this.onComplete?.(this.constructor.meta);
  }
}
