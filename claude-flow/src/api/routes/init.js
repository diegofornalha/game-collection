/**
 * Init API Routes - Backend routes para o assistente de inicialização
 * Conecta a interface frontend com a funcionalidade CLI do init
 */

const express = require('express');
const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const WebSocket = require('ws');

const router = express.Router();

/**
 * POST /api/init - Executa a inicialização do projeto
 */
router.post('/init', async (req, res) => {
  try {
    const { command, args, config } = req.body;
    
    if (command !== 'init') {
      return res.status(400).json({
        success: false,
        error: 'Comando inválido. Esperado: init'
      });
    }

    // Validate required config
    if (!config.projectName?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Nome do projeto é obrigatório'
      });
    }

    // Build command
    const cliCommand = buildInitCommand(args);
    console.log('Executando comando:', cliCommand);
    
    // Execute init command
    const result = await executeInitCommand(cliCommand, config);
    
    res.json({
      success: true,
      message: 'Inicialização concluída com sucesso',
      ...result
    });
    
  } catch (error) {
    console.error('Erro na inicialização:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
});

/**
 * GET /api/validate-claude - Valida se Claude Code está instalado
 */
router.get('/validate-claude', async (req, res) => {
  try {
    execSync('which claude', { stdio: 'ignore' });
    
    // Try to get version
    const version = execSync('claude --version', { encoding: 'utf8' }).trim();
    
    res.json({
      installed: true,
      version: version,
      message: 'Claude Code está instalado e disponível'
    });
    
  } catch (error) {
    res.json({
      installed: false,
      error: 'Claude Code não encontrado',
      suggestion: 'Instale Claude Code: https://claude.ai/download'
    });
  }
});

/**
 * GET /api/agents - Lista agentes disponíveis
 */
router.get('/agents', async (req, res) => {
  try {
    // This could be dynamic based on available agent files
    const agents = [
      {
        id: 'coder',
        name: 'Coder',
        description: 'Especialista em implementação de código',
        icon: '👨‍💻',
        default: true,
        capabilities: ['code-generation', 'debugging', 'refactoring']
      },
      {
        id: 'tester',
        name: 'Tester',
        description: 'Criação e validação de testes',
        icon: '🧪',
        default: true,
        capabilities: ['unit-testing', 'integration-testing', 'test-automation']
      },
      {
        id: 'architect',
        name: 'Architect',
        description: 'Design de arquitetura de sistemas',
        icon: '🏗️',
        default: false,
        capabilities: ['system-design', 'architecture-review', 'scalability']
      },
      {
        id: 'researcher',
        name: 'Researcher',
        description: 'Pesquisa e análise de informações',
        icon: '🔍',
        default: false,
        capabilities: ['research', 'analysis', 'documentation']
      },
      {
        id: 'reviewer',
        name: 'Reviewer',
        description: 'Revisão de código e qualidade',
        icon: '🔍',
        default: false,
        capabilities: ['code-review', 'quality-analysis', 'best-practices']
      }
    ];
    
    res.json(agents);
    
  } catch (error) {
    console.error('Erro ao listar agentes:', error);
    res.status(500).json({
      error: 'Erro ao listar agentes',
      details: error.message
    });
  }
});

/**
 * GET /api/mcp-servers - Lista servidores MCP disponíveis
 */
router.get('/mcp-servers', async (req, res) => {
  try {
    const servers = [
      {
        id: 'claude-flow',
        name: 'Claude Flow MCP',
        description: 'Servidor principal do Claude Flow com orquestração de swarm',
        command: 'npx claude-flow@alpha mcp start',
        default: true,
        features: ['swarm-orchestration', 'task-coordination', 'memory-management']
      },
      {
        id: 'ruv-swarm',
        name: 'Ruv-Swarm MCP',
        description: 'Servidor ruv-swarm para coordenação avançada',
        command: 'npx ruv-swarm mcp start',
        default: true,
        features: ['advanced-coordination', 'distributed-computing', 'performance-optimization']
      }
    ];
    
    res.json(servers);
    
  } catch (error) {
    console.error('Erro ao listar servidores MCP:', error);
    res.status(500).json({
      error: 'Erro ao listar servidores MCP',
      details: error.message
    });
  }
});

/**
 * GET /api/templates - Lista templates de projeto disponíveis
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'full',
        name: 'Projeto Completo',
        description: 'Configuração completa com todos os recursos',
        recommended: true,
        features: ['full-agent-support', 'mcp-integration', 'memory-system', 'sparc-ready']
      },
      {
        id: 'sparc',
        name: 'Projeto SPARC',
        description: 'Configuração otimizada para metodologia SPARC TDD',
        recommended: false,
        features: ['sparc-methodology', 'tdd-focused', 'specification-driven']
      },
      {
        id: 'minimal',
        name: 'Configuração Mínima',
        description: 'Apenas os arquivos essenciais',
        recommended: false,
        features: ['basic-setup', 'lightweight', 'quick-start']
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'Configuração para projetos corporativos',
        recommended: false,
        features: ['enterprise-features', 'security-focused', 'scalable-architecture']
      }
    ];
    
    res.json(templates);
    
  } catch (error) {
    console.error('Erro ao listar templates:', error);
    res.status(500).json({
      error: 'Erro ao listar templates',
      details: error.message
    });
  }
});

/**
 * GET /api/project-status - Verifica status atual do projeto
 */
