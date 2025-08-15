#!/bin/bash

# Script para converter sentry-mcp-cursor em submódulo
# Uso: ./convert-to-submodule.sh [remote-repo-url]

echo "🔄 Convertendo sentry-mcp-cursor para submódulo git"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Verificar se URL foi fornecida
REMOTE_URL=${1:-"https://github.com/[username]/sentry-mcp-cursor.git"}

echo -e "${BLUE}📋 Configuração:${NC}"
echo "  Diretório atual: $(pwd)"
echo "  URL remota: $REMOTE_URL"
echo "  Padrão baseado em: mcp-neo4j-agent-memory"
echo ""

# Verificar se estamos no diretório correto
if [[ ! $(basename $(pwd)) == "sentry-mcp-cursor" ]]; then
    echo -e "${RED}❌ Execute este script de dentro do diretório sentry-mcp-cursor${NC}"
    exit 1
fi

echo -e "${BLUE}🔍 Verificando status atual...${NC}"

# Verificar se já tem remote configurado
if git remote -v | grep -q origin; then
    echo -e "${GREEN}✅ Remote origin já configurado:${NC}"
    git remote -v
else
    echo -e "${YELLOW}⚠️  Nenhum remote configurado. Configurando...${NC}"
    git remote add origin "$REMOTE_URL"
fi

# Verificar se tem commits
if ! git log --oneline -1 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Sem commits. Criando commit inicial...${NC}"
    git add .
    git commit -m "feat: initial commit - Sentry MCP with 27 tools"
fi

echo -e "${BLUE}📤 Fazendo push para repositório remoto...${NC}"
git push -u origin main 2>/dev/null || git push -u origin master 2>/dev/null

echo -e "${BLUE}📝 Preparando conversão para submódulo...${NC}"
cd ..

# Verificar se já é submódulo
if [[ -f .gitmodules ]] && grep -q "sentry-mcp-cursor" .gitmodules; then
    echo -e "${GREEN}✅ sentry-mcp-cursor já é submódulo!${NC}"
    echo -e "${BLUE}📊 Status atual:${NC}"
    git submodule status | grep sentry-mcp-cursor
    exit 0
fi

echo -e "${BLUE}🗑️  Removendo do cache git principal...${NC}"
git rm --cached -r sentry-mcp-cursor 2>/dev/null || echo "  (não estava no cache)"

echo -e "${BLUE}💾 Fazendo backup...${NC}"
cp -r sentry-mcp-cursor sentry-mcp-cursor.backup

echo -e "${BLUE}🔄 Removendo diretório local...${NC}"
rm -rf sentry-mcp-cursor

echo -e "${BLUE}📦 Adicionando como submódulo...${NC}"
git submodule add "$REMOTE_URL" sentry-mcp-cursor

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ Submódulo adicionado com sucesso!${NC}"
    
    echo -e "${BLUE}📝 Criando commit...${NC}"
    git commit -m "feat: adiciona sentry-mcp-cursor como submódulo MCP

- Segue padrão do mcp-neo4j-agent-memory
- 27 ferramentas MCP funcionais
- Configuração completa para Cursor
- Documentação abrangente incluída"

    echo -e "${BLUE}📊 Verificando configuração...${NC}"
    echo ""
    echo -e "${GREEN}🎯 .gitmodules criado:${NC}"
    cat .gitmodules | grep -A3 sentry-mcp-cursor
    
    echo ""
    echo -e "${GREEN}📋 Status do submódulo:${NC}"
    git submodule status
    
    echo ""
    echo -e "${BLUE}🗑️  Removendo backup...${NC}"
    rm -rf sentry-mcp-cursor.backup
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}🎉 Conversão para submódulo concluída com sucesso!${NC}"
    echo ""
    echo -e "${BLUE}📚 Próximos passos:${NC}"
    echo "  1. git push - Para enviar as mudanças"
    echo "  2. cd sentry-mcp-cursor && ./add-to-cursor.sh - Para reconfigurar MCP"
    echo "  3. Instruir outros desenvolvedores:"
    echo "     git submodule update --init --recursive"
    echo ""
    echo -e "${BLUE}🔗 Comandos úteis:${NC}"
    echo "  • git submodule status - Ver status"
    echo "  • git submodule update - Atualizar"
    echo "  • cd sentry-mcp-cursor && git pull - Atualizar submódulo"
    echo ""
    echo -e "${YELLOW}💡 Documentação completa: ../SUBMODULE_SETUP_SENTRY_MCP.md${NC}"

else
    echo -e "${RED}❌ Erro ao adicionar submódulo!${NC}"
    echo -e "${BLUE}🔄 Restaurando backup...${NC}"
    mv sentry-mcp-cursor.backup sentry-mcp-cursor
    exit 1
fi
