/**
 * Roadmap Planner - Модульное приложение для создания планов и дорожных карт
 * 
 * Архитектура:
 * - Основное ядро приложения (RoadmapApp)
 * - Базовый модуль ObjectModule (обязательный)
 * - Опциональные модули: DragDropModule, ConnectionModule, ExportImportModule, UIModule
 * 
 * Модульность:
 * - Каждый модуль независим и может быть подключен/отключен
 * - При отключении опционального модуля приложение продолжает работать
 * - Модули регистрируются в системе и вызываются через единый интерфейс
 */

// ============================================
// ЯДРО ПРИЛОЖЕНИЯ
// ============================================

class RoadmapApp {
  constructor(canvasId = 'roadmap-canvas') {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    
    // Состояние приложения
    this.objects = [];
    this.scale = 1;
    this.projectName = 'Новый проект';
    this.projectDescription = '';
    this.author = '';
    
    // Позиция мыши
    this.mouseX = 0;
    this.mouseY = 0;
    
    // Зарегистрированные модули
    this.modules = {};
    
    // Инициализация canvas
    if (this.canvas) {
      this.resizeCanvas();
      this.setupCanvasListeners();
    }
    
    console.log('[RoadmapApp] Ядро приложения инициализировано');
  }
  
  // Изменение размера canvas
  resizeCanvas() {
    if (!this.canvas) return;
    
    const container = this.canvas.parentElement;
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    this.render();
  }
  
