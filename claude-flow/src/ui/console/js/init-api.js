/**
 * Init API Integration - Conecta o frontend com o backend Claude Flow
 * Gerencia a comunicação entre o wizard e os comandos de inicialização
 */

class InitAPI {
  constructor() {
    this.baseUrl = window.location.origin;
    this.apiEndpoint = '/api/init';
    this.wsEndpoint = `ws://${window.location.host}/ws/init`;
    this.websocket = null;
  }

  /**
   * Executa a inicialização do projeto
   * @param {Object} config - Configurações do wizard
   * @returns {Promise<Object>} Resultado da execução
   */
  async executeInit(config) {
    try {
      // Converte config do wizard para formato CLI
      const cliArgs = this.buildCliCommand(config);
      
      const response = await fetch(`${this.baseUrl}${this.apiEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: 'init',
          args: cliArgs,
          config: config
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro na API de inicialização:', error);
      throw error;
    }
  }

  /**
   * Conecta ao WebSocket para atualizações em tempo real
   * @param {Function} onMessage - Callback para mensagens
   * @param {Function} onError - Callback para erros
   */
  connectWebSocket(onMessage, onError) {
    try {
      this.websocket = new WebSocket(this.wsEndpoint);
      
      this.websocket.onopen = () => {
        console.log('Conectado ao WebSocket de inicialização');
      };
      
      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('Erro ao parsear mensagem WebSocket:', error);
        }
      };
      
      this.websocket.onerror = (error) => {
        console.error('Erro no WebSocket:', error);
        if (onError) onError(error);
      };
      
      this.websocket.onclose = () => {
        console.log('Conexão WebSocket fechada');
      };
    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error);
      if (onError) onError(error);
    }
  }

  /**
   * Desconecta o WebSocket
   */
  disconnectWebSocket() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  /**
   * Valida se o Claude Code está instalado
   * @returns {Promise<Object>} Status da instalação
   */
  async validateClaudeCode() {
    try {
      const response = await fetch(`${this.baseUrl}/api/validate-claude`, {
        method: 'GET'
      });
      return await response.json();
    } catch (error) {
      return {
        installed: false,
        error: error.message
      };
    }
  }

  /**
   * Lista os agentes disponíveis
   * @returns {Promise<Array>} Lista de agentes
   */
  async getAvailableAgents() {
    try {
      const response = await fetch(`${this.baseUrl}/api/agents`, {
        method: 'GET'
      });
      return await response.json();
    } catch (error) {
      // Fallback para agentes padrão
      return [
        {
          id: 'coder',
          name: 'Coder',
          description: 'Especialista em implementação de código',
          icon: '👨‍💻',
          default: true
        },
        {
          id: 'tester',
          name: 'Tester',
          description: 'Criação e validação de testes',
          icon: '🧪',
          default: true
        },
        {
          id: 'architect',
          name: 'Architect',
          description: 'Design de arquitetura de sistemas',
          icon: '🏗️',
          default: false
        },
        {
          id: 'researcher',
          name: 'Researcher',
          description: 'Pesquisa e análise de informações',
          icon: '🔍',
          default: false
        }
      ];
    }
  }

  /**
   * Lista os servidores MCP disponíveis
   * @returns {Promise<Array>} Lista de servidores MCP
   */
  async getAvailableMcpServers() {
    try {
      const response = await fetch(`${this.baseUrl}/api/mcp-servers`, {
        method: 'GET'
      });
      return await response.json();
    } catch (error) {
      // Fallback para servidores padrão
      return [
        {
          id: 'claude-flow',
          name: 'Claude Flow MCP',
          description: 'Servidor principal do Claude Flow com orquestração de swarm',
          command: 'npx claude-flow@alpha mcp start',
          default: true
        },
        {
          id: 'ruv-swarm',
          name: 'Ruv-Swarm MCP',
          description: 'Servidor ruv-swarm para coordenação avançada',
          command: 'npx ruv-swarm mcp start',
          default: true
        }
      ];
    }
  }

  /**
   * Obtém templates de projeto disponíveis
   * @returns {Promise<Array>} Lista de templates
   */
  async getProjectTemplates() {
    try {
      const response = await fetch(`${this.baseUrl}/api/templates`, {
        method: 'GET'
      });
      return await response.json();
    } catch (error) {
      // Fallback para templates padrão
      return [
        {
          id: 'full',
          name: 'Projeto Completo',
          description: 'Configuração completa com todos os recursos',
          recommended: true
        },
        {
          id: 'sparc',
          name: 'Projeto SPARC',
          description: 'Configuração otimizada para metodologia SPARC TDD',
          recommended: false
        },
        {
          id: 'minimal',
          name: 'Configuração Mínima',
          description: 'Apenas os arquivos essenciais',
          recommended: false
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          description: 'Configuração para projetos corporativos',
          recommended: false
        }
      ];
    }
  }

  /**
   * Constrói o comando CLI baseado na configuração do wizard
   * @param {Object} config - Configurações do wizard
   * @returns {Array} Argumentos do comando CLI
   */
  buildCliCommand(config) {
    const args = [];
    
    // Tipo de projeto
    if (config.projectType && config.projectType !== 'full') {
      args.push('--type', config.projectType);
    }
    
    // Nome do projeto
    if (config.projectName) {
      args.push('--name', config.projectName);
    }
    
    // Descrição
    if (config.projectDescription) {
      args.push('--description', config.projectDescription);
    }
    
    // Agentes
    if (config.agents && config.agents.length > 0) {
      args.push('--agents', config.agents.join(','));
    }
    
    // Servidores MCP
    if (config.mcpServers && config.mcpServers.length > 0) {
      args.push('--mcp-servers', config.mcpServers.join(','));
    }
    
    // Setup automático MCP
    if (config.autoSetupMcp === false) {
      args.push('--no-mcp-setup');
    }
    
    // Estrutura de arquivos
    if (config.fileStructure) {
      if (!config.fileStructure.createGitignore) {
        args.push('--no-gitignore');
      }
      if (!config.fileStructure.createMemoryStructure) {
        args.push('--no-memory');
      }
      if (config.fileStructure.createSparcStructure) {
        args.push('--sparc');
      }
    }
    
    // Opções de execução
    if (config.executionOptions) {
      if (config.executionOptions.dryRun) {
        args.push('--dry-run');
      }
      if (config.executionOptions.verbose) {
        args.push('--verbose');
      }
    }
    
    return args;
  }

  /**
   * Simula a execução para desenvolvimento/testes
   * @param {Object} config - Configurações do wizard
   * @returns {Promise<Object>} Resultado simulado
   */
  async simulateExecution(config) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const files = [
          '.claude/CLAUDE.md',
          '.claude/settings.json',
          '.claude/commands/'
        ];
        
        if (config.fileStructure?.createMemoryStructure) {
          files.push('memory-bank.md', '.claude/memory/');
        }
        
        if (config.fileStructure?.createSparcStructure) {
          files.push('sparc/', 'sparc/specs/', 'sparc/pseudocode/', 'sparc/architecture/');
        }
        
        if (config.fileStructure?.createGitignore) {
          files.push('.gitignore');
        }
        
        resolve({
          success: true,
          message: 'Inicialização concluída com sucesso',
          files: files,
          mcpSetup: config.autoSetupMcp !== false,
          mcpServers: config.mcpServers || ['claude-flow', 'ruv-swarm'],
          agents: config.agents || ['coder', 'tester'],
          projectPath: process.cwd?.() || '/current/directory',
          duration: '2.3s'
        });
      }, 2000 + Math.random() * 2000); // 2-4 segundos
    });
  }

  /**
   * Obtém o status atual do projeto
   * @returns {Promise<Object>} Status do projeto
   */
  async getProjectStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/api/project-status`, {
        method: 'GET'
      });
      return await response.json();
    } catch (error) {
      return {
        initialized: false,
        hasClaudeConfig: false,
        hasMcpServers: false,
        error: error.message
      };
    }
  }
}

// Instância global da API
window.InitAPI = new InitAPI();

// Export para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InitAPI;
}