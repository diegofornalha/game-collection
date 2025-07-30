# language: pt

Funcionalidade: Sistema de Ofensiva Diária e Tokens
  Como jogador de Mahjong
  Eu quero ganhar tokens e manter minha ofensiva diária
  Para desbloquear recompensas e acompanhar meu progresso

  Contexto:
    Dado que o sistema de tokens está ativo
    E o sistema de ofensiva diária está configurado

  # Tokens como Sistema de Pontuação
  
  Cenário: Ganhar tokens por vitória básica
    Dado que estou jogando uma partida
    Quando eu completo a partida com sucesso
    Então devo receber 100 tokens base
    E devo ver a animação de moedas
    E meu saldo deve ser atualizado

  Cenário: Bônus de tempo em vitória
    Dado que estou jogando uma partida
    E restam 3 minutos no cronômetro
    Quando eu completo a partida
    Então devo receber 100 tokens base
    E devo receber 30 tokens de bônus (10 por minuto)
    E o total deve ser 130 tokens

  Cenário: Multiplicador por não usar dicas
    Dado que estou jogando uma partida
    E não usei nenhuma dica
    Quando eu completo a partida
    Então meus tokens devem ser multiplicados por 1.3
    E deve aparecer indicador "Sem Ajuda"

  # Sistema de Ofensiva Diária

  Cenário: Iniciar primeira ofensiva
    Dado que é meu primeiro dia jogando
    Quando eu completo uma partida
    Então minha ofensiva deve iniciar em "1 dia"
    E devo receber 10 tokens de bônus
    E deve aparecer mensagem de boas-vindas

  Cenário: Manter ofensiva diária
    Dado que tenho uma ofensiva de 5 dias
    E joguei ontem às 15:00
    Quando eu completo uma partida hoje às 14:00
    Então minha ofensiva deve aumentar para 6 dias
    E devo receber os tokens do dia 6
    E o contador deve mostrar "🔥 6 dias"

  Cenário: Perder ofensiva por não jogar
    Dado que tenho uma ofensiva de 10 dias
    E minha última partida foi há 25 horas
    Quando eu abro o aplicativo
    Então devo ver notificação de ofensiva perdida
    E meu contador deve resetar para 0
    E deve aparecer opção de modo férias

  Cenário: Marco especial de 7 dias
    Dado que tenho uma ofensiva de 6 dias
    Quando eu completo uma partida no 7º dia
    Então devo receber 100 tokens de marco
    E devo desbloquear badge "Semana Completa"
    E devo desbloquear tema especial
    E deve aparecer tela de celebração

  # Modo Férias

  Cenário: Ativar modo férias
    Dado que tenho 1500 tokens
    E tenho uma ofensiva de 15 dias
    Quando eu ativo modo férias por 2 dias
    Então devem ser debitados 1000 tokens
    E minha ofensiva deve ficar protegida
    E deve aparecer ícone de modo férias

  Cenário: Limite de modo férias excedido
    Dado que já usei 6 dias de férias este mês
    Quando tento ativar modo férias
    Então devo ver mensagem "Limite mensal atingido"
    E a opção deve estar desabilitada

  # Uso de Tokens

  Cenário: Comprar dica durante jogo
    Dado que tenho 200 tokens
    E estou em uma partida
    Quando eu solicito uma dica
    E confirmo o uso de 50 tokens
    Então uma jogada deve ser destacada
    E meu saldo deve diminuir para 150
    E a partida deve ser marcada como "com ajuda"

  Cenário: Tentar dica sem tokens suficientes
    Dado que tenho 30 tokens
    Quando eu solicito uma dica
    Então devo ver mensagem "Tokens insuficientes"
    E deve aparecer botão "Ganhar tokens"

  Cenário: Comprar tema com tokens
    Dado que tenho 600 tokens
    E estou na loja de personalização
    Quando eu compro tema "Sakura" por 500 tokens
    Então o tema deve ser desbloqueado
    E meu saldo deve ser 100 tokens
    E o tema deve estar disponível para uso

  # Perfil e Estatísticas

  Cenário: Visualizar perfil completo
    Dado que tenho histórico de jogos
    Quando eu acesso meu perfil
    Então devo ver meu nome e avatar
    E devo ver meu nível atual
    E devo ver total de tokens
    E devo ver estatísticas de vitórias
    E devo ver conquistas desbloqueadas

  Cenário: Subir de nível
    Dado que sou nível 4 com 950 tokens totais ganhos
    Quando eu ganho 60 tokens em uma partida
    Então devo subir para nível 5
    E deve aparecer animação de level up
    E devo desbloquear "Desfazer ilimitado"

  # Conquistas

  Cenário: Desbloquear conquista de velocidade
    Dado que estou jogando uma partida
    Quando eu completo em 45 segundos
    Então devo desbloquear conquista "Relâmpago"
    E devo receber tokens de bônus da conquista
    E a conquista deve aparecer no perfil

  Cenário: Conquista de consistência
    Dado que joguei 29 dias seguidos
    Quando eu jogo no 30º dia
    Então devo desbloquear "Comprometido"
    E deve aparecer animação especial
    E devo poder exibir o badge

  # Notificações

  Cenário: Notificação de ofensiva em risco
    Dado que tenho ofensiva ativa
    E são 22:00 e não joguei hoje
    Quando o sistema verifica prazos
    Então devo receber push notification
    E o ícone do app deve mostrar badge
    E a mensagem deve ser "Jogue agora para manter sua ofensiva!"

  # Interface Mobile

  Cenário: Visualizar header compacto mobile
    Dado que estou usando dispositivo mobile
    Quando eu abro o aplicativo
    Então devo ver tokens no centro superior
    E devo ver contador de ofensiva na parte inferior
    E devo ver meu avatar no canto direito

  Cenário: Expandir detalhes no mobile
    Dado que estou na tela principal mobile
    Quando eu faço swipe para baixo no header
    Então deve expandir mostrando detalhes
    E deve mostrar próxima recompensa
    E deve mostrar barra de progresso do nível

  # Eventos Especiais

  Cenário: Multiplicador de fim de semana
    Dado que é sábado ou domingo
    Quando eu ganho tokens em qualquer modo
    Então deve aplicar multiplicador 1.5x
    E deve mostrar indicador "Bônus FDS"

  Cenário: Retorno após ausência
    Dado que não jogo há 10 dias
    Quando eu abro o aplicativo
    Então devo ver oferta de boas-vindas
    E devo ter bônus 2x por 3 dias
    E minha ofensiva deve iniciar em 5 dias (50% do anterior)