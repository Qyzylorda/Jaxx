/**
 * Модуль контекстного меню для объектов
 * Опциональный модуль - добавляет контекстное меню по правой кнопке мыши
 */

const ContextMenuModule = {
  name: 'ContextMenuModule',
  version: '1.0.0',
  
  // Элементы меню
  menuElement: null,
  currentObject: null,
  
  // Пункты меню по умолчанию
  defaultMenuItems: [
    { id: 'edit', label: '✏️ Редактировать', action: 'edit' },
    { id: 'duplicate', label: '📋 Дублировать', action: 'duplicate' },
    { id: 'bringToFront', label: '⬆️ На передний план', action: 'bringToFront' },
    { id: 'sendToBack', label: '⬇️ На задний план', action: 'sendToBack' },
    { separator: true },
    { id: 'delete', label: '🗑️ Удалить', action: 'delete', danger: true }
  ],
  
  // Инициализация модуля
  init: function(app) {
    if (!app || !app.canvas) {
      console.warn(`[${this.name}] Canvas не найден, модуль не активирован`);
      return false;
    }
    
    this.app = app;
    this.createContextMenu();
    this.setupEventListeners();
    console.log(`[${this.name}] инициализирован`);
    return true;
  },
  
  // Создание элемента контекстного меню
  createContextMenu: function() {
    const menu = document.createElement('div');
    menu.id = 'roadmap-context-menu';
    menu.className = 'context-menu';
    menu.style.display = 'none';
    
    document.body.appendChild(menu);
    this.menuElement = menu;
  },
  
  // Настройка обработчиков событий
  setupEventListeners: function() {
    const canvas = this.app.canvas;
    
    // Контекстное меню по правой кнопке мыши
    canvas.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
    
    // Скрытие меню при клике в любом месте
    document.addEventListener('click', (e) => this.hideMenu());
    document.addEventListener('scroll', (e) => this.hideMenu());
    
    // Обработка кликов по пунктам меню
    this.menuElement.addEventListener('click', (e) => this.handleMenuClick(e));
  },
  
  // Обработка правой кнопки мыши
  handleContextMenu: function(e) {
    e.preventDefault();
    
    const rect = this.app.canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / this.app.scale;
    const mouseY = (e.clientY - rect.top) / this.app.scale;
    
    // Проверяем, попал ли клик в объект
    const clickedObject = this.app.findObjectAt(mouseX, mouseY);
    
    if (clickedObject) {
      this.currentObject = clickedObject;
      this.showMenu(e.clientX, e.clientY);
      
      // Выделяем объект
      if (this.app.modules.UIModule && this.app.modules.UIModule.selectObject) {
        this.app.modules.UIModule.selectObject(clickedObject.id);
      } else {
        // Если UIModule отключен, просто выделяем объект
        this.app.objects.forEach(obj => obj.selected = false);
        clickedObject.selected = true;
        this.app.render();
      }
    } else {
      this.hideMenu();
    }
  },
  
  // Показ контекстного меню
  showMenu: function(x, y) {
    if (!this.menuElement) return;
    
    // Очищаем меню
    this.menuElement.innerHTML = '';
    
    // Добавляем пункты меню
    this.defaultMenuItems.forEach(item => {
      if (item.separator) {
        const separator = document.createElement('div');
        separator.className = 'context-menu-separator';
        this.menuElement.appendChild(separator);
      } else {
        const menuItem = document.createElement('div');
        menuItem.className = 'context-menu-item' + (item.danger ? ' danger' : '');
        menuItem.dataset.action = item.action;
        menuItem.dataset.objectId = this.currentObject ? this.currentObject.id : '';
        menuItem.textContent = item.label;
        this.menuElement.appendChild(menuItem);
      }
    });
    
    // Позиционируем меню
    this.menuElement.style.left = x + 'px';
    this.menuElement.style.top = y + 'px';
    this.menuElement.style.display = 'block';
    
    // Проверяем, не выходит ли меню за пределы экрана
    const rect = this.menuElement.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      this.menuElement.style.left = (x - rect.width) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
      this.menuElement.style.top = (y - rect.height) + 'px';
    }
  },
  
  // Скрытие контекстного меню
  hideMenu: function() {
    if (this.menuElement) {
      this.menuElement.style.display = 'none';
    }
    this.currentObject = null;
  },
  
  // Обработка клика по пункту меню
  handleMenuClick: function(e) {
    const menuItem = e.target.closest('.context-menu-item');
    if (!menuItem) return;
    
    const action = menuItem.dataset.action;
    const objectId = menuItem.dataset.objectId;
    
    if (!objectId) return;
    
    const obj = this.app.objects.find(o => o.id === objectId);
    if (!obj) return;
    
    switch (action) {
      case 'edit':
        this.editObject(obj);
        break;
      case 'duplicate':
        this.duplicateObject(obj);
        break;
      case 'bringToFront':
        this.bringToFront(obj);
        break;
      case 'sendToBack':
        this.sendToBack(obj);
        break;
      case 'delete':
        this.deleteObject(obj);
        break;
    }
    
    this.hideMenu();
  },
  
  // Действия с объектами
  editObject: function(obj) {
    // Если есть UIModule, показываем панель свойств
    if (this.app.modules.UIModule && this.app.modules.UIModule.selectObject) {
      this.app.modules.UIModule.selectObject(obj.id);
    }
  },
  
  duplicateObject: function(obj) {
    const newObj = {
      ...obj,
      id: 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      x: obj.x + 20,
      y: obj.y + 20,
      selected: false
    };
    this.app.addObject(newObj);
    
    // Выделяем новый объект
    if (this.app.modules.UIModule && this.app.modules.UIModule.selectObject) {
      this.app.modules.UIModule.selectObject(newObj.id);
    }
  },
  
  bringToFront: function(obj) {
    this.app.bringToFront(obj.id);
  },
  
  sendToBack: function(obj) {
    const index = this.app.objects.findIndex(o => o.id === obj.id);
    if (index !== -1) {
      const removed = this.app.objects.splice(index, 1)[0];
      this.app.objects.unshift(removed);
      this.app.render();
    }
  },
  
  deleteObject: function(obj) {
    if (confirm(`Удалить объект "${obj.content}"?`)) {
      const index = this.app.objects.findIndex(o => o.id === obj.id);
      if (index !== -1) {
        this.app.objects.splice(index, 1);
        
        // Если есть ConnectionModule, удаляем соединения
        if (this.app.modules.ConnectionModule && this.app.modules.ConnectionModule.removeConnectionsForObject) {
          this.app.modules.ConnectionModule.removeConnectionsForObject(obj.id);
        }
        
        this.app.render();
        
        // Скрываем панель свойств
        if (this.app.modules.UIModule && this.app.modules.UIModule.hideProperties) {
          this.app.modules.UIModule.hideProperties();
        }
      }
    }
  },
  
  // Отключение модуля
  destroy: function() {
    const canvas = this.app.canvas;
    if (canvas) {
      canvas.removeEventListener('contextmenu', this.handleContextMenu);
    }
    document.removeEventListener('click', this.hideMenu);
    document.removeEventListener('scroll', this.hideMenu);
    
    if (this.menuElement) {
      this.menuElement.remove();
    }
    
    console.log(`[${this.name}] отключен`);
  }
};

// Делаем модуль доступным глобально
if (typeof window !== 'undefined') {
  window.ContextMenuModule = ContextMenuModule;
}

// Export для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContextMenuModule;
}
