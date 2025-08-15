#!/bin/bash

echo "🧹 Limpando cache do jogo Mahjong..."

# Limpar node_modules/.vite se existir
if [ -d "node_modules/.vite" ]; then
    rm -rf node_modules/.vite
    echo "✅ Cache do Vite limpo"
fi

# Limpar dist se existir
if [ -d "dist" ]; then
    rm -rf dist
    echo "✅ Build anterior removida"
fi

# Reinstalar dependências (opcional)
read -p "Deseja reinstalar as dependências? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf node_modules package-lock.json
    npm install
    echo "✅ Dependências reinstaladas"
fi

echo "🎮 Cache limpo! Execute 'npm run dev' para iniciar o jogo"
echo ""
echo "💡 Dica: Se o problema persistir no navegador:"
echo "   1. Abra o DevTools (F12)"
echo "   2. Vá para Application/Storage"
echo "   3. Clique em 'Clear site data'"
echo "   OU"
echo "   Use Ctrl+Shift+R (Cmd+Shift+R no Mac) para fazer hard refresh"