router.get('/project-status', async (req, res) => {
  try {
    const cwd = process.cwd();
    const claudeDir = path.join(cwd, '.claude');
    const claudeConfigPath = path.join(claudeDir, 'CLAUDE.md');
    const settingsPath = path.join(claudeDir, 'settings.json');
    const memoryBankPath = path.join(cwd, 'memory-bank.md');
    
    const status = {
      projectPath: cwd,
      initialized: false,
      hasClaudeConfig: false,
      hasSettings: false,
      hasMemoryBank: false,
      hasMcpServers: false,
      files: []
    };
    
    // Check for .claude directory
    try {
      await fs.access(claudeDir);
      status.initialized = true;
      
      // Check for CLAUDE.md
      try {
        await fs.access(claudeConfigPath);
        status.hasClaudeConfig = true;
        status.files.push('.claude/CLAUDE.md');
      } catch {}
      
      // Check for settings.json
      try {
        await fs.access(settingsPath);
        status.hasSettings = true;
        status.files.push('.claude/settings.json');
      } catch {}
      
    } catch {}
    
    // Check for memory-bank.md
    try {
      await fs.access(memoryBankPath);
      status.hasMemoryBank = true;
      status.files.push('memory-bank.md');
    } catch {}
    
    // Check MCP servers status (simplified)
    try {
      execSync('claude mcp list', { stdio: 'ignore' });
      status.hasMcpServers = true;
    } catch {}
    
    res.json(status);
    
  } catch (error) {
    console.error('Erro ao verificar status do projeto:', error);
    res.status(500).json({
      error: 'Erro ao verificar status do projeto',
      details: error.message
    });
  }
});

/**
 * Builds the init command from arguments
 * @param {Array} args - Command line arguments
 * @returns {string} Full command string
 */
function buildInitCommand(args) {
  const baseCommand = 'npx claude-flow@alpha init';
  if (!args || args.length === 0) {
    return baseCommand;
  }
  return `${baseCommand} ${args.join(' ')}`;
}

/**
 * Executes the init command
 * @param {string} command - Command to execute
 * @param {Object} config - Configuration object
 * @returns {Promise<Object>} Execution result
 */
async function executeInitCommand(command, config) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const output = [];
    
    // Execute command
    const child = spawn('sh', ['-c', command], {
      cwd: process.cwd(),
      env: { ...process.env }
    });
    
    child.stdout.on('data', (data) => {
      const message = data.toString();
      output.push(message);
      console.log('STDOUT:', message);
    });
    
    child.stderr.on('data', (data) => {
      const message = data.toString();
      output.push(message);
      console.log('STDERR:', message);
    });
    
    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      
      if (code === 0) {
        resolve({
          files: getCreatedFiles(config),
          mcpSetup: config.autoSetupMcp !== false,
          mcpServers: config.mcpServers || ['claude-flow', 'ruv-swarm'],
          agents: config.agents || ['coder', 'tester'],
          output: output.join(''),
          duration: `${(duration / 1000).toFixed(1)}s`,
          exitCode: code
        });
      } else {
        reject(new Error(`Comando falhou with exit code ${code}. Output: ${output.join('')}`));
      }
    });
    
    child.on('error', (error) => {
      reject(new Error(`Erro ao executar comando: ${error.message}`));
    });
  });
}

/**
 * Gets list of files that should be created based on config
 * @param {Object} config - Configuration object
 * @returns {Array} List of file paths
 */
function getCreatedFiles(config) {
  const files = [
    '.claude/CLAUDE.md',
    '.claude/settings.json',
    '.claude/commands/'
  ];
  
  if (config.fileStructure?.createMemoryStructure !== false) {
    files.push('memory-bank.md', '.claude/memory/');
  }
  
  if (config.fileStructure?.createSparcStructure) {
    files.push('sparc/', 'sparc/specs/', 'sparc/architecture/');
  }
  
  if (config.fileStructure?.createGitignore !== false) {
    files.push('.gitignore');
  }
  
  return files;
}

/**
 * WebSocket handler for real-time updates
 */
function setupWebSocket(server) {
  const wss = new WebSocket.Server({ 
    server,
    path: '/ws/init'
  });
  
  wss.on('connection', (ws) => {
    console.log('Cliente conectado ao WebSocket init');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        console.log('Mensagem WebSocket recebida:', data);
        
        // Handle different message types
        switch (data.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
          case 'start-init':
            // Could trigger init process with real-time updates
            break;
        }
      } catch (error) {
        console.error('Erro ao processar mensagem WebSocket:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('Cliente desconectado do WebSocket init');
    });
  });
  
  return wss;
}

module.exports = {
  router,
  setupWebSocket
};