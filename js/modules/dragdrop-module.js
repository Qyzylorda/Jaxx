/**
 * Модуль перетаскивания объектов (Drag & Drop)
 * Опциональный модуль - можно отключить без нарушения работы приложения
 */

const DragDropModule = {
  name: 'DragDropModule',
  version: '1.0.0',
  
  // Состояние перетаскивания
  isDragging: false,
  draggedObject: null,
  offsetX: 0,
  offsetY: 0,
  
  // Инициализация модуля
  init: function(app) {
    if (!app || !app.canvas) {
      console.warn(`[${this.name}] Canvas не найден, модуль не активирован`);
      return false;
    }
    
    this.app = app;
    this.setupEventListeners();
    console.log(`[${this.name}] инициализирован`);
    return true;
  },
  
  // Настройка обработчиков событий
  setupEventListeners: function() {
    const canvas = this.app.canvas;
    
    // Mouse events
    canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
    
    // Touch events для мобильных устройств
    canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
  },
  
  // Обработка нажатия кнопки мыши
  handleMouseDown: function(e) {
    const rect = this.app.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Проверяем, попал ли клик в объект
    const clickedObject = this.app.findObjectAt(mouseX, mouseY);
    
    if (clickedObject) {
      this.isDragging = true;
      this.draggedObject = clickedObject;
      this.offsetX = mouseX - clickedObject.x;
      this.offsetY = mouseY - clickedObject.y;
      
      // Перемещаем объект наверх (последним в массиве)
      this.app.bringToFront(clickedObject.id);
      
      e.preventDefault();
    }
  },
  
  // Обработка перемещения мыши
  handleMouseMove: function(e) {
    if (!this.isDragging || !this.draggedObject) return;
    
    const rect = this.app.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Обновляем позицию объекта
    this.draggedObject.x = mouseX - this.offsetX;
    this.draggedObject.y = mouseY - this.offsetY;
    
    // Перерисовываем canvas
    this.app.render();
    
    e.preventDefault();
  },
  
  // Обработка отпускания кнопки мыши
  handleMouseUp: function(e) {
    this.isDragging = false;
    this.draggedObject = null;
  },
  
  // Touch события для мобильных устройств
  handleTouchStart: function(e) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.handleMouseDown(mouseEvent);
    }
  },
  
  handleTouchMove: function(e) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.handleMouseMove(mouseEvent);
    }
  },
  
  handleTouchEnd: function(e) {
    const mouseEvent = new MouseEvent('mouseup', {});
    this.handleMouseUp(mouseEvent);
  },
  
  // Отключение модуля
  destroy: function() {
    const canvas = this.app.canvas;
    if (canvas) {
      canvas.removeEventListener('mousedown', this.handleMouseDown);
      canvas.removeEventListener('mousemove', this.handleMouseMove);
      canvas.removeEventListener('mouseup', this.handleMouseUp);
      canvas.removeEventListener('mouseleave', this.handleMouseUp);
    }
    console.log(`[${this.name}] отключен`);
  }
};

// Делаем модуль доступным глобально
if (typeof window !== 'undefined') {
  window.DragDropModule = DragDropModule;
}

// Export для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DragDropModule;
}
