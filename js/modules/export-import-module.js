/**
 * Модуль экспорта/импорта проектов
 * Опциональный модуль - можно отключить без нарушения работы приложения
 */

const ExportImportModule = {
  name: 'ExportImportModule',
  version: '1.0.0',
  
  // Инициализация модуля
  init: function(app) {
    this.app = app;
    console.log(`[${this.name}] инициализирован`);
    return true;
  },
  
  // Экспорт всего проекта в JSON
  exportProject: function() {
    if (!this.app) {
      console.error(`[${this.name}] Приложение не инициализировано`);
      return null;
    }
    
    const projectData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      objects: this.app.objects || [],
      connections: (window.ConnectionModule && window.ConnectionModule.connections) || [],
      metadata: {
        name: this.app.projectName || 'Без названия',
        description: this.app.projectDescription || '',
        author: this.app.author || 'Аноним'
      }
    };
    
    return JSON.stringify(projectData, null, 2);
  },
  
  // Скачивание проекта как файла
  downloadProject: function(filename = 'roadmap-project.json') {
    const data = this.exportProject();
    if (!data) return;
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  
  // Импорт проекта из JSON строки
  importProject: function(jsonString) {
    try {
      const projectData = JSON.parse(jsonString);
      
      if (!projectData.objects || !Array.isArray(projectData.objects)) {
        throw new Error('Неверный формат файла: отсутствуют объекты');
      }
      
      // Очищаем текущий проект
      this.app.objects = [];
      
      if (window.ConnectionModule && window.ConnectionModule.clearAll) {
        window.ConnectionModule.clearAll();
      }
      
      // Импортируем объекты
      projectData.objects.forEach(obj => {
        this.app.addObject(obj);
      });
      
      // Импортируем соединения если есть
      if (projectData.connections && Array.isArray(projectData.connections)) {
        if (window.ConnectionModule && window.ConnectionModule.importConnections) {
          window.ConnectionModule.importConnections(JSON.stringify(projectData.connections));
        }
      }
      
      // Восстанавливаем метаданные
      if (projectData.metadata) {
        this.app.projectName = projectData.metadata.name || 'Импортированный проект';
        this.app.projectDescription = projectData.metadata.description || '';
        this.app.author = projectData.metadata.author || '';
      }
      
      this.app.render();
      console.log(`[${this.name}] Проект успешно импортирован`);
      return true;
      
    } catch (e) {
      console.error(`[${this.name}] Ошибка импорта:`, e);
      alert('Ошибка при импорте проекта: ' + e.message);
      return false;
    }
  },
  
  // Загрузка проекта из файла
  loadProjectFromFile: function(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      this.importProject(e.target.result);
    };
    
    reader.onerror = () => {
      console.error(`[${this.name}] Ошибка чтения файла`);
      alert('Ошибка при чтении файла');
    };
    
    reader.readAsText(file);
  },
  
  // Экспорт проекта в изображение (PNG)
  exportAsImage: function() {
    if (!this.app || !this.app.canvas) {
      console.error(`[${this.name}] Canvas не найден`);
      return;
    }
    
    try {
      const canvas = this.app.canvas;
      const dataURL = canvas.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.download = 'roadmap-image.png';
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`[${this.name}] Изображение экспортировано`);
    } catch (e) {
      console.error(`[${this.name}] Ошибка экспорта изображения:`, e);
    }
  },
  
  // Сохранение проекта в localStorage
  saveToLocalStorage: function(key = 'roadmap-project') {
    try {
      const data = this.exportProject();
      localStorage.setItem(key, data);
      console.log(`[${this.name}] Проект сохранен в localStorage`);
      return true;
    } catch (e) {
      console.error(`[${this.name}] Ошибка сохранения:`, e);
      return false;
    }
  },
  
  // Загрузка проекта из localStorage
  loadFromLocalStorage: function(key = 'roadmap-project') {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        return this.importProject(data);
      }
      console.log(`[${this.name}] В localStorage нет сохраненных проектов`);
      return false;
    } catch (e) {
      console.error(`[${this.name}] Ошибка загрузки:`, e);
      return false;
    }
  },
  
  // Автоматическое сохранение каждые N минут
  autoSaveInterval: null,
  
  enableAutoSave: function(minutes = 5) {
    this.disableAutoSave();
    this.autoSaveInterval = setInterval(() => {
      this.saveToLocalStorage();
    }, minutes * 60 * 1000);
    console.log(`[${this.name}] Автосохранение включено (${minutes} мин)`);
  },
  
  disableAutoSave: function() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log(`[${this.name}] Автосохранение отключено`);
    }
  }
};

// Делаем модуль доступным глобально
if (typeof window !== 'undefined') {
  window.ExportImportModule = ExportImportModule;
}

// Export для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportImportModule;
}
