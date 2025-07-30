# Resumo Executivo - Sistema de Ofensiva Diária e Tokens

## Visão Geral

O sistema de Ofensiva Diária e Tokens transforma o jogo de Mahjong em uma experiência progressiva e recompensadora, onde **tokens representam a pontuação acumulada** do jogador ao longo do tempo.

## Conceitos Principais

### 1. Tokens (Sistema de Pontuação)
- **Definição**: Pontos acumulados que representam o progresso do jogador
- **Ganho Principal**: 100 tokens por vitória + bônus variados
- **Usos**: Dicas no jogo, personalização, power-ups
- **Economia**: Sistema balanceado com múltiplas fontes e drenos

### 2. Ofensiva Diária (Daily Streak)
- **Conceito**: Dias consecutivos jogando para recompensas progressivas
- **Manutenção**: Completar pelo menos 1 partida a cada 24h
- **Marcos Especiais**: Dias 7, 14, 30, 60, 100 com grandes recompensas
- **Modo Férias**: Proteção de até 3 dias por 500 tokens/dia

### 3. Perfil e Progressão
- **Níveis**: Baseados em tokens totais ganhos (√(tokens/100))
- **Conquistas**: 4 categorias com raridades diferentes
- **Estatísticas**: Tracking completo de performance
- **Social**: Comparação com amigos e rankings

## Recompensas Principais

### Por Vitória em Partida
```
Base: 100 tokens
+ Tempo restante: 10 tokens/minuto
+ Sem dicas: ×1.3
+ Fim de semana: ×1.5
= Total variável (100-500+ tokens)
```

### Por Ofensiva Diária
- Dia 1: 10 tokens
- Dia 7: 100 tokens + tema especial
- Dia 30: 1000 tokens + moldura dourada
- Dia 100: 5000 tokens + conjunto exclusivo

## Interface Unificada

### Desktop
- Header horizontal com todos elementos visíveis
- Contador de streak central com chama animada
- Perfil e tokens no canto direito

### Mobile
- Design compacto em duas linhas
- Gestos intuitivos (swipe, tap, hold)
- Notificações contextuais

## Elementos de Engajamento

1. **Notificações Inteligentes**
   - Aviso 2h antes de perder streak
   - Celebrações em marcos importantes
   - Ofertas personalizadas

2. **Progressão Visual**
   - Cores que mudam com o streak
   - Animações de recompensa
   - Barras de progresso em tempo real

3. **Mecânicas de Retenção**
   - Modo férias para jogadores dedicados
   - Bônus de retorno após ausência
   - Desafios diários variados

## Arquitetura Modular

### Configuração Flexível
- Regras em JSON com hot reload
- Sistema de desafios extensível
- Balanceamento ajustável sem código

### APIs RESTful
- Endpoints claros e documentados
- Sincronização offline-first
- Analytics integrado

## Métricas de Sucesso

### KPIs Principais
- **Retenção D1/D7/D30**: Meta 60%/40%/25%
- **Streak Médio**: Meta 7+ dias
- **Taxa de Uso de Tokens**: Meta 70% ativo
- **Satisfação**: Meta NPS 50+

### Monetização Futura
- VIP Pass mensal
- Pacotes de tokens
- Season Pass trimestral
- Remoção de anúncios

## Diferenciais Competitivos

1. **Sistema de Pontuação Persistente**: Tokens como moeda única
2. **Flexibilidade**: Modo férias único no gênero
3. **Progressão Clara**: Marcos bem definidos e alcançáveis
4. **Social Light**: Comparação sem pressão competitiva
5. **Acessibilidade**: Modos para todos os níveis

## Próximos Passos

### Fase 1 (MVP)
- Sistema base de tokens
- Ofensiva diária simples
- Perfil básico
- 5 conquistas iniciais

### Fase 2
- Loja completa
- Sistema de níveis
- Notificações push
- Rankings sociais

### Fase 3
- Eventos sazonais
- Modos de jogo extras
- Monetização
- Expansão social

## Conclusão

O sistema proposto cria um loop de engajamento sustentável que:
- Recompensa jogadores casuais e dedicados
- Oferece progressão clara e alcançável
- Mantém flexibilidade para ajustes
- Prepara terreno para monetização ética

Com implementação modular e foco na experiência do usuário, o sistema está pronto para transformar o Mahjong em uma experiência viciante e recompensadora.