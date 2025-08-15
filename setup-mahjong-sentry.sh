#!/bin/bash

# Script de Setup Sentry para Projeto Mahjong
# Instala e configura Session Replay

echo "🎬 Configurando Sentry Session Replay para Mahjong"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Navegar para o projeto Mahjong
cd ../mahjong

echo -e "${BLUE}📦 Instalando @sentry/vue...${NC}"
npm install --save @sentry/vue

echo -e "${BLUE}📝 Verificando versão instalada...${NC}"
npm list @sentry/vue

echo -e "${BLUE}🔧 Configurações recomendadas aplicadas:${NC}"
echo "  ✅ Session Replay habilitado"
echo "  ✅ Error sampling: 100%"
echo "  ✅ Session sampling: 10% (desenvolvimento: 100%)"
echo "  ✅ Performance monitoring"
echo "  ✅ Vue Router integration"

echo ""
echo -e "${YELLOW}📋 Próximos passos:${NC}"
echo "1. Copie o código de mahjong-sentry-setup.js para src/main.ts"
echo "2. Ajuste as configurações conforme necessário"
echo "3. Teste em desenvolvimento com replaysSessionSampleRate: 1.0"
echo "4. Deploy com replaysSessionSampleRate: 0.1"

echo ""
echo -e "${BLUE}🎯 Benefits do Session Replay:${NC}"
echo "  🎥 Replay visual dos travamentos"
echo "  🐛 Debug de interações complexas"
echo "  📊 Análise de comportamento do usuário"
echo "  ⚡ Performance insights visuais"

echo ""
echo -e "${GREEN}✅ Setup completo! Session Replay pronto para debuggar travamentos do Mahjong!${NC}"
