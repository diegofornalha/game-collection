# Testes E2E - Mahjong Solitaire

## Estrutura Recomendada

### 1. Configuração Base (Playwright)

```bash
# Instalar Playwright
npm install -D @playwright/test

# Configurar projeto
npm init playwright@latest
```

### 2. Estrutura de Diretórios

```
e2e/
├── fixtures/          # Dados de teste reutilizáveis
├── pages/            # Page Objects
│   ├── game.page.ts
│   └── menu.page.ts
├── tests/            # Arquivos de teste
│   ├── game-flow.spec.ts
│   ├── tile-matching.spec.ts
│   └── scoring.spec.ts
├── utils/            # Utilitários de teste
└── playwright.config.ts
```

### 3. Testes Essenciais para Mahjong

#### Game Flow
- Iniciar novo jogo
- Pausar/retomar jogo
- Resetar jogo
- Navegação entre menus

#### Mecânicas do Jogo
- Seleção de peças
- Validação de pares válidos
- Detecção de peças bloqueadas
- Desfazer jogadas
- Sistema de dicas

#### Sistema de Pontuação
- Cálculo correto de pontos
- Bônus de tempo
- Penalidades
- Ranking/highscores

#### Responsividade
- Funcionamento em diferentes resoluções
- Interações touch em mobile
- Performance em dispositivos lentos

### 4. Exemplo de Teste

```typescript
import { test, expect } from '@playwright/test';
import { GamePage } from '../pages/game.page';

test.describe('Mahjong Game Flow', () => {
  let gamePage: GamePage;

  test.beforeEach(async ({ page }) => {
    gamePage = new GamePage(page);
    await gamePage.goto();
  });

  test('deve iniciar novo jogo', async ({ page }) => {
    await gamePage.startNewGame();
    
    await expect(gamePage.gameBoard).toBeVisible();
    await expect(gamePage.timer).toBeVisible();
    await expect(gamePage.score).toHaveText('0');
  });

  test('deve encontrar e combinar peças válidas', async ({ page }) => {
    await gamePage.startNewGame();
    
    const [tile1, tile2] = await gamePage.findMatchingPair();
    await tile1.click();
    await tile2.click();
    
    await expect(tile1).toBeHidden();
    await expect(tile2).toBeHidden();
    await expect(gamePage.score).not.toHaveText('0');
  });
});
```

### 5. Integração com CI/CD

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### 6. Agentes Recomendados

Para implementar e manter os testes E2E, use:

1. **`tester`** - Para criar a estrutura inicial de testes
2. **`code-analyzer`** - Para analisar cobertura de testes
3. **`production-validator`** - Para garantir que testes cubram cenários reais
4. **`performance-benchmarker`** - Para testes de performance