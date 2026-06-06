/**
 * Definição dos níveis da missão Noé.
 * Cada nível cresce em espécies, área e pressão de tempo (o dilúvio).
 *
 * Ajustar dificuldade aqui é trivial — sem tocar na lógica do jogo.
 * Para adicionar um nível, basta acrescentar um objeto ao array.
 */
export const NOAH_LEVELS = [
  {
    n: 1,
    name: 'O Chamado',
    species: ['Ovelhas', 'Cervos', 'Camelos'],
    timeLimit: 0,            // 0 = sem cronômetro (introdução tranquila)
    area: 90,
    intro: 'Deus chamou Noé. Comece reunindo os primeiros animais — sem pressa.',
  },
  {
    n: 2,
    name: 'Reunindo o Rebanho',
    species: ['Leões', 'Elefantes', 'Ovelhas', 'Camelos', 'Cervos'],
    timeLimit: 180,          // segundos
    area: 120,
    intro: 'As nuvens se formam. Reúna os cinco pares antes que o tempo se esgote.',
  },
  {
    n: 3,
    name: 'Antes do Dilúvio',
    species: ['Leões', 'Elefantes', 'Ovelhas', 'Camelos', 'Cervos', 'Zebras', 'Girafas'],
    timeLimit: 210,
    area: 140,
    intro: 'O céu escurece. Sete espécies aguardam — o dilúvio se aproxima.',
  },
  {
    n: 4,
    name: 'A Última Hora',
    species: ['Leões', 'Elefantes', 'Ovelhas', 'Camelos', 'Cervos', 'Zebras', 'Girafas', 'Ursos', 'Macacos'],
    timeLimit: 240,
    area: 160,
    intro: 'As primeiras gotas caem. Salve todas as nove espécies antes do fim!',
  },
];

/**
 * Metadados de cada espécie para a fase de organização na arca.
 * - type: 'predador' ou 'presa' (predadores não podem ficar ao lado de presas)
 * - emoji: ícone usado na vista da arca
 */
export const SPECIES_INFO = {
  'Leões':     { type: 'predador', emoji: '🦁' },
  'Ursos':     { type: 'predador', emoji: '🐻' },
  'Ovelhas':   { type: 'presa',    emoji: '🐑' },
  'Cervos':    { type: 'presa',    emoji: '🦌' },
  'Camelos':   { type: 'presa',    emoji: '🐫' },
  'Elefantes': { type: 'presa',    emoji: '🐘' },
  'Zebras':    { type: 'presa',    emoji: '🦓' },
  'Girafas':   { type: 'presa',    emoji: '🦒' },
  'Macacos':   { type: 'presa',    emoji: '🐒' },
};
