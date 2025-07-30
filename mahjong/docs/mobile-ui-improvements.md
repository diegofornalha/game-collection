# Plano de Melhorias UI/UX Mobile - Mahjong Solitaire

## 1. Análise de Problemas Atuais

### Problemas Críticos:
- **Touch Targets**: Botões e peças muito pequenos (< 44px)
- **Layout Fixo**: Não se adapta a diferentes tamanhos de tela
- **Feedback Tátil**: Falta resposta visual ao toque
- **Navegação**: Controles mal posicionados para uso com uma mão

## 2. Princípios de Design Mobile

### Touch-First Design:
- Áreas de toque mínimas: 48x48dp (Material Design)
- Espaçamento entre elementos: mínimo 8dp
- Gestos naturais: tap, swipe, pinch-to-zoom

### Responsive Layout:
- Breakpoints: 320px, 375px, 414px, 768px
- Orientação: Suporte portrait e landscape
- Safe areas: Considerar notch e home indicator

## 3. Proposta de Novo Layout

### A. Header Redesenhado
```
┌─────────────────────────────────────┐
│ [≡]  Pontos: 0        ⏱ 0:52    [⏸] │
│                                     │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│ │ 💡  │ │ ↶  │ │ ↷  │ │ 🔄  │   │
│ │Dica │ │Undo │ │Redo │ │Reset│   │
│ └─────┘ └─────┘ └─────┘ └─────┘   │
└─────────────────────────────────────┘
```

### B. Área de Jogo Otimizada
- **Zoom Adaptativo**: Auto-ajuste baseado no tamanho da tela
- **Pan & Zoom**: Gestos de pinça para zoom, arraste para mover
- **Highlight de Peças**: Destaque visual em peças tocáveis
- **Seleção Aprimorada**: Área de toque 20% maior que a peça visual

### C. Controles Contextuais
```
┌─────────────────────────────────────┐
│          Área de Jogo               │
│                                     │
│  ┌───────────────────────────────┐  │
│  │   Barra de Ações Flutuante    │  │
│  │  [Dica] [Desfazer] [Pausar]   │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## 4. Melhorias de Interação

### Touch Feedback:
1. **Tap**: Animação de escala (1.1x) + vibração sutil
2. **Seleção**: Brilho/glow ao redor da peça
3. **Match Válido**: Partículas e som de sucesso
4. **Erro**: Shake animation + vibração de erro

### Gestos Suportados:
- **Tap**: Selecionar peça
- **Double Tap**: Auto-zoom na área
- **Pinch**: Zoom in/out
- **Pan**: Mover tabuleiro (quando zoom > 100%)
- **Swipe Down**: Mostrar menu
- **Long Press**: Preview de jogadas possíveis

## 5. Implementação Técnica

### CSS para Touch:
```css
/* Áreas de toque expandidas */
.tile {
  position: relative;
  /* Visual */
  width: 40px;
  height: 50px;
}

.tile::before {
  /* Área de toque invisível maior */
  content: '';
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  z-index: 1;
}

/* Feedback visual */
.tile:active {
  transform: scale(1.05);
  filter: brightness(1.2);
}

/* Prevenir seleção de texto */
.game-board {
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  touch-action: manipulation;
}
```

### Vue Composable para Touch:
```typescript
// useMobileControls.ts
export function useMobileControls() {
  const { width } = useWindowSize();
  const isMobile = computed(() => width.value < 768);
  
  const tileSize = computed(() => {
    if (width.value < 375) return 'small';
    if (width.value < 414) return 'medium';
    return 'large';
  });
  
  const enableHapticFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };
  
  return {
    isMobile,
    tileSize,
    enableHapticFeedback
  };
}
```

## 6. Acessibilidade Mobile

### Melhorias de Acessibilidade:
1. **Contraste**: Aumentar contraste das peças (WCAG AA)
2. **Tamanho de Fonte**: Mínimo 16px para legibilidade
3. **Modo Escuro**: Suporte para preferência do sistema
4. **VoiceOver/TalkBack**: Labels adequados para leitores de tela

## 7. Performance Mobile

### Otimizações:
1. **Renderização**: Usar CSS transforms (GPU)
2. **Touch Delay**: Remover delay de 300ms
3. **Scroll**: Desabilitar em área de jogo
4. **Memória**: Limpar animações não visíveis

## 8. Testes Necessários

### Dispositivos Alvo:
- iPhone SE (375x667)
- iPhone 12/13 (390x844)
- Samsung Galaxy S21 (360x800)
- iPad (768x1024)

### Métricas de Sucesso:
- Taxa de erro de toque < 5%
- Tempo médio de seleção < 500ms
- Satisfação do usuário > 4.5/5
- Performance 60 FPS constante

## 9. Cronograma de Implementação

1. **Fase 1**: Layout responsivo e controles básicos (1 semana)
2. **Fase 2**: Sistema de touch e feedback (1 semana)
3. **Fase 3**: Otimizações e polimento (3 dias)
4. **Fase 4**: Testes e ajustes (3 dias)

## 10. Mockups e Protótipos

### Ferramentas Recomendadas:
- Figma para design visual
- Framer para protótipos interativos
- Vue DevTools para debug mobile