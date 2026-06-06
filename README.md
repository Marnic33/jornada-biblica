# Jornada Bíblica — Jogo 3D de Missões

Plataforma de jogos 3D para conhecer e viver as histórias da Bíblia.
Construído com **Vite + Three.js**. Geometria estilizada refinada,
iluminação atmosférica (tone mapping ACES + bloom), arquitetura modular
pronta para crescer missão a missão.

## Como rodar

```bash
npm install
npm run dev      # desenvolvimento (abre em localhost:5173)
npm run build    # gera /dist para deploy
npm run preview  # testa o build
```

Para publicar: faça o `build` e suba a pasta `dist/` no Netlify
(arrastar e soltar, ou conectar o repositório).

## Missão atual

**Noé e a Arca** — explore o cenário com WASD/setas, aproxime-se dos
animais para que o sigam, e conduza cada par até a porta da arca.
Versículos do Gênesis surgem ao longo da jornada.

## Arquitetura (por que é fácil acrescentar missões)

```
src/
├─ engine/
│  ├─ Engine.js            ← núcleo: renderer, cena, luzes, bloom, loop
│  ├─ WorldBuilder.js      ← fábrica de terreno, árvores, criaturas, humanos
│  └─ PlayerController.js  ← movimento + câmera 3ª pessoa
├─ missions/
│  ├─ Mission.js           ← CONTRATO base que toda história implementa
│  ├─ NoahMission.js       ← exemplo completo
│  └─ index.js             ← registro (adicione novas missões aqui)
├─ ui/
│  ├─ Hub.js               ← tela de seleção de missões
│  ├─ HUD.js               ← painéis, contador, versículos
│  └─ WinScreen.js         ← tela de vitória
├─ Game.js                 ← orquestra Hub → Missão → Vitória
└─ main.js                 ← ponto de entrada
```

## Como adicionar uma nova missão (ex.: Davi e Golias)

1. Crie `src/missions/DavidMission.js`:

```js
import { Mission } from './Mission.js';

export class DavidMission extends Mission {
  static meta = {
    id: 'davi', title: 'Davi e Golias',
    subtitle: 'Enfrente o gigante com fé e uma funda.',
    reference: '1 Samuel 17', icon: '🪨', accent: '#a9c5d4',
  };
  setup() { /* construir cena, usar WorldBuilder, definir objetivo */ }
  update(dt, t) { /* lógica por frame; chame this.complete() ao vencer */ }
}
```

2. Registre em `src/missions/index.js`:

```js
import { DavidMission } from './DavidMission.js';
export const MISSIONS = [NoahMission, DavidMission];
```

Pronto. O hub, o roteamento, o salvamento de progresso e a tela de
vitória reconhecem a nova missão automaticamente. Nada mais muda.

## Progresso

As missões concluídas são salvas no `localStorage` e aparecem marcadas
no hub. (Quando quiser sincronizar entre dispositivos ou adicionar
multiplayer, trocamos por Supabase.)

## Próximos passos sugeridos

- Davi e Golias (mira com funda — física de projétil)
- Moisés e o Mar Vermelho (travessia com tempo)
- Trocar geometria estilizada por modelos GLTF onde quiser mais detalhe
  (a estrutura já está pronta — o WorldBuilder vira um GLTFLoader)
- Som ambiente e narração (pode reaproveitar a base do SermonStudio AI)