  // Настройка обработчиков canvas
  setupCanvasListeners() {
    window.addEventListener('resize', () => this.resizeCanvas());
    
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) / this.scale;
      this.mouseY = (e.clientY - rect.top) / this.scale;
    });
    
    // Колесо мыши для зума
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      this.scale = Math.max(0.1, Math.min(3, this.scale + delta));
      if (document.getElementById('zoom-level')) {
        document.getElementById('zoom-level').textContent = Math.round(this.scale * 100) + '%';
      }
      this.render();
    });
  }
  
  // Регистрация модуля
  registerModule(name, module) {
    if (!module || !module.init) {
      console.warn(`[RoadmapApp] Модуль "${name}" некорректен`);
      return false;
    }
    
    try {
      const result = module.init(this);
      if (result !== false) {
        this.modules[name] = module;
        console.log(`[RoadmapApp] Модуль "${name}" зарегистрирован`);
        return true;
      } else {
        console.warn(`[RoadmapApp] Модуль "${name}" не активирован`);
        return false;
      }
    } catch (e) {
      console.error(`[RoadmapApp] Ошибка регистрации модуля "${name}":`, e);
      return false;
    }
  }
  
  // Отключение модуля
  unregisterModule(name) {
    if (this.modules[name]) {
      if (this.modules[name].destroy) {
        this.modules[name].destroy();
      }
      delete this.modules[name];
      console.log(`[RoadmapApp] Модуль "${name}" отключен`);
      return true;
    }
    return false;
  }
  
  // Добавление объекта
  addObject(obj) {
    if (!obj || !obj.id) {
      console.error('[RoadmapApp] Некорректный объект');
      return false;
    }
    this.objects.push(obj);
    this.render();
    return true;
  }
  
  // Поиск объекта по координатам
  findObjectAt(x, y) {
    // Ищем с конца массива (верхние объекты приоритетнее)
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];
      if (x >= obj.x && x <= obj.x + obj.width &&
          y >= obj.y && y <= obj.y + obj.height) {
        return obj;
      }
    }
    return null;
  }
  
  // Перемещение объекта на передний план
  bringToFront(objId) {
    const index = this.objects.findIndex(o => o.id === objId);
    if (index !== -1) {
      const obj = this.objects.splice(index, 1)[0];
      this.objects.push(obj);
      this.render();
    }
  }
  
  // Отрисовка всего приложения
  render() {
    if (!this.ctx) return;
    
    // Очистка canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Сохраняем состояние контекста
    this.ctx.save();
    
    // Применяем масштабирование
    this.ctx.scale(this.scale, this.scale);
    
    // Рисуем сетку
    this.drawGrid();
    
    // Рисуем соединения (если модуль подключен)
    if (this.modules.ConnectionModule && this.modules.ConnectionModule.render) {
      this.modules.ConnectionModule.render(this.ctx);
    }
    
    // Рисуем объекты
    this.objects.forEach(obj => this.drawObject(obj));
    
    // Восстанавливаем состояние контекста
    this.ctx.restore();
  }
  
  // Рисование сетки
  drawGrid() {
    const gridSize = 50;
    const width = this.canvas.width / this.scale;
    const height = this.canvas.height / this.scale;
    
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#E0E0E0';
    this.ctx.lineWidth = 1;
    
    // Вертикальные линии
    for (let x = 0; x < width; x += gridSize) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
    }
    
    // Горизонтальные линии
    for (let y = 0; y < height; y += gridSize) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
    }
    
    this.ctx.stroke();
  }
  
  // Рисование объекта
  drawObject(obj) {
    const ctx = this.ctx;
    
    // Тень
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Фон объекта
    ctx.fillStyle = obj.color || '#FFFFFF';
    ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
    
    // Сброс тени
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Рамка
    ctx.strokeStyle = obj.selected ? '#007BFF' : '#333333';
    ctx.lineWidth = obj.selected ? 3 : 1;
    ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
    
    // Тип объекта (иконка)
    const icon = this.getObjectIcon(obj.type);
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#333333';
    ctx.fillText(icon, obj.x + 10, obj.y + 22);
    
    // Заголовок типа
    ctx.font = 'bold 11px Arial';
    ctx.fillStyle = '#666666';
    ctx.fillText(obj.type, obj.x + 32, obj.y + 22);
    
    // Содержимое
    ctx.font = '13px Arial';
    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'top';
    
    const text = this.wrapText(obj.content || '', obj.width - 20);
    ctx.fillText(text, obj.x + 10, obj.y + 35);
    
    // Индикатор выделения
    if (obj.selected) {
      ctx.strokeStyle = '#007BFF';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(obj.x - 3, obj.y - 3, obj.width + 6, obj.height + 6);
      ctx.setLineDash([]);
    }
  }
  
  // Иконка для типа объекта
  getObjectIcon(type) {
    const icons = {
      'Заголовок': '📌',
      'Тема': '📋',
      'Задача': '✅',
      'Веха': '🚩',
      'Заметка': '📝'
    };
    return icons[type] || '📄';
  }
  
  // Перенос текста
  wrapText(text, maxWidth) {
    const words = text.split(' ');
    let lines = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine + word + ' ';
      const metrics = this.ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    });
    
    lines.push(currentLine);
    return lines.join('\n');
  }
}

// ============================================
// СИСТЕМА МОДУЛЕЙ
// ============================================

