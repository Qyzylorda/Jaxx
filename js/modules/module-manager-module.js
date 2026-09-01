/**
 * Модуль управления модулями (Module Manager)
 * Позволяет включать, отключать и удалять модули через UI с подтверждением
 */

const ModuleManagerModule = {
  name: 'ModuleManagerModule',
  version: '1.0.0',
  
  // Элементы интерфейса
  elements: {},
  
  // Инициализация модуля
  init: function(app) {
    this.app = app;
    this.createModulePanel();
    this.setupEventListeners();
    this.updateModuleList();
    console.log(`[${this.name}] инициализирован`);
    return true;
  },
  
  // Создание панели управления модулями
  createModulePanel: function() {
    const panel = document.createElement('div');
    panel.id = 'roadmap-module-manager';
    panel.className = 'module-manager';
    panel.innerHTML = `
      <h3>🔧 Управление модулями</h3>
      <div id="module-list"></div>
      <div class="module-info">
        <p><small>⚠️ ObjectModule нельзя отключить</small></p>
        <p><small>✅ Зеленый - активен</small></p>
        <p><small>🔴 Красный - отключен</small></p>
      </div>
    `;
    
    document.body.appendChild(panel);
    this.elements.modulePanel = panel;
  },
  
  // Обновление списка модулей
  updateModuleList: function() {
    const moduleList = document.getElementById('module-list');
    if (!moduleList) return;
    
    moduleList.innerHTML = '';
    
    // Получаем список всех доступных модулей из ModuleSystem
    const availableModules = window.ModuleSystem.availableModules || {};
    const moduleConfig = window.ModuleSystem.moduleConfig || {};
    const activeModules = this.app.modules || {};
    
    for (const [moduleName, moduleClass] of Object.entries(availableModules)) {
      if (!moduleClass) continue;
      
      const isEnabled = moduleConfig[moduleName] !== false;
      const isActive = !!activeModules[moduleName];
      const isRequired = moduleName === 'ObjectModule';
      
      const moduleItem = document.createElement('div');
      moduleItem.className = 'module-item';
      moduleItem.dataset.module = moduleName;
      
      const statusClass = isActive ? 'status-active' : (isEnabled ? 'status-inactive' : 'status-disabled');
      const statusIcon = isActive ? '✅' : (isEnabled ? '🔴' : '⚫');
      
      moduleItem.innerHTML = `
        <div class="module-header">
          <span class="module-status ${statusClass}">${statusIcon}</span>
          <span class="module-name">${moduleName}</span>
        </div>
        <div class="module-controls">
          ${!isRequired && !isActive ? '<button class="btn-enable" title="Включить модуль">▶️ Вкл</button>' : ''}
          ${!isRequired && isActive ? '<button class="btn-disable" title="Отключить модуль">⏸️ Выкл</button>' : ''}
          ${!isRequired ? '<button class="btn-remove" title="Удалить модуль">🗑️ Удалить</button>' : ''}
          ${isRequired ? '<span class="required-badge">Обязательный</span>' : ''}
        </div>
      `;
      
      moduleList.appendChild(moduleItem);
    }
  },
  
  // Настройка обработчиков событий
  setupEventListeners: function() {
    // Делегирование событий для динамических элементов
    const moduleList = document.getElementById('module-list');
    if (!moduleList) return;
    
    moduleList.addEventListener('click', (e) => {
      const moduleItem = e.target.closest('.module-item');
      if (!moduleItem) return;
      
      const moduleName = moduleItem.dataset.module;
      
      if (e.target.classList.contains('btn-enable')) {
        this.handleEnableModule(moduleName);
      } else if (e.target.classList.contains('btn-disable')) {
        this.handleDisableModule(moduleName);
      } else if (e.target.classList.contains('btn-remove')) {
        this.handleRemoveModule(moduleName);
      }
    });
    
    // Кнопка обновления списка
    const refreshBtn = document.createElement('button');
    refreshBtn.id = 'btn-refresh-modules';
    refreshBtn.textContent = '🔄 Обновить список';
    refreshBtn.addEventListener('click', () => this.updateModuleList());
    this.elements.modulePanel.appendChild(refreshBtn);
  },
  
  // Включение модуля
  handleEnableModule: function(moduleName) {
    if (!window.ModuleSystem) {
      alert('Система модулей не доступна');
      return;
    }
    
    const confirmMsg = `Включить модуль "${moduleName}"?\n\nМодуль будет загружен и активирован.`;
    
    if (confirm(confirmMsg)) {
      try {
        window.ModuleSystem.enableModule(moduleName);
        
        // Пытаемся зарегистрировать модуль
        const moduleClass = window.ModuleSystem.availableModules[moduleName];
        if (moduleClass && this.app.registerModule) {
          this.app.registerModule(moduleName, moduleClass);
        }
        
        this.updateModuleList();
        
        // Перерисовываем canvas
        if (this.app.render) {
          this.app.render();
        }
        
        alert(`Модуль "${moduleName}" успешно включен!`);
      } catch (error) {
        console.error(error);
        alert(`Ошибка при включении модуля "${moduleName}": ${error.message}`);
      }
    }
  },
  
  // Отключение модуля
  handleDisableModule: function(moduleName) {
    if (moduleName === 'ObjectModule') {
      alert('❌ Нельзя отключить ObjectModule - это базовый модуль!');
      return;
    }
    
    if (!window.ModuleSystem) {
      alert('Система модулей не доступна');
      return;
    }
    
    const confirmMsg = `Отключить модуль "${moduleName}"?\n\nФункционал модуля перестанет быть доступен.\nПриложение продолжит работать без этого модуля.`;
    
    if (confirm(confirmMsg)) {
      try {
        // Отключаем модуль в системе
        if (this.app.unregisterModule) {
          this.app.unregisterModule(moduleName);
        }
        
        window.ModuleSystem.disableModule(moduleName);
        
        this.updateModuleList();
        
        // Перерисовываем canvas
        if (this.app.render) {
          this.app.render();
        }
        
        alert(`Модуль "${moduleName}" успешно отключен!`);
      } catch (error) {
        console.error(error);
        alert(`Ошибка при отключении модуля "${moduleName}": ${error.message}`);
      }
    }
  },
  
  // "Удаление" модуля (фактически отключение с пометкой)
  handleRemoveModule: function(moduleName) {
    if (moduleName === 'ObjectModule') {
      alert('❌ Нельзя удалить ObjectModule - это базовый модуль!');
      return;
    }
    
    if (!window.ModuleSystem) {
      alert('Система модулей не доступна');
      return;
    }
    
    const confirmMsg = `⚠️ Удалить модуль "${moduleName}"?\n\nЭто действие отключит модуль и пометит его как удаленный.\n\nВы уверены?`;
    
    if (confirm(confirmMsg)) {
      const secondConfirm = `Вы действительно хотите удалить модуль "${moduleName}"?\n\nЭто действие нельзя отменить без перезагрузки страницы.`;
      
      if (confirm(secondConfirm)) {
        try {
          // Отключаем модуль в системе
          if (this.app.unregisterModule) {
            this.app.unregisterModule(moduleName);
          }
          
          window.ModuleSystem.disableModule(moduleName);
          
          // Помечаем модуль как удаленный (добавляем флаг)
          if (!window.ModuleSystem.removedModules) {
            window.ModuleSystem.removedModules = [];
          }
          window.ModuleSystem.removedModules.push(moduleName);
          
          this.updateModuleList();
          
          // Перерисовываем canvas
          if (this.app.render) {
            this.app.render();
          }
          
          alert(`Модуль "${moduleName}" успешно удален!`);
        } catch (error) {
          console.error(error);
          alert(`Ошибка при удалении модуля "${moduleName}": ${error.message}`);
        }
      }
    }
  },
  
  // Очистка (вызывается при уничтожении модуля)
  destroy: function() {
    if (this.elements.modulePanel) {
      this.elements.modulePanel.remove();
    }
    console.log(`[${this.name}] уничтожен`);
  }
};

// Делаем модуль доступным глобально
if (typeof window !== 'undefined') {
  window.ModuleManagerModule = ModuleManagerModule;
}

// Export для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModuleManagerModule;
}
