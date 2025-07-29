/**
 * Init Wizard View - Componente React para o assistente de inicialização
 * Integra com a arquitetura web-ui existente do Claude Flow
 */

export default class InitWizardView {
  constructor() {
    this.viewId = 'init-wizard';
    this.title = 'Assistente de Inicialização';
    this.icon = '🚀';
    this.category = 'setup';
    
    this.wizard = null;
    this.container = null;
  }

  /**
   * Renderiza a view
   * @param {HTMLElement} container - Container onde renderizar
   * @returns {Promise<void>}
   */
  async render(container) {
    this.container = container;
    
    // Load CSS if not already loaded
    await this.loadStyles();
    
    // Create wizard HTML structure
    container.innerHTML = this.getWizardHTML();
    
    // Initialize wizard logic
    await this.initializeWizard();
    
    return this;
  }

  /**
   * Carrega os estilos necessários
   */
  async loadStyles() {
    const stylesheets = [
      '/styles/init-wizard.css'
    ];
    
    for (const stylesheet of stylesheets) {
      if (!document.querySelector(`link[href="${stylesheet}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = stylesheet;
        document.head.appendChild(link);
      }
    }
  }

  /**
   * Inicializa a lógica do wizard
   */
  async initializeWizard() {
    // Import wizard logic
    const { InitWizard } = await import('../js/init-wizard.js');
    this.wizard = new InitWizard();
    
    // Custom integration with web-ui architecture
    this.setupWebUIIntegration();
  }

  /**
   * Configura integração com a arquitetura web-ui
   */
  setupWebUIIntegration() {
    // Listen for wizard events
    this.container.addEventListener('wizard:complete', (event) => {
      this.onWizardComplete(event.detail);
    });
    
    this.container.addEventListener('wizard:error', (event) => {
      this.onWizardError(event.detail);
    });
    
    // Integrate with EventBus if available
    if (window.EventBus) {
      window.EventBus.on('init:start', () => this.startWizard());
      window.EventBus.on('init:reset', () => this.resetWizard());
    }
  }

  /**
   * Manipula completion do wizard
   * @param {Object} result - Resultado da inicialização
   */
  onWizardComplete(result) {
    console.log('Wizard concluído:', result);
    
    // Emit event to web-ui system
    if (window.EventBus) {
      window.EventBus.emit('init:complete', result);
    }
    
    // Show success notification
    this.showNotification('Inicialização concluída com sucesso!', 'success');
    
    // Auto-redirect after delay
    setTimeout(() => {
      this.redirectToConsole();
    }, 3000);
  }

  /**
   * Manipula erros do wizard
   * @param {Object} error - Erro ocorrido
   */
  onWizardError(error) {
    console.error('Erro no wizard:', error);
    
    // Emit event to web-ui system
    if (window.EventBus) {
      window.EventBus.emit('init:error', error);
    }
    
    // Show error notification
    this.showNotification(`Erro: ${error.message}`, 'error');
  }

  /**
   * Inicia o wizard
   */
  startWizard() {
    if (this.wizard) {
      this.wizard.reset();
      this.wizard.start();
    }
  }

  /**
   * Reseta o wizard
   */
  resetWizard() {
    if (this.wizard) {
      this.wizard.reset();
    }
  }

  /**
   * Mostra notificação
   * @param {string} message - Mensagem a exibir
   * @param {string} type - Tipo da notificação (success, error, warning, info)
   */
  showNotification(message, type = 'info') {
    // Use web-ui notification system if available
    if (window.NotificationManager) {
      window.NotificationManager.show(message, type);
      return;
    }
    
    // Fallback notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      border-radius: 8px;
      color: white;
      font-family: var(--font-mono);
      font-size: 14px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    
    switch (type) {
      case 'success':
        notification.style.backgroundColor = '#3fb950';
        break;
      case 'error':
        notification.style.backgroundColor = '#f85149';
        break;
      case 'warning':
        notification.style.backgroundColor = '#d29922';
        break;
      default:
        notification.style.backgroundColor = '#58a6ff';
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  /**
   * Redireciona para o console principal
   */
  redirectToConsole() {
    // Use web-ui router if available
    if (window.ViewManager) {
      window.ViewManager.navigateTo('console');
      return;
    }
    
    // Fallback redirect
    window.location.href = '/console';
  }

  /**
   * Retorna o HTML do wizard
   * @returns {string} HTML structure
   */
  getWizardHTML() {
    return `
      <div class="init-wizard-container">
        <!-- Header -->
        <header class="wizard-header">
          <div class="header-content">
            <h1 class="wizard-title">
              <span class="icon">🚀</span>
              Claude Flow - Assistente de Inicialização
            </h1>
            <div class="progress-indicator">
              <div class="progress-bar">
                <div class="progress-fill" id="progressFill"></div>
              </div>
              <span class="progress-text" id="progressText">Passo 1 de 5</span>
            </div>
          </div>
        </header>

        <!-- Main Content -->
        <main class="wizard-main">
          ${this.getStepsHTML()}
        </main>

        <!-- Navigation Footer -->
        <footer class="wizard-footer">
          <div class="footer-content">
            <button class="btn btn-secondary" id="prevBtn" disabled>
              ← Anterior
            </button>
            <div class="step-indicators" id="stepIndicators">
              <span class="indicator active" data-step="1"></span>
              <span class="indicator" data-step="2"></span>
              <span class="indicator" data-step="3"></span>
              <span class="indicator" data-step="4"></span>
              <span class="indicator" data-step="5"></span>
            </div>
            <button class="btn btn-primary" id="nextBtn">
              Próximo →
            </button>
          </div>
        </footer>
      </div>
    `;
  }

  /**
   * Retorna o HTML dos steps
   * @returns {string} Steps HTML
   */
  getStepsHTML() {
    return `
      <!-- Step 1: Tipo de Projeto -->
      <section class="wizard-step active" id="step1">
        <div class="step-content">
          <h2 class="step-title">
            <span class="step-icon">📋</span>
            Configuração do Projeto
          </h2>
          <p class="step-description">
            Selecione o tipo de projeto e configurações iniciais para o Claude Flow.
          </p>
          
          <div class="form-group">
            <label for="projectType" class="form-label">Tipo de Projeto:</label>
            <select id="projectType" class="form-select">
              <option value="">Selecione...</option>
              <option value="full">Projeto Completo (Recomendado)</option>
              <option value="sparc">Projeto SPARC (TDD)</option>
              <option value="minimal">Configuração Mínima</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div class="form-group">
            <label for="projectName" class="form-label">Nome do Projeto:</label>
            <input type="text" id="projectName" class="form-input" placeholder="meu-projeto">
          </div>

          <div class="form-group">
            <label for="projectDescription" class="form-label">Descrição:</label>
            <textarea id="projectDescription" class="form-textarea" placeholder="Descrição do projeto..."></textarea>
          </div>
        </div>
      </section>

      <!-- Additional steps would be here... -->
      <!-- For brevity, including only step 1 in this component -->
      
      <!-- Placeholder for other steps -->
      <div id="additionalSteps"></div>
    `;
  }

  /**
   * Cleanup quando a view é destruída
   */
  destroy() {
    if (this.wizard) {
      this.wizard.destroy();
    }
    
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  /**
   * Obtém informações da view para registro
   * @returns {Object} View info
   */
  getViewInfo() {
    return {
      id: this.viewId,
      title: this.title,
      icon: this.icon,
      category: this.category,
      description: 'Assistente interativo para inicialização de projetos Claude Flow',
      features: [
        'Configuração guiada de projeto',
        'Seleção de agentes',
        'Setup automático de MCP',
        'Estrutura de arquivos personalizável',
        'Integração com CLI'
      ]
    };
  }
}

// Register view with web-ui system
if (window.ViewManager) {
  window.ViewManager.registerView('init-wizard', InitWizardView);
}

// Export for manual usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InitWizardView;
}