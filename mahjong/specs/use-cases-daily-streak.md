# Casos de Uso - Sistema de Ofensiva Diária e Tokens

## UC-001: Primeiro Acesso do Jogador

**Ator**: Novo Jogador
**Pré-condições**: 
- Aplicativo instalado/aberto pela primeira vez
- Sem dados salvos localmente

**Fluxo Principal**:
1. Sistema exibe tela de boas-vindas
2. Sistema apresenta tutorial sobre tokens (pontuação)
3. Sistema explica conceito de ofensiva diária
4. Jogador completa primeira partida tutorial
5. Sistema concede 50 tokens iniciais
6. Sistema solicita criação de perfil básico
7. Jogador escolhe nome e avatar
8. Sistema salva dados localmente

**Pós-condições**:
- Perfil criado com 50 tokens
- Ofensiva iniciada (Dia 1)
- Tutorial marcado como completo

**Fluxos Alternativos**:
- 3a. Jogador pula tutorial → Sistema permite, mas mantém dicas ativas
- 7a. Jogador pula criação → Sistema usa perfil anônimo temporário

---

## UC-002: Manutenção Diária da Ofensiva

**Ator**: Jogador Regular
**Pré-condições**:
- Jogador possui ofensiva ativa (>0 dias)
- Ainda dentro do prazo de 24h

**Fluxo Principal**:
1. Jogador abre o aplicativo
2. Sistema verifica última partida jogada
3. Sistema calcula tempo restante para manter ofensiva
4. Jogador inicia uma partida (qualquer modo)
5. Jogador completa a partida
6. Sistema registra manutenção da ofensiva
7. Sistema incrementa contador de dias
8. Sistema concede tokens de ofensiva diária

**Pós-condições**:
- Ofensiva mantida e incrementada
- Tokens de recompensa creditados
- Próximo prazo definido (24h)

**Fluxos Alternativos**:
- 5a. Jogador abandona partida → Sistema não conta para ofensiva
- 8a. Dia especial (7, 30, etc) → Sistema aplica recompensas extras

---

## UC-003: Perda de Ofensiva

**Ator**: Jogador
**Pré-condições**:
- Jogador possui ofensiva ativa
- Passou 24h desde última partida completa

**Fluxo Principal**:
1. Jogador abre aplicativo após >24h
2. Sistema detecta perda de ofensiva
3. Sistema exibe notificação de perda
4. Sistema reseta contador para 0
5. Sistema mostra dias perdidos
6. Sistema oferece modo férias para próxima vez

**Pós-condições**:
- Ofensiva resetada para 0
- Histórico de ofensiva perdida salvo
- Opção de modo férias apresentada

---

## UC-004: Ganho de Tokens por Vitória

**Ator**: Jogador
**Pré-condições**:
- Partida em andamento

**Fluxo Principal**:
1. Jogador completa partida com sucesso
2. Sistema calcula tokens base (100)
3. Sistema calcula bônus de tempo restante
4. Sistema verifica multiplicadores ativos
5. Sistema aplica fórmula final
6. Sistema exibe animação de ganho
7. Sistema atualiza saldo de tokens

**Pós-condições**:
- Tokens creditados no perfil
- Estatísticas atualizadas
- Possível nova conquista

**Cálculo Exemplo**:
```
Base: 100 tokens
Tempo restante: 3 min = 30 tokens
Sem usar dicas: x1.3
Fim de semana: x1.5
Total: (100 + 30) × 1.3 × 1.5 = 253 tokens
```

---

## UC-005: Uso de Tokens para Dicas

**Ator**: Jogador
**Pré-condições**:
- Partida em andamento
- Saldo de tokens suficiente

**Fluxo Principal**:
1. Jogador solicita dica
2. Sistema verifica saldo de tokens
3. Sistema mostra custo (50 tokens)
4. Jogador confirma uso
5. Sistema debita tokens
6. Sistema destaca jogada possível
7. Sistema atualiza interface

