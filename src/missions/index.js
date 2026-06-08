import { NoahMission } from './NoahMission.js';
import { DavidMission } from './DavidMission.js';

/**
 * Registro de missões disponíveis.
 * ── PARA ADICIONAR UMA NOVA HISTÓRIA ──
 * 1. Crie src/missions/XMission.js estendendo Mission.
 * 2. Importe-a aqui.
 * 3. Adicione no array abaixo.
 * O hub e o roteamento se atualizam sozinhos.
 */
export const MISSIONS = [
  NoahMission,
  DavidMission,
];

/** Missões "em breve" — exibidas no hub como bloqueadas/inspiradoras. */
export const UPCOMING = [
  { id: 'moises', title: 'Moisés e o Mar Vermelho', icon: '🌊', reference: 'Êxodo 14', accent: '#5fa8c5' },
  { id: 'daniel', title: 'Daniel na Cova dos Leões', icon: '🦁', reference: 'Daniel 6', accent: '#d4a853' },
];
