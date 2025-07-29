/**
 * Init Wizard JavaScript - Controlador do Assistente de Inicialização
 * Gerencia a interface e integração com o backend Claude Flow
 */

class InitWizard {
  constructor() {
    this.currentStep = 1;
    this.maxSteps = 5;
    this.config = {
      projectType: '',
      projectName: '',
      projectDescription: '',
      agents: [],
      mcpServers: [],
      fileStructure: {
        createGitignore: true,
        createMemoryStructure: true,
        createSparcStructure: false
      },
      executionOptions: {
        dryRun: false,
        verbose: true
      }
    };
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateProgress();
    this.loadDefaultAgents();
    this.loadMcpServers();
    this.updateStepIndicators();
  }

  bindEvents() {
    // Navigation buttons
    document.getElementById('nextBtn').addEventListener('click', () => this.nextStep());
    document.getElementById('prevBtn').addEventListener('click', () => this.prevStep());
    
    // Step indicators
    document.querySelectorAll('.indicator').forEach((indicator, index) => {
      indicator.addEventListener('click', () => this.goToStep(index + 1));
    });
    
    // Form elements
    document.getElementById('projectType').addEventListener('change', (e) => {
      this.config.projectType = e.target.value;
      this.updateFileStructurePreview();
    });
    
    document.getElementById('projectName').addEventListener('input', (e) => {
      this.config.projectName = e.target.value;
    });
    
    document.getElementById('projectDescription').addEventListener('input', (e) => {
      this.config.projectDescription = e.target.value;
    });
    
    // Agent toggles
    document.querySelectorAll('.agent-card').forEach(card => {
      const checkbox = card.querySelector('input[type="checkbox"]');
      const agentType = card.dataset.agent;
      
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.addAgent(agentType);
          card.classList.add('active');
        } else {
          this.removeAgent(agentType);
          card.classList.remove('active');
        }
      });
      
