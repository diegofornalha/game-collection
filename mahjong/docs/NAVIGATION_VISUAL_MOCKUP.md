# Mockup Visual - Sistema de Navegação Mahjong

## Layout Mobile (Bottom Navigation)

```
┌─────────────────────────────────────┐
│                                     │
│         [CONTEÚDO DA VIEW]          │
│                                     │
│   GameView / ProfileView / etc      │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  🏠    👤    ⚙️    🏆    🛍️  │
│ Início Perfil Config Conquis Loja  │
└─────────────────────────────────────┘
        ↑ Item ativo destacado
```

## Layout Desktop (Header Integration)

```
┌────────────────────────────────────────────────────┐
│ [Avatar] Nível 15 | 💎 1,250  [🏠][👤][⚙️][🏆][🛍️] │
├────────────────────────────────────────────────────┤
│                                                    │
│              [CONTEÚDO DA VIEW]                    │
│                                                    │
└────────────────────────────────────────────────────┘
```

## Estados do Menu

### Item Normal
```
┌─────────┐
│   🏠    │
│ Início  │
└─────────┘
```

### Item Ativo
```
┌─────────┐
│  [🏠]   │ ← Fundo destacado
│ Início  │ ← Cor primária
└─────────┘
```

### Item com Badge
```
┌─────────┐
│  🏆 (3) │ ← Badge vermelho
│Conquista│
└─────────┘
```

## Transições entre Views

### Slide Left (Navegação Forward)
```
Frame 1:          Frame 2:          Frame 3:
┌─────────┐      ┌─────────┐      ┌─────────┐
│ View A  │  →   │View A│B │  →   │ View B  │
└─────────┘      └─────────┘      └─────────┘
```

### Slide Right (Navegação Backward)
```
Frame 1:          Frame 2:          Frame 3:
┌─────────┐      ┌─────────┐      ┌─────────┐
│ View B  │  →   │B │View A│  →   │ View A  │
└─────────┘      └─────────┘      └─────────┘
```

## Estrutura das Views

### HomeView (Início)
```
┌─────────────────────────────────────┐
│          Mahjong Solitaire          │
│                                     │
│    [Avatar] Olá, {username}!        │
│                                     │
│  ┌─────────────────────────────┐   │
│  │    CONTINUAR JOGO            │   │
│  │    Tempo: 15:32              │   │
│  │    Pontos: 1,450             │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │    NOVO JOGO                 │   │
│  └─────────────────────────────┘   │
│                                     │
│  Sequência: 🔥 7 dias               │
│  Próxima recompensa em 2 dias       │
└─────────────────────────────────────┘
```

### ProfileView (Perfil)
```
┌─────────────────────────────────────┐
│            MEU PERFIL               │
│                                     │
│     [Avatar Grande]                 │
│     {username}                      │
│     Nível 15 (2,340/3,000 XP)      │
│                                     │
│  ╔═══════════════════════════════╗  │
│  ║ Estatísticas                  ║  │
│  ╟─────────────────────────────╢  │
│  ║ Jogos completados: 47        ║  │
│  ║ Melhor tempo: 8:15           ║  │
│  ║ Pontuação máxima: 3,200      ║  │
│  ║ Taxa de vitória: 68%         ║  │
│  ╚═══════════════════════════════╝  │
│                                     │
│  [Editar Perfil]  [Histórico]      │
└─────────────────────────────────────┘
```

### SettingsView (Configurações)
```
┌─────────────────────────────────────┐
│          CONFIGURAÇÕES              │
│                                     │
│  Som do Jogo              [ON/OFF]  │
│  ─────────────────────────────────  │
│  Música de Fundo          [ON/OFF]  │
│  ─────────────────────────────────  │
│  Velocidade Animação    [▮▮▮▯▯▯▯]  │
│  ─────────────────────────────────  │
│  Tema                  [Claro/Escuro]│
│  ─────────────────────────────────  │
│  Notificações            [ON/OFF]   │
│  ─────────────────────────────────  │
│                                     │
│  [Restaurar Padrões]                │
└─────────────────────────────────────┘
```

### AchievementsView (Conquistas)
```
┌─────────────────────────────────────┐
│          CONQUISTAS                 │
│                                     │
│  Desbloqueadas: 15/45              │
│  ▓▓▓▓▓▓▓▓░░░░░░░░░░░ 33%          │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🏆 Primeira Vitória          │   │
│  │ Complete seu primeiro jogo    │   │
│  │ ✅ Desbloqueada              │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🔥 Sequência de 7 Dias       │   │
│  │ Jogue por 7 dias seguidos    │   │
│  │ ▓▓▓▓▓░░ 5/7 dias            │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### StoreView (Loja)
```
┌─────────────────────────────────────┐
│            LOJA                     │
│                                     │
│  Seus Tokens: 💎 1,250              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Pacote de Dicas              │   │
│  │ 5 dicas extras               │   │
│  │ 💎 100 tokens                │   │
│  │ [COMPRAR]                    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Tema Premium: Bambu          │   │
│  │ Visual exclusivo             │   │
│  │ 💎 500 tokens                │   │
│  │ [COMPRAR]                    │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Fluxo de Navegação

```
         ┌─────────┐
         │  HOME   │ ← Ponto de entrada
         └────┬────┘
              │
    ┌─────────┴─────────┬─────────┬──────────┐
    ▼                   ▼         ▼          ▼
┌────────┐         ┌────────┐ ┌────────┐ ┌────────┐
│  GAME  │ ←─────→ │PROFILE │ │SETTINGS│ │ STORE  │
└────────┘         └────────┘ └────────┘ └────────┘
                        │
                        ▼
                  ┌────────────┐
                  │ACHIEVEMENTS│
                  └────────────┘
```

## Animações e Feedback

### Tap/Click Feedback
```
Normal:        Pressed:       Active:
┌─────┐       ┌─────┐        ┌═════┐
│ 🏠  │  →    │ 🏠  │   →    ║ 🏠  ║
└─────┘       └─────┘        ╚═════╝
              Scale: 0.95     Highlight
```

### Badge Animation
```
Frame 1:    Frame 2:    Frame 3:
  (3)         (3)         (3)
   ↓          ↓↗          ↓
  🏆         🏆          🏆
           Scale: 1.2   Normal
```

## Cores e Estilos

```scss
// Cores do Menu
$menu-bg: rgba(0, 0, 0, 0.9);
$menu-item: #ffffff;
$menu-item-active: #42b883;
$menu-item-inactive: #666666;
$badge-bg: #ff4444;
$badge-text: #ffffff;

// Tamanhos
$menu-height-mobile: 60px;
$menu-item-size: 50px;
$icon-size: 24px;
$label-size: 11px;
$badge-size: 18px;

// Animações
$transition-duration: 0.3s;
$tap-scale: 0.95;
$badge-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```