# Solução para o Problema de Peças Desaparecendo ao Trocar de Aba

## Problema Identificado
As peças do jogo Mahjong desapareciam quando o usuário trocava de aba no navegador e retornava ao jogo. O problema requeria limpar o cache do navegador para funcionar novamente.

## Causa Raiz
O problema estava relacionado ao gerenciamento de estado do Vue e à forma como o navegador lida com recursos de páginas inativas. Quando uma aba fica inativa, o navegador pode:
- Pausar a execução de JavaScript
- Liberar recursos de memória
- Invalidar referências a objetos DOM
- Perder estado de componentes Vue

## Solução Implementada

### 1. TabVisibilityManager
Criado um gerenciador centralizado para detectar e lidar com mudanças de visibilidade da aba:

**Arquivo:** `/src/utils/tabVisibilityManager.ts`

Características:
- Detecta mudanças de visibilidade usando múltiplos eventos (visibilitychange, focus, blur, pageshow, pagehide)
- Salva estado completo quando a aba fica inativa
- Restaura estado quando a aba volta a ficar ativa
- Diferencia entre mudanças rápidas e longas de aba

### 2. TileStateCache
Sistema de cache para preservar o estado visual dos tiles:

**Arquivo:** `/src/utils/tileStateCache.ts`

Características:
- Salva estado dos tiles em localStorage e sessionStorage
- Validação de integridade com checksum
- Expiração automática de cache após 5 minutos
- Restauração inteligente de estado visual

### 3. Integração com Componentes

#### GameView.vue
- Inicializa o TabVisibilityManager no onMounted
- Registra callback de recuperação
- Força re-renderização do TileField quando necessário
- Limpa recursos no onUnmounted

#### TileField.vue
- Registra callback com TabVisibilityManager
- Implementa recuperação rápida e completa
- Salva estado após cada jogada bem-sucedida
- Restaura tiles do cache quando possível

## Fluxo de Recuperação

### Quando a aba fica inativa:
1. TabVisibilityManager detecta a mudança
2. Salva estado completo do jogo
3. Pausa o timer do jogo
4. Armazena dados em localStorage e IndexedDB

### Quando a aba volta a ficar ativa:
1. TabVisibilityManager detecta o retorno
2. Verifica tempo que ficou inativa
3. Se < 2 segundos: Recuperação rápida (apenas refresh)
4. Se > 2 segundos: Recuperação completa
   - Carrega estado do cache
   - Valida integridade
   - Restaura tiles e estado do jogo
   - Força re-renderização do Vue

## Comandos de Debug

Para desenvolvedores, foi adicionado um comando de emergência (apenas em DEV):
- **Ctrl+Shift+R**: Limpa todo o cache do jogo e recarrega a página

Também disponível via console:
```javascript
window.clearGameCache() // Apenas em modo DEV
```

## Melhorias de Performance

- Cache em duas camadas (localStorage + sessionStorage)
- Detecção inteligente de mudanças de visibilidade
- Recuperação assíncrona sem bloquear UI
- Validação de integridade para evitar corrupção

## Testes Recomendados

1. **Troca rápida de aba**: Mudar de aba e voltar em menos de 2 segundos
2. **Troca longa de aba**: Ficar em outra aba por mais de 2 segundos
3. **Múltiplas trocas**: Trocar de aba várias vezes rapidamente
4. **Jogo em progresso**: Trocar de aba com peças selecionadas
5. **Cache expirado**: Deixar aba inativa por mais de 5 minutos

## Logs de Debug

O sistema adiciona logs detalhados no console para facilitar debug:
- `[TabVisibilityManager]`: Eventos de visibilidade
- `[TileField]`: Eventos de recuperação
- `[TileStateCache]`: Operações de cache

## Conclusão

A solução implementada resolve o problema de forma robusta, garantindo que o estado do jogo seja preservado e restaurado corretamente ao trocar de abas, sem necessidade de limpar o cache do navegador.