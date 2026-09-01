/**
 * Модуль соединений между объектами (Connections)
 * Опциональный модуль - можно отключить без нарушения работы приложения
 */

const ConnectionModule = {
  name: 'ConnectionModule',
  version: '1.0.0',
  
  // Хранилище соединений
  connections: [],
  
  // Состояние создания соединения
  isCreatingConnection: false,
  connectionStartObject: null,
  
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
    
    // Двойной клик для начала создания соединения
    canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
    canvas.addEventListener('click', (e) => this.handleClick(e));
  },
  
  // Создание соединения между двумя объектами
  createConnection: function(fromId, toId) {
    const connection = {
      id: 'conn_' + Date.now(),
      from: fromId,
      to: toId,
      color: '#666666',
      width: 2,
      createdAt: new Date().toISOString()
    };
    
    this.connections.push(connection);
    this.app.render();
    return connection;
  },
  
  // Удаление соединения
  removeConnection: function(connectionId) {
    this.connections = this.connections.filter(c => c.id !== connectionId);
    this.app.render();
  },
  
  // Обработка двойного клика (начало создания соединения)
  handleDoubleClick: function(e) {
    const rect = this.app.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const clickedObject = this.app.findObjectAt(mouseX, mouseY);
    
    if (clickedObject) {
      this.isCreatingConnection = true;
      this.connectionStartObject = clickedObject;
    }
  },
  
  // Обработка одиночного клика (завершение создания соединения)
  handleClick: function(e) {
    if (!this.isCreatingConnection || !this.connectionStartObject) return;
    
    const rect = this.app.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const clickedObject = this.app.findObjectAt(mouseX, mouseY);
    
    if (clickedObject && clickedObject.id !== this.connectionStartObject.id) {
      // Проверяем, нет ли уже такого соединения
      const exists = this.connections.some(c => 
        c.from === this.connectionStartObject.id && c.to === clickedObject.id
      );
      
      if (!exists) {
        this.createConnection(this.connectionStartObject.id, clickedObject.id);
      }
    }
    
    this.isCreatingConnection = false;
    this.connectionStartObject = null;
  },
  
  // Отрисовка всех соединений
  render: function(ctx) {
    const objects = this.app.objects;
    
    this.connections.forEach(conn => {
      const fromObj = objects.find(o => o.id === conn.from);
      const toObj = objects.find(o => o.id === conn.to);
      
      if (fromObj && toObj) {
        // Вычисляем центры объектов
        const fromX = fromObj.x + fromObj.width / 2;
        const fromY = fromObj.y + fromObj.height / 2;
        const toX = toObj.x + toObj.width / 2;
        const toY = toObj.y + toObj.height / 2;
        
        // Рисуем линию
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.strokeStyle = conn.color;
        ctx.lineWidth = conn.width;
        ctx.stroke();
        
        // Рисуем стрелку
        this.drawArrowhead(ctx, toX, toY, fromX, fromY, conn.color);
      }
    });
    
    // Если создаем соединение, рисуем линию от начального объекта до курсора
    if (this.isCreatingConnection && this.connectionStartObject) {
      // Получаем текущую позицию мыши из состояния приложения
      if (this.app.mouseX && this.app.mouseY) {
        const fromX = this.connectionStartObject.x + this.connectionStartObject.width / 2;
        const fromY = this.connectionStartObject.y + this.connectionStartObject.height / 2;
        
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(this.app.mouseX, this.app.mouseY);
        ctx.strokeStyle = '#999999';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  },
  
  // Рисование стрелки
  drawArrowhead: function(ctx, x, y, fromX, fromY, color) {
    const angle = Math.atan2(y - fromY, x - fromX);
    const arrowLength = 10;
    const arrowAngle = Math.PI / 6;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(
      x - arrowLength * Math.cos(angle - arrowAngle),
      y - arrowLength * Math.sin(angle - arrowAngle)
    );
    ctx.lineTo(
      x - arrowLength * Math.cos(angle + arrowAngle),
      y - arrowLength * Math.sin(angle + arrowAngle)
    );
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  },
  
  // Экспорт соединений
  exportConnections: function() {
    return JSON.stringify(this.connections, null, 2);
  },
  
  // Импорт соединений
  importConnections: function(data) {
    try {
      this.connections = JSON.parse(data);
      this.app.render();
      return true;
    } catch (e) {
      console.error(`[${this.name}] Ошибка импорта:`, e);
      return false;
    }
  },
  
  // Очистка всех соединений
  clearAll: function() {
    this.connections = [];
    this.app.render();
  },
  
  // Отключение модуля
  destroy: function() {
    const canvas = this.app.canvas;
    if (canvas) {
      canvas.removeEventListener('dblclick', this.handleDoubleClick);
      canvas.removeEventListener('click', this.handleClick);
    }
    console.log(`[${this.name}] отключен`);
  }
};

// Делаем модуль доступным глобально
if (typeof window !== 'undefined') {
  window.ConnectionModule = ConnectionModule;
}

// Export для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConnectionModule;
}
