/**
 * Модуль управления объектами на карте
 * Базовый модуль - всегда должен быть подключен
 */

const ObjectModule = {
  name: 'ObjectModule',
  version: '1.0.0',
  
  // Типы объектов
  objectTypes: {
    TITLE: 'Заголовок',
    TOPIC: 'Тема',
    TASK: 'Задача',
    MILESTONE: 'Веха',
    NOTE: 'Заметка'
  },
  
  // Инициализация модуля
  init: function(app) {
    console.log(`[${this.name}] инициализирован`);
    return true;
  },
  
  // Создание нового объекта
  createObject: function(type, content, x = 100, y = 100) {
    const id = 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    return {
      id: id,
      type: type || this.objectTypes.TASK,
      content: content || '',
      x: x,
      y: y,
      width: 200,
      height: 100,
      color: this.getDefaultColor(type),
      createdAt: new Date().toISOString()
    };
  },
  
  // Цвет по умолчанию для типа объекта
  getDefaultColor: function(type) {
    const colors = {
      'Заголовок': '#FFD700',
      'Тема': '#87CEEB',
      'Задача': '#90EE90',
      'Веха': '#FF6B6B',
      'Заметка': '#DDA0DD'
    };
    return colors[type] || '#FFFFFF';
  },
  
  // Обновление объекта
  updateObject: function(obj, updates) {
    return { ...obj, ...updates };
  },
  
  // Удаление объекта (возвращает null)
  deleteObject: function(obj) {
    return null;
  },
  
  // Экспорт данных объекта
  exportObject: function(obj) {
    return JSON.stringify(obj, null, 2);
  },
  
  // Импорт данных объекта
  importObject: function(data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(`[${this.name}] Ошибка импорта:`, e);
      return null;
    }
  }
};

// Делаем модуль доступным глобально
if (typeof window !== 'undefined') {
  window.ObjectModule = ObjectModule;
}

// Export для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ObjectModule;
}
