/**
 * Модуль пользовательского интерфейса (UI)
 * Опциональный модуль - можно отключить без нарушения работы приложения,
 * но тогда управление будет только через API
 */

const UIModule = {
  name: 'UIModule',
  version: '1.0.0',
  
  // Элементы интерфейса
  elements: {},
  
  // Инициализация модуля
  init: function(app) {
    this.app = app;
    this.createToolbar();
    this.createObjectPanel();
    this.createPropertiesPanel();
    this.setupEventListeners();
    console.log(`[${this.name}] инициализирован`);
    return true;
  },
  
  // Создание панели инструментов
  createToolbar: function() {
    const toolbar = document.createElement('div');
    toolbar.id = 'roadmap-toolbar';
    toolbar.className = 'toolbar';
    toolbar.innerHTML = `
      <div class="toolbar-section">
        <button id="btn-new" title="Новый проект">📄 Новый</button>
        <button id="btn-save" title="Сохранить проект">💾 Сохранить</button>
        <button id="btn-load" title="Загрузить проект">📂 Загрузить</button>
        <input type="file" id="file-input" accept=".json" style="display:none">
      </div>
      <div class="toolbar-section">
        <button id="btn-export-img" title="Экспорт в изображение">🖼️ Изображение</button>
        <button id="btn-clear" title="Очистить всё">🗑️ Очистить</button>
      </div>
      <div class="toolbar-section">
        <button id="btn-zoom-in" title="Приблизить">🔍+</button>
        <button id="btn-zoom-out" title="Отдалить">🔍-</button>
        <span id="zoom-level">100%</span>
      </div>
    `;
    
    document.body.appendChild(toolbar);
    this.elements.toolbar = toolbar;
  },
  
  // Создание панели добавления объектов
  createObjectPanel: function() {
    const panel = document.createElement('div');
    panel.id = 'roadmap-object-panel';
    panel.className = 'object-panel';
    panel.innerHTML = `
      <h3>Объекты</h3>
      <button data-type="Заголовок" class="object-btn">📌 Заголовок</button>
      <button data-type="Тема" class="object-btn">📋 Тема</button>
      <button data-type="Задача" class="object-btn">✅ Задача</button>
      <button data-type="Веха" class="object-btn">🚩 Веха</button>
      <button data-type="Заметка" class="object-btn">📝 Заметка</button>
    `;
    
    document.body.appendChild(panel);
    this.elements.objectPanel = panel;
  },
  
  // Создание панели свойств
  createPropertiesPanel: function() {
    const panel = document.createElement('div');
    panel.id = 'roadmap-properties-panel';
    panel.className = 'properties-panel';
    panel.innerHTML = `
      <h3>Свойства</h3>
      <div id="no-selection">Выберите объект</div>
      <div id="properties-form" style="display:none">
        <label>Тип:</label>
        <select id="prop-type">
          <option value="Заголовок">Заголовок</option>
          <option value="Тема">Тема</option>
          <option value="Задача">Задача</option>
          <option value="Веха">Веха</option>
          <option value="Заметка">Заметка</option>
        </select>
        
        <label>Текст:</label>
        <textarea id="prop-content" rows="3"></textarea>
        
        <label>Цвет:</label>
        <input type="color" id="prop-color">
        
        <label>Ширина:</label>
        <input type="number" id="prop-width" min="50" max="500">
        
        <label>Высота:</label>
        <input type="number" id="prop-height" min="30" max="300">
        
        <button id="btn-delete" class="delete-btn">🗑️ Удалить</button>
      </div>
    `;
    
    document.body.appendChild(panel);
    this.elements.propertiesPanel = panel;
  },
  
  // Настройка обработчиков событий
  setupEventListeners: function() {
    // Кнопки toolbar
    document.getElementById('btn-new').addEventListener('click', () => this.handleNewProject());
    document.getElementById('btn-save').addEventListener('click', () => this.handleSave());
    document.getElementById('btn-load').addEventListener('click', () => document.getElementById('file-input').click());
    document.getElementById('file-input').addEventListener('change', (e) => this.handleLoad(e));
    document.getElementById('btn-export-img').addEventListener('click', () => this.handleExportImage());
    document.getElementById('btn-clear').addEventListener('click', () => this.handleClear());
    document.getElementById('btn-zoom-in').addEventListener('click', () => this.handleZoom(0.1));
    document.getElementById('btn-zoom-out').addEventListener('click', () => this.handleZoom(-0.1));
    
    // Кнопки добавления объектов
    document.querySelectorAll('.object-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.target.dataset.type;
        this.addObject(type);
      });
    });
    
    // Поля свойств
    document.getElementById('prop-type').addEventListener('change', (e) => this.updateProperty('type', e.target.value));
    document.getElementById('prop-content').addEventListener('input', (e) => this.updateProperty('content', e.target.value));
    document.getElementById('prop-color').addEventListener('input', (e) => this.updateProperty('color', e.target.value));
    document.getElementById('prop-width').addEventListener('input', (e) => this.updateProperty('width', parseInt(e.target.value)));
    document.getElementById('prop-height').addEventListener('input', (e) => this.updateProperty('height', parseInt(e.target.value)));
    document.getElementById('btn-delete').addEventListener('click', () => this.deleteSelectedObject());
    
    // Клик по canvas для снятия выделения
    this.app.canvas.addEventListener('click', (e) => {
      if (e.target === this.app.canvas) {
        this.deselectAll();
      }
    });
  },
  
  // Добавление объекта
  addObject: function(type) {
    const obj = window.ObjectModule.createObject(type, 'Новый объект', 150, 150);
    this.app.addObject(obj);
    this.selectObject(obj.id);
  },
  
  // Выделение объекта
  selectObject: function(id) {
    this.deselectAll();
    const obj = this.app.objects.find(o => o.id === id);
    if (obj) {
      obj.selected = true;
      this.showProperties(obj);
      this.app.render();
    }
  },
  
  // Снятие выделения со всех объектов
  deselectAll: function() {
    this.app.objects.forEach(obj => obj.selected = false);
    this.hideProperties();
    this.app.render();
  },
  
  // Показ панели свойств
  showProperties: function(obj) {
    document.getElementById('no-selection').style.display = 'none';
    document.getElementById('properties-form').style.display = 'block';
    
    document.getElementById('prop-type').value = obj.type;
    document.getElementById('prop-content').value = obj.content;
    document.getElementById('prop-color').value = this.rgbToHex(obj.color);
    document.getElementById('prop-width').value = obj.width;
    document.getElementById('prop-height').value = obj.height;
  },
  
  // Скрытие панели свойств
  hideProperties: function() {
    document.getElementById('no-selection').style.display = 'block';
    document.getElementById('properties-form').style.display = 'none';
  },
  
  // Обновление свойства объекта
  updateProperty: function(prop, value) {
    const selectedObj = this.app.objects.find(o => o.selected);
    if (selectedObj) {
      selectedObj[prop] = value;
      
      // Если изменили тип, обновляем цвет по умолчанию
      if (prop === 'type') {
        selectedObj.color = window.ObjectModule.getDefaultColor(value);
        document.getElementById('prop-color').value = selectedObj.color;
      }
      
      this.app.render();
    }
  },
  
  // Удаление выделенного объекта
  deleteSelectedObject: function() {
    const index = this.app.objects.findIndex(o => o.selected);
    if (index !== -1) {
      this.app.objects.splice(index, 1);
      this.hideProperties();
      this.app.render();
    }
  },
  
  // Обработчики кнопок toolbar
  handleNewProject: function() {
    if (confirm('Создать новый проект? Все несохраненные изменения будут потеряны.')) {
      this.app.objects = [];
      if (window.ConnectionModule && window.ConnectionModule.clearAll) {
        window.ConnectionModule.clearAll();
      }
      this.app.render();
      this.hideProperties();
    }
  },
  
  handleSave: function() {
    if (window.ExportImportModule && window.ExportImportModule.saveToLocalStorage) {
      window.ExportImportModule.saveToLocalStorage();
      alert('Проект сохранен!');
    }
  },
  
  handleLoad: function(e) {
    const file = e.target.files[0];
    if (file && window.ExportImportModule && window.ExportImportModule.loadProjectFromFile) {
      window.ExportImportModule.loadProjectFromFile(file);
    }
    e.target.value = '';
  },
  
  handleExportImage: function() {
    if (window.ExportImportModule && window.ExportImportModule.exportAsImage) {
      window.ExportImportModule.exportAsImage();
    }
  },
  
  handleClear: function() {
    if (confirm('Удалить все объекты?')) {
      this.app.objects = [];
      if (window.ConnectionModule && window.ConnectionModule.clearAll) {
        window.ConnectionModule.clearAll();
      }
      this.app.render();
      this.hideProperties();
    }
  },
  
  handleZoom: function(delta) {
    this.app.scale = Math.max(0.1, Math.min(3, this.app.scale + delta));
    document.getElementById('zoom-level').textContent = Math.round(this.app.scale * 100) + '%';
    this.app.render();
  },
  
  // Конвертация цвета из RGB в HEX
  rgbToHex: function(rgb) {
    if (rgb.startsWith('#')) return rgb;
    
    const match = rgb.match(/\d+/g);
    if (!match) return '#FFFFFF';
    
    const r = parseInt(match[0]);
    const g = parseInt(match[1]);
    const b = parseInt(match[2]);
    
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  }
};

// Делаем модуль доступным глобально
if (typeof window !== 'undefined') {
  window.UIModule = UIModule;
}

// Export для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIModule;
}
