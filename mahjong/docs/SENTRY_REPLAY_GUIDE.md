# Guia de Configuração do Sentry Session Replay - Mahjong Game

## 📹 Visão Geral

O Sentry Session Replay permite gravar e reproduzir sessões de usuários, ajudando a entender e resolver problemas de forma mais eficaz. Esta configuração foi otimizada para o jogo Mahjong com foco em privacidade, performance e filtragem inteligente de eventos.

## 🚀 Início Rápido

### 1. Configuração do Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

### 2. Configure as Variáveis de Ambiente

Edite o arquivo `.env` com suas credenciais do Sentry:

```env
VITE_SENTRY_DSN=sua_dsn_aqui
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_RELEASE=mahjong@1.0.0
```

## 🔧 Configurações Implementadas

### Session Replay

- **Taxa de Amostragem Normal**: 10% das sessões (configurável via `VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE`)
- **Taxa de Amostragem com Erros**: 100% das sessões com erros (configurável via `VITE_SENTRY_REPLAY_ERROR_SAMPLE_RATE`)
- **Duração Máxima**: 10 minutos por sessão

### Privacidade (LGPD/GDPR Compliant)

- ✅ **Mascaramento de Texto**: Ativado por padrão
- ✅ **Mascaramento de Inputs**: Sempre ativado
- ✅ **PII (Informações Pessoais)**: Não enviadas por padrão
- ✅ **Seletores Customizados**: Elementos sensíveis mascarados automaticamente

### Performance

- **Throttling de Mouse Events**: Reduz eventos de movimento do mouse
- **Network Filtering**: Captura apenas headers essenciais
- **Taxa de Traces**: 30% das transações monitoradas

### Filtragem de Eventos

Eventos informativos filtrados automaticamente:
- Mensagens do sentry-mcp-cursor
- Erros conhecidos do navegador (ResizeObserver, etc.)
- Mensagens de debug

## 📊 Dashboard e Monitoramento

### Acessando os Replays

1. Acesse o [Sentry Dashboard](https://sentry.io)
2. Navegue para: **Replays** no menu lateral
3. Filtre por:
   - Ambiente (production/development)
   - Período
   - Usuário específico

### Métricas Importantes

- **Session Duration**: Tempo médio de sessão
- **Error Rate**: Taxa de erros por sessão
- **Replay Count**: Número de replays capturados
- **User Engagement**: Interações por sessão

## 🛡️ Privacidade e Segurança

### Elementos Sempre Mascarados

```css
.sensitive-data
.user-email
.user-phone
[data-mask="true"]
```

### Elementos Nunca Mascarados

```css
.game-score
.level-display
.public-content
```

### Como Adicionar Mascaramento

Para mascarar um elemento específico:

```html
<!-- Usando classe CSS -->
<div class="sensitive-data">Informação sensível</div>

<!-- Usando data attribute -->
<div data-mask="true">Dados privados</div>
```

## 🎮 Contexto do Jogo

Cada evento capturado inclui automaticamente:

- **Level atual**: Nível do jogador
- **Score**: Pontuação atual
- **Session Time**: Tempo de sessão
- **User ID**: ID anônimo do usuário

## 🐛 Troubleshooting

### Replays não estão sendo capturados

1. Verifique se o DSN está correto no `.env`
2. Confirme as taxas de amostragem (não podem ser 0)
3. Verifique o console do navegador para erros

### Performance degradada

1. Reduza `VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE`
2. Aumente o throttling de eventos no `beforeAddRecordingEvent`
3. Desative `VITE_SENTRY_MASK_ALL_TEXT` se não for necessário

### Eventos informativos aparecendo no dashboard

Os filtros já estão configurados para ignorar:
- "Analyzing commit strategy"
- "Proposing sentry-mcp-cursor"
- "Sentry Session Replay setup recommendation"

Se novos eventos informativos aparecerem, adicione-os ao array `infoMessages` em `main.ts`.

## 📈 Otimização de Custos

Para reduzir custos do Sentry:

1. **Ajuste as taxas de amostragem**:
   ```env
   VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE=0.05  # 5% apenas
   VITE_SENTRY_TRACES_SAMPLE_RATE=0.1           # 10% de traces
   ```

2. **Limite replays a erros apenas**:
   ```env
   VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE=0     # Sem sessões normais
   VITE_SENTRY_REPLAY_ERROR_SAMPLE_RATE=1.0     # 100% com erros
   ```

3. **Use filtragem agressiva** no `beforeSend`

## 🔄 Atualizações e Manutenção

### Como atualizar o Sentry SDK

```bash
npm update @sentry/vue
```

### Verificar configuração atual

```javascript
// No console do navegador
Sentry.getCurrentHub().getClient().getOptions()
```

### Testar integração

```javascript
// Enviar erro de teste
Sentry.captureException(new Error("Test error from Mahjong"));

// Enviar mensagem de teste
Sentry.captureMessage("Test message from Mahjong", "info");
```

## 📚 Recursos Adicionais

- [Documentação oficial do Sentry Replay](https://docs.sentry.io/platforms/javascript/session-replay/)
- [Guia de privacidade do Sentry](https://docs.sentry.io/platforms/javascript/session-replay/privacy/)
- [Otimização de performance](https://docs.sentry.io/platforms/javascript/performance/)

## 🤝 Suporte

Para problemas ou dúvidas:
1. Verifique este guia
2. Consulte a [documentação do Sentry](https://docs.sentry.io)
3. Abra uma issue no repositório do projeto

---

*Última atualização: 2024*
*Configuração otimizada para Mahjong Solitaire Game*