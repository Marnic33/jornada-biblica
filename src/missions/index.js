import { NoahMission } from './NoahMission.js';

/**
 * Registro de missões disponíveis.
 * ── PARA ADICIONAR UMA NOVA HISTÓRIA ──
 * 1. Crie src/missions/DavidMission.js estendendo Mission.
 * 2. Importe-a aqui.
 * 3. Adicione no array abaixo.
 * O hub e o roteamento se atualizam sozinhos.
 *
 * Missões futuras planejadas (já com lugar reservado no hub):
 *   - DavidMission  (Davi e Golias — mira/funda)
 *   - MosesMission  (Moisés e o Mar Vermelho — travessia)
 */
export const MISSIONS = [
  NoahMission,
];

/** Missões "em breve" — exibidas no hub como bloqueadas/inspiradoras. */
export const UPCOMING = [
  { id: 'davi', title: 'Davi e Golias', icon: '🪨', reference: '1 Samuel 17', accent: '#a9c5d4' },
  { id: 'moises', title: 'Moisés e o Mar Vermelho', icon: '🌊', reference: 'Êxodo 14', accent: '#5fa8c5' },
  { id: 'daniel', title: 'Daniel na Cova dos Leões', icon: '🦁', reference: 'Daniel 6', accent: '#d4a853' },
];