const ModuleSystem = {
  // Список доступных модулей
  availableModules: {
    'ObjectModule': typeof ObjectModule !== 'undefined' ? ObjectModule : null,
    'DragDropModule': typeof DragDropModule !== 'undefined' ? DragDropModule : null,
    'ConnectionModule': typeof ConnectionModule !== 'undefined' ? ConnectionModule : null,
    'ExportImportModule': typeof ExportImportModule !== 'undefined' ? ExportImportModule : null,
    'UIModule': typeof UIModule !== 'undefined' ? UIModule : null,
    'ModuleManagerModule': typeof ModuleManagerModule !== 'undefined' ? ModuleManagerModule : null,
    'ContextMenuModule': typeof ContextMenuModule !== 'undefined' ? ContextMenuModule : null
  },
  
  // Конфигурация подключения модулей
  // true = подключить, false = не подключать
  moduleConfig: {
    'ObjectModule': true,          // Обязательный модуль
    'DragDropModule': true,        // Перетаскивание
    'ConnectionModule': true,      // Соединения
    'ExportImportModule': true,    // Экспорт/Импорт
    'UIModule': true,              // Пользовательский интерфейс
    'ModuleManagerModule': true,   // Управление модулями
    'ContextMenuModule': true      // Контекстное меню
  },
  
  // Удаленные модули (помечаются при удалении)
  removedModules: [],
  
  // Инициализация системы модулей
  init: function(app) {
    console.log('[ModuleSystem] Инициализация системы модулей...');
    
    let initializedCount = 0;
    
    // Проходим по всем модулям согласно конфигурации
    for (const [name, enabled] of Object.entries(this.moduleConfig)) {
      if (enabled && this.availableModules[name]) {
        app.registerModule(name, this.availableModules[name]);
        initializedCount++;
      } else if (enabled && !this.availableModules[name]) {
        console.warn(`[ModuleSystem] Модуль "${name}" включен в конфиге, но не найден`);
      }
    }
    
    console.log(`[ModuleSystem] Инициализировано модулей: ${initializedCount}`);
    return initializedCount;
  },
  
  // Включить модуль
  enableModule: function(name) {
    if (this.removedModules && this.removedModules.includes(name)) {
      console.warn(`[ModuleSystem] Модуль "${name}" был удален и не может быть включен без перезагрузки страницы`);
      return false;
    }
    this.moduleConfig[name] = true;
    console.log(`[ModuleSystem] Модуль "${name}" помечен для включения`);
    return true;
  },
  
  // Выключить модуль
  disableModule: function(name) {
    if (name === 'ObjectModule') {
      console.warn('[ModuleSystem] Нельзя отключить ObjectModule - это базовый модуль');
      return false;
    }
    this.moduleConfig[name] = false;
    console.log(`[ModuleSystem] Модуль "${name}" помечен для отключения`);
    return true;
  },
  
  // Проверка, удален ли модуль
  isModuleRemoved: function(name) {
    return this.removedModules && this.removedModules.includes(name);
  }
};

// ============================================
// ТОЧКА ВХОДА
// ============================================

// Глобальная переменная для приложения
let app = null;

// Инициализация при загрузке страницы
function initRoadmapApp() {
  console.log('=== Roadmap Planner ===');
  console.log('Инициализация приложения...');
  
  // Создаем экземпляр приложения
  app = new RoadmapApp('roadmap-canvas');
  
  // Инициализируем систему модулей
  ModuleSystem.init(app);
  
  // Добавляем демо-объекты для примера
  addDemoObjects();
  
  console.log('Приложение готово к работе!');
  console.log('Доступные модули:', Object.keys(app.modules));
  
  return app;
}

// Добавление демо-объектов
function addDemoObjects() {
  if (!app || !window.ObjectModule) return;
  
  // Создаем несколько объектов для демонстрации
  const titleObj = window.ObjectModule.createObject('Заголовок', 'Мой Проект', 100, 80);
  titleObj.width = 250;
  titleObj.height = 80;
  app.addObject(titleObj);
  
  const topicObj = window.ObjectModule.createObject('Тема', 'Планирование этапов', 100, 200);
  app.addObject(topicObj);
  
  const taskObj1 = window.ObjectModule.createObject('Задача', 'Анализ требований', 400, 180);
  app.addObject(taskObj1);
  
  const taskObj2 = window.ObjectModule.createObject('Задача', 'Разработка прототипа', 400, 300);
  app.addObject(taskObj2);
  
  const milestoneObj = window.ObjectModule.createObject('Веха', 'Запуск версии 1.0', 700, 250);
  app.addObject(milestoneObj);
  
  // Если модуль соединений подключен, создаем соединения
  if (app.modules.ConnectionModule) {
    window.ConnectionModule.createConnection(topicObj.id, taskObj1.id);
    window.ConnectionModule.createConnection(taskObj1.id, taskObj2.id);
    window.ConnectionModule.createConnection(taskObj2.id, milestoneObj.id);
  }
  
  app.render();
}

// Запускаем приложение после загрузки DOM
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initRoadmapApp);
}

// Делаем приложение доступным глобально
if (typeof window !== 'undefined') {
  window.RoadmapApp = RoadmapApp;
  window.ModuleSystem = ModuleSystem;
  window.app = app;
}