**Pós-condições**:
- Tokens debitados
- Dica aplicada na partida
- Partida marcada como "com ajuda"

**Fluxos Alternativos**:
- 2a. Saldo insuficiente → Sistema oferece formas de ganhar tokens
- 4a. Jogador cancela → Retorna ao jogo sem mudanças

---

## UC-006: Ativação Modo Férias

**Ator**: Jogador
**Pré-condições**:
- Jogador possui ofensiva ativa
- Tokens suficientes (500/dia)
- Não excedeu limite mensal

**Fluxo Principal**:
1. Jogador acessa configurações
2. Jogador seleciona "Modo Férias"
3. Sistema mostra custo e regras
4. Jogador define duração (1-3 dias)
5. Sistema calcula custo total
6. Jogador confirma ativação
7. Sistema ativa proteção de ofensiva
8. Sistema agenda reativação automática

**Pós-condições**:
- Modo férias ativo
- Tokens debitados
- Ofensiva protegida pelo período

---

## UC-007: Desbloqueio de Conquista

**Ator**: Sistema
**Pré-condições**:
- Jogador atinge critério específico

**Fluxo Principal**:
1. Sistema detecta critério atingido
2. Sistema verifica se conquista já foi desbloqueada
3. Sistema registra nova conquista
4. Sistema pausa jogo (se em partida)
5. Sistema exibe animação de conquista
6. Sistema mostra recompensas ganhas
7. Sistema adiciona ao perfil do jogador

**Pós-condições**:
- Conquista registrada no perfil
- Tokens/recompensas creditados
- Badge disponível para exibição

**Exemplos de Trigger**:
- Primeira vitória
- 10 vitórias sem dicas
- Jogar 30 dias seguidos
- Vitória em menos de 1 minuto

---

## UC-008: Visualização de Perfil e Estatísticas

**Ator**: Jogador
**Pré-condições**:
- Perfil existente com histórico

**Fluxo Principal**:
1. Jogador acessa menu perfil
2. Sistema carrega dados salvos
3. Sistema exibe informações básicas
4. Jogador navega pelas abas
5. Sistema mostra estatísticas detalhadas
6. Sistema renderiza gráficos de progresso
7. Jogador visualiza conquistas

**Seções Disponíveis**:
- Resumo: Nome, avatar, nível, tokens
- Estatísticas: Vitórias, tempo, eficiência
- Conquistas: Desbloqueadas vs. disponíveis
- Histórico: Ofensivas passadas
- Comparação: Ranking entre amigos

---

## UC-009: Notificação de Ofensiva em Risco

**Ator**: Sistema
**Pré-condições**:
- Jogador tem ofensiva ativa
- Faltam 2h para perder ofensiva
- Notificações permitidas

**Fluxo Principal**:
1. Sistema detecta proximidade do prazo
2. Sistema verifica configurações de notificação
3. Sistema envia push notification
4. Sistema atualiza indicador no app
5. Jogador recebe notificação
6. Jogador abre aplicativo
7. Sistema oferece partida rápida

**Pós-condições**:
- Notificação enviada
- Jogador alertado sobre risco
- Opção de partida rápida disponível

---

## UC-010: Compra de Personalização com Tokens

**Ator**: Jogador
**Pré-condições**:
- Tokens suficientes
- Item disponível para compra

**Fluxo Principal**:
1. Jogador acessa loja/personalização
2. Sistema exibe itens disponíveis
3. Jogador seleciona item desejado
4. Sistema mostra preview e custo
5. Jogador confirma compra
6. Sistema debita tokens
7. Sistema desbloqueia item
8. Sistema aplica personalização

**Tipos de Itens**:
- Temas de tabuleiro: 500 tokens
- Conjuntos de peças: 750 tokens
- Avatares especiais: 1000 tokens
- Efeitos visuais: 300 tokens

**Pós-condições**:
- Item desbloqueado permanentemente
- Tokens debitados
- Personalização ativa (se selecionada)