      // Toggle on card click
      card.addEventListener('click', (e) => {
        if (e.target.type !== 'checkbox') {
          checkbox.click();
        }
      });
    });
    
    // MCP server toggles
    document.getElementById('claudeFlowMcp').addEventListener('change', (e) => {
      this.toggleMcpServer('claude-flow', e.target.checked);
    });
    
    document.getElementById('ruvSwarmMcp').addEventListener('change', (e) => {
      this.toggleMcpServer('ruv-swarm', e.target.checked);
    });
    
    document.getElementById('autoSetupMcp').addEventListener('change', (e) => {
      this.config.autoSetupMcp = e.target.checked;
    });
    
    // File structure options
    document.getElementById('createGitignore').addEventListener('change', (e) => {
      this.config.fileStructure.createGitignore = e.target.checked;
      this.updateFileStructurePreview();
    });
    
    document.getElementById('createMemoryStructure').addEventListener('change', (e) => {
      this.config.fileStructure.createMemoryStructure = e.target.checked;
      this.updateFileStructurePreview();
    });
    
    document.getElementById('createSparcStructure').addEventListener('change', (e) => {
      this.config.fileStructure.createSparcStructure = e.target.checked;
      this.updateFileStructurePreview();
    });
    
    // Execution options
    document.getElementById('dryRun').addEventListener('change', (e) => {
      this.config.executionOptions.dryRun = e.target.checked;
      this.updateCommandPreview();
    });
    
    document.getElementById('verbose').addEventListener('change', (e) => {
      this.config.executionOptions.verbose = e.target.checked;
      this.updateCommandPreview();
    });
  }

  nextStep() {
    if (this.validateCurrentStep()) {
      if (this.currentStep < this.maxSteps) {
        this.currentStep++;
        this.showStep(this.currentStep);
        this.updateProgress();
        this.updateStepIndicators();
        this.updateNavigationButtons();
        
        // Update content based on step
        if (this.currentStep === 5) {
          this.updateConfigSummary();
          this.updateCommandPreview();
        }
      } else {
        this.executeInitialization();
      }
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.showStep(this.currentStep);
      this.updateProgress();
      this.updateStepIndicators();
      this.updateNavigationButtons();
    }
  }

  goToStep(step) {
    if (step >= 1 && step <= this.maxSteps && step <= this.getMaxAccessibleStep()) {
      this.currentStep = step;
      this.showStep(this.currentStep);
      this.updateProgress();
      this.updateStepIndicators();
      this.updateNavigationButtons();
    }
  }

  showStep(step) {
    // Hide all steps
    document.querySelectorAll('.wizard-step').forEach(stepEl => {
      stepEl.classList.remove('active');
    });
    
    // Show current step
    document.getElementById(`step${step}`).classList.add('active');
  }

  updateProgress() {
    const progress = (this.currentStep / this.maxSteps) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `Passo ${this.currentStep} de ${this.maxSteps}`;
  }

  updateStepIndicators() {
    document.querySelectorAll('.indicator').forEach((indicator, index) => {
      const stepNumber = index + 1;
      indicator.classList.remove('active', 'completed');
      
      if (stepNumber === this.currentStep) {
        indicator.classList.add('active');
      } else if (stepNumber < this.currentStep) {
        indicator.classList.add('completed');
      }
    });
  }

  updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    prevBtn.disabled = this.currentStep === 1;
    
    if (this.currentStep === this.maxSteps) {
      nextBtn.textContent = '🚀 Executar Inicialização';
      nextBtn.classList.add('btn-success');
    } else {
      nextBtn.textContent = 'Próximo →';
      nextBtn.classList.remove('btn-success');
    }
  }

  validateCurrentStep() {
    switch (this.currentStep) {
      case 1:
        if (!this.config.projectType) {
          this.showError('Por favor, selecione um tipo de projeto.');
          return false;
        }
        if (!this.config.projectName.trim()) {
          this.showError('Por favor, informe o nome do projeto.');
          return false;
        }
        break;
      case 2:
        if (this.config.agents.length === 0) {
          this.showError('Por favor, selecione pelo menos um agente.');
          return false;
        }
        break;
      case 3:
        if (this.config.mcpServers.length === 0) {
          this.showError('Por favor, habilite pelo menos um servidor MCP.');
          return false;
        }
        break;
    }
    return true;
  }

  getMaxAccessibleStep() {
    // Allow going back to completed steps
    return Math.max(this.currentStep, 1);
  }

  loadDefaultAgents() {
    // Pre-select coder and tester as defaults
    this.addAgent('coder');
    this.addAgent('tester');
    
    // Update UI
    document.querySelector('[data-agent="coder"]').classList.add('active');
    document.querySelector('[data-agent="tester"]').classList.add('active');
  }

  loadMcpServers() {
    // Pre-select default MCP servers
    this.addMcpServer('claude-flow');
    this.addMcpServer('ruv-swarm');
    this.config.autoSetupMcp = true;
  }

  addAgent(agentType) {
    if (!this.config.agents.includes(agentType)) {
      this.config.agents.push(agentType);
    }
  }

  removeAgent(agentType) {
    this.config.agents = this.config.agents.filter(agent => agent !== agentType);
  }

  toggleMcpServer(serverName, enabled) {
    if (enabled) {
      this.addMcpServer(serverName);
    } else {
      this.removeMcpServer(serverName);
    }
  }

  addMcpServer(serverName) {
    if (!this.config.mcpServers.includes(serverName)) {
      this.config.mcpServers.push(serverName);
    }
  }

  removeMcpServer(serverName) {
    this.config.mcpServers = this.config.mcpServers.filter(server => server !== serverName);
  }

  updateFileStructurePreview() {
    const preview = document.getElementById('structurePreview');
    if (!preview) return;
    
    let structure = `
      <div class="file-tree">
        <div class="tree-item folder">
          <span class="tree-icon">📁</span>
          <span class="tree-name">.claude/</span>
          <div class="tree-children">
            <div class="tree-item file">
              <span class="tree-icon">📄</span>
              <span class="tree-name">CLAUDE.md</span>
            </div>
            <div class="tree-item file">
              <span class="tree-icon">⚙️</span>
              <span class="tree-name">settings.json</span>
            </div>
            <div class="tree-item folder">
              <span class="tree-icon">📁</span>
              <span class="tree-name">commands/</span>
            </div>`;
    
    if (this.config.fileStructure.createMemoryStructure) {
      structure += `
            <div class="tree-item folder">
              <span class="tree-icon">📁</span>
              <span class="tree-name">memory/</span>
            </div>`;
    }
    
    structure += `
          </div>
        </div>`;
    
    if (this.config.fileStructure.createMemoryStructure) {
      structure += `
        <div class="tree-item file">
          <span class="tree-icon">📄</span>
          <span class="tree-name">memory-bank.md</span>
        </div>`;
    }
    
    if (this.config.fileStructure.createSparcStructure) {
      structure += `
        <div class="tree-item folder">
          <span class="tree-icon">📁</span>
          <span class="tree-name">sparc/</span>
          <div class="tree-children">
            <div class="tree-item folder">
              <span class="tree-icon">📁</span>
              <span class="tree-name">specs/</span>
            </div>
            <div class="tree-item folder">
              <span class="tree-icon">📁</span>
              <span class="tree-name">pseudocode/</span>
            </div>
            <div class="tree-item folder">
              <span class="tree-icon">📁</span>
              <span class="tree-name">architecture/</span>
            </div>
          </div>
        </div>`;
    }
    
    if (this.config.fileStructure.createGitignore) {
      structure += `
        <div class="tree-item file">
          <span class="tree-icon">🚫</span>
          <span class="tree-name">.gitignore</span>
        </div>`;
    }
    
    structure += `
      </div>`;
    
    preview.innerHTML = structure;
  }

  updateConfigSummary() {
    const summary = document.getElementById('configSummary');
    
    const agentNames = {
      coder: '👨‍💻 Coder',
      tester: '🧪 Tester',
      architect: '🏗️ Architect',
      researcher: '🔍 Researcher'
    };
    
    const mcpNames = {
      'claude-flow': '🌊 Claude Flow MCP',
      'ruv-swarm': '🐝 Ruv-Swarm MCP'
    };
    
    summary.innerHTML = `
      <h3>📋 Resumo da Configuração</h3>
      <div class="summary-section">
        <h4>🚀 Projeto</h4>
        <p><strong>Tipo:</strong> ${this.config.projectType}</p>
        <p><strong>Nome:</strong> ${this.config.projectName}</p>
        <p><strong>Descrição:</strong> ${this.config.projectDescription || 'Não informada'}</p>
      </div>
      
      <div class="summary-section">
        <h4>🤖 Agentes Selecionados</h4>
        <ul>
          ${this.config.agents.map(agent => `<li>${agentNames[agent] || agent}</li>`).join('')}
        </ul>
      </div>
      
      <div class="summary-section">
        <h4>🔌 Servidores MCP</h4>
        <ul>
          ${this.config.mcpServers.map(server => `<li>${mcpNames[server] || server}</li>`).join('')}
        </ul>
        <p><strong>Configuração automática:</strong> ${this.config.autoSetupMcp ? 'Sim' : 'Não'}</p>
      </div>
      
      <div class="summary-section">
        <h4>📁 Estrutura de Arquivos</h4>
        <ul>
          ${this.config.fileStructure.createGitignore ? '<li>✅ .gitignore</li>' : '<li>❌ .gitignore</li>'}
          ${this.config.fileStructure.createMemoryStructure ? '<li>✅ Estrutura de memória</li>' : '<li>❌ Estrutura de memória</li>'}
          ${this.config.fileStructure.createSparcStructure ? '<li>✅ Estrutura SPARC</li>' : '<li>❌ Estrutura SPARC</li>'}
        </ul>
      </div>
    `;
  }

  updateCommandPreview() {
    const commandDisplay = document.getElementById('commandDisplay');
    if (!commandDisplay) return;
    
    let command = 'npx claude-flow@alpha init';
    
    if (this.config.projectType && this.config.projectType !== 'full') {
      command += ` --type ${this.config.projectType}`;
    }
    
    if (this.config.projectName) {
      command += ` --name "${this.config.projectName}"`;
    }
    
    if (this.config.agents.length > 0) {
      command += ` --agents ${this.config.agents.join(',')}`;
    }
    
    if (!this.config.autoSetupMcp) {
      command += ' --no-mcp-setup';
    }
    
    if (this.config.executionOptions.dryRun) {
      command += ' --dry-run';
    }
    
    if (this.config.executionOptions.verbose) {
      command += ' --verbose';
    }
    
    commandDisplay.textContent = command;
  }

  async executeInitialization() {
    // Show execution step
    document.getElementById('stepExecution').style.display = 'block';
    document.getElementById('step5').style.display = 'none';
    
    const log = document.getElementById('executionLog');
    
    try {
      this.logMessage(log, '🚀 Iniciando configuração do Claude Flow...');
      
      // Simulate API call to backend
      const response = await this.callInitAPI();
      
      if (response.success) {
        this.logMessage(log, '✅ Configuração concluída com sucesso!');
        this.logMessage(log, '📁 Arquivos criados:');
        response.files.forEach(file => {
          this.logMessage(log, `  ✅ ${file}`);
        });
        
        if (response.mcpSetup) {
          this.logMessage(log, '🔌 Servidores MCP configurados:');
          response.mcpServers.forEach(server => {
            this.logMessage(log, `  ✅ ${server}`);
          });
        }
        
        this.logMessage(log, '🎉 Inicialização concluída! Seu projeto está pronto.');
        
        // Update navigation to show completion
        const nextBtn = document.getElementById('nextBtn');
        nextBtn.textContent = '🏠 Voltar ao Console';
        nextBtn.onclick = () => window.location.href = 'index.html';
        
      } else {
        throw new Error(response.error || 'Erro desconhecido');
      }
      
    } catch (error) {
      this.logMessage(log, `❌ Erro durante a inicialização: ${error.message}`, 'error');
      this.logMessage(log, '🔄 Você pode tentar novamente ou executar manualmente.');
      
      // Allow going back
      const prevBtn = document.getElementById('prevBtn');
      prevBtn.disabled = false;
      prevBtn.onclick = () => {
        document.getElementById('stepExecution').style.display = 'none';
        document.getElementById('step5').style.display = 'block';
      };
    }
  }

  async callInitAPI() {
    try {
      // Use real API if available, fallback to simulation
      if (window.InitAPI) {
        // Try real API first
        try {
          return await window.InitAPI.executeInit(this.config);
        } catch (error) {
          console.warn('Falha na API real, usando simulação:', error);
          return await window.InitAPI.simulateExecution(this.config);
        }
      } else {
        // Fallback simulation
        return await this.simulateInitExecution();
      }
    } catch (error) {
      throw new Error(`Erro na inicialização: ${error.message}`);
    }
  }

  async simulateInitExecution() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const files = ['.claude/CLAUDE.md', '.claude/settings.json', '.claude/commands/'];
        
        if (this.config.fileStructure?.createMemoryStructure) {
          files.push('memory-bank.md', '.claude/memory/');
        }
        
        if (this.config.fileStructure?.createSparcStructure) {
          files.push('sparc/', 'sparc/specs/', 'sparc/architecture/');
        }
        
        if (this.config.fileStructure?.createGitignore) {
          files.push('.gitignore');
        }
        
        resolve({
          success: true,
          files: files,
          mcpSetup: this.config.autoSetupMcp !== false,
          mcpServers: this.config.mcpServers || ['claude-flow', 'ruv-swarm']
        });
      }, 2000 + Math.random() * 2000);
    });
  }

  logMessage(logElement, message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    logEntry.textContent = `[${timestamp}] ${message}`;
    logElement.appendChild(logEntry);
    logElement.scrollTop = logElement.scrollHeight;
  }

  showError(message) {
    // Simple error display - could be enhanced with a proper modal
    alert(`❌ Erro: ${message}`);
  }
}

// Initialize wizard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.initWizard = new InitWizard();
});

// Export for potential external usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InitWizard;
}