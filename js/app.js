/**
 * Roadmap Planner - Modular application for creating plans and roadmaps
 * 
 * Architecture:
 * - Core application (RoadmapApp)
 * - Base module ObjectModule (required)
 * - Optional modules: DragDropModule, ConnectionModule, ExportImportModule, UIModule
 * 
 * Modularity:
 * - Each module is independent and can be enabled/disabled
 * - Application continues to work when optional modules are disabled
 * - Modules are registered through a unified interface
 * 
 * @version 2.0.0
 * @author Roadmap Planner Team
 */

// ============================================
// CONSTANTS
// ============================================

const CONFIG = {
  CANVAS_ID: 'roadmap-canvas',
  MIN_SCALE: 0.1,
  MAX_SCALE: 3,
  GRID_SIZE: 50,
  DEFAULT_PROJECT_NAME: 'New Project'
};

const OBJECT_ICONS = {
  'Заголовок': '📌',
  'Тема': '📋',
  'Задача': '✅',
  'Веха': '🚩',
  'Заметка': '📝'
};

const DEFAULT_ICON = '📄';

// ============================================
// CORE APPLICATION
// ============================================

class RoadmapApp {
  constructor(canvasId = CONFIG.CANVAS_ID) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    
    // Application state
    this.objects = [];
    this.scale = 1;
    this.projectName = CONFIG.DEFAULT_PROJECT_NAME;
    this.projectDescription = '';
    this.author = '';
    
    // Mouse position
    this.mouseX = 0;
    this.mouseY = 0;
    
    // Registered modules
    this.modules = {};
    
    // Initialize canvas
    if (this.canvas) {
      this.resizeCanvas();
      this.setupCanvasListeners();
    }
    
    console.log('[RoadmapApp] Core application initialized');
  }
  
  /**
   * Resize canvas to fit container
   */
  resizeCanvas() {
    if (!this.canvas) return;
    
    const container = this.canvas.parentElement;
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    this.render();
  }
  
  /**
   * Setup canvas event listeners
   */
  setupCanvasListeners() {
    window.addEventListener('resize', () => this.resizeCanvas());
    
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) / this.scale;
      this.mouseY = (e.clientY - rect.top) / this.scale;
    });
    
    // Zoom with mouse wheel
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      this.scale = Math.max(CONFIG.MIN_SCALE, Math.min(CONFIG.MAX_SCALE, this.scale + delta));
      this.updateZoomDisplay();
      this.render();
    });
  }
  
  /**
   * Update zoom level display in UI
   */
  updateZoomDisplay() {
    const zoomElement = document.getElementById('zoom-level');
    if (zoomElement) {
      zoomElement.textContent = Math.round(this.scale * 100) + '%';
    }
  }
  
  /**
   * Register a module with the application
   * @param {string} name - Module name
   * @param {Object} module - Module object with init method
   * @returns {boolean} True if registration successful
   */
  registerModule(name, module) {
    if (!module || !module.init) {
      console.warn(`[RoadmapApp] Module "${name}" is invalid`);
      return false;
    }
    
    try {
      const result = module.init(this);
      if (result !== false) {
        this.modules[name] = module;
        console.log(`[RoadmapApp] Module "${name}" registered`);
        return true;
      } else {
        console.warn(`[RoadmapApp] Module "${name}" not activated`);
        return false;
      }
    } catch (e) {
      console.error(`[RoadmapApp] Error registering module "${name}":`, e);
      return false;
    }
  }
  
  /**
   * Unregister/remove a module from the application
   * @param {string} name - Module name
   * @returns {boolean} True if unregistration successful
   */
  unregisterModule(name) {
    if (this.modules[name]) {
      if (this.modules[name].destroy) {
        this.modules[name].destroy();
      }
      delete this.modules[name];
      console.log(`[RoadmapApp] Module "${name}" unregistered`);
      return true;
    }
    return false;
  }
  
  /**
   * Add an object to the canvas
   * @param {Object} obj - Object to add
   * @returns {boolean} True if addition successful
   */
  addObject(obj) {
    if (!obj || !obj.id) {
      console.error('[RoadmapApp] Invalid object');
      return false;
    }
    this.objects.push(obj);
    this.render();
    return true;
  }
  
  /**
   * Find object at specified coordinates
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Object|null} Found object or null
   */
  findObjectAt(x, y) {
    // Search from end of array (top objects have priority)
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];
      if (x >= obj.x && x <= obj.x + obj.width &&
          y >= obj.y && y <= obj.y + obj.height) {
        return obj;
      }
    }
    return null;
  }
  
  /**
   * Bring object to front (top of z-order)
   * @param {string} objId - Object ID
   */
  bringToFront(objId) {
    const index = this.objects.findIndex(o => o.id === objId);
    if (index !== -1) {
      const obj = this.objects.splice(index, 1)[0];
      this.objects.push(obj);
      this.render();
    }
  }
  
  /**
   * Send object to back (bottom of z-order)
   * @param {string} objId - Object ID
   */
  sendToBack(objId) {
    const index = this.objects.findIndex(o => o.id === objId);
    if (index !== -1) {
      const obj = this.objects.splice(index, 1)[0];
      this.objects.unshift(obj);
      this.render();
    }
  }
  
  /**
   * Render the entire application
   */
  render() {
    if (!this.ctx) return;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Save context state
    this.ctx.save();
    
    // Apply scaling
    this.ctx.scale(this.scale, this.scale);
    
    // Draw grid
    this.drawGrid();
    
    // Draw connections (if ConnectionModule is loaded)
    if (this.modules.ConnectionModule && this.modules.ConnectionModule.render) {
      this.modules.ConnectionModule.render(this.ctx);
    }
    
    // Draw objects
    this.objects.forEach(obj => this.drawObject(obj));
    
    // Restore context state
    this.ctx.restore();
  }
  
  /**
   * Draw grid background
   */
  drawGrid() {
    const gridSize = CONFIG.GRID_SIZE;
    const width = this.canvas.width / this.scale;
    const height = this.canvas.height / this.scale;
    
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#E0E0E0';
    this.ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x < width; x += gridSize) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
    }
    
    // Horizontal lines
    for (let y = 0; y < height; y += gridSize) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
    }
    
    this.ctx.stroke();
  }
  
  /**
   * Draw an object on the canvas
   * @param {Object} obj - Object to draw
   */
  drawObject(obj) {
    const ctx = this.ctx;
    
    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Background
    ctx.fillStyle = obj.color || '#FFFFFF';
    ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Border
    ctx.strokeStyle = obj.selected ? '#007BFF' : '#333333';
    ctx.lineWidth = obj.selected ? 3 : 1;
    ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
    
    // Icon based on type
    const icon = this.getObjectIcon(obj.type);
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#333333';
    ctx.fillText(icon, obj.x + 10, obj.y + 22);
    
    // Type label
    ctx.font = 'bold 11px Arial';
    ctx.fillStyle = '#666666';
    ctx.fillText(obj.type, obj.x + 32, obj.y + 22);
    
    // Content text
    ctx.font = '13px Arial';
    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'top';
    
    const text = this.wrapText(obj.content || '', obj.width - 20);
    ctx.fillText(text, obj.x + 10, obj.y + 35);
    
    // Selection indicator
    if (obj.selected) {
      ctx.strokeStyle = '#007BFF';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(obj.x - 3, obj.y - 3, obj.width + 6, obj.height + 6);
      ctx.setLineDash([]);
    }
  }
  
  /**
   * Get icon for object type
   * @param {string} type - Object type
   * @returns {string} Icon emoji
   */
  getObjectIcon(type) {
    return OBJECT_ICONS[type] || DEFAULT_ICON;
  }
  
  /**
   * Wrap text to fit within specified width
   * @param {string} text - Text to wrap
   * @param {number} maxWidth - Maximum width in pixels
   * @returns {string} Wrapped text with newlines
   */
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
// MODULE SYSTEM
// ============================================

const ModuleSystem = {
  // List of available modules
  availableModules: {
    'ObjectModule': typeof ObjectModule !== 'undefined' ? ObjectModule : null,
    'DragDropModule': typeof DragDropModule !== 'undefined' ? DragDropModule : null,
    'ConnectionModule': typeof ConnectionModule !== 'undefined' ? ConnectionModule : null,
    'ExportImportModule': typeof ExportImportModule !== 'undefined' ? ExportImportModule : null,
    'UIModule': typeof UIModule !== 'undefined' ? UIModule : null,
    'ModuleManagerModule': typeof ModuleManagerModule !== 'undefined' ? ModuleManagerModule : null,
    'ContextMenuModule': typeof ContextMenuModule !== 'undefined' ? ContextMenuModule : null
  },
  
  // Module configuration (true = enabled, false = disabled)
  moduleConfig: {
    'ObjectModule': true,          // Required module
    'DragDropModule': true,        // Drag and drop
    'ConnectionModule': true,      // Connections
    'ExportImportModule': true,    // Export/Import
    'UIModule': true,              // User interface
    'ModuleManagerModule': true,   // Module management
    'ContextMenuModule': true      // Context menu
  },
  
  // Removed modules list
  removedModules: [],
  
  /**
   * Initialize the module system
   * @param {RoadmapApp} app - Application instance
   * @returns {number} Number of initialized modules
   */
  init: function(app) {
    console.log('[ModuleSystem] Initializing module system...');
    
    let initializedCount = 0;
    
    // Initialize modules according to config
    for (const [name, enabled] of Object.entries(this.moduleConfig)) {
      if (enabled && this.availableModules[name]) {
        app.registerModule(name, this.availableModules[name]);
        initializedCount++;
      } else if (enabled && !this.availableModules[name]) {
        console.warn(`[ModuleSystem] Module "${name}" is enabled in config but not found`);
      }
    }
    
    console.log(`[ModuleSystem] Initialized ${initializedCount} modules`);
    return initializedCount;
  },
  
  /**
   * Enable a module
   * @param {string} name - Module name
   * @returns {boolean} True if successful
   */
  enableModule: function(name) {
    if (this.removedModules && this.removedModules.includes(name)) {
      console.warn(`[ModuleSystem] Module "${name}" was removed and cannot be enabled without page reload`);
      return false;
    }
    this.moduleConfig[name] = true;
    console.log(`[ModuleSystem] Module "${name}" marked for enabling`);
    return true;
  },
  
  /**
   * Disable a module
   * @param {string} name - Module name
   * @returns {boolean} True if successful
   */
  disableModule: function(name) {
    if (name === 'ObjectModule') {
      console.warn('[ModuleSystem] Cannot disable ObjectModule - it is a required module');
      return false;
    }
    this.moduleConfig[name] = false;
    console.log(`[ModuleSystem] Module "${name}" marked for disabling`);
    return true;
  },
  
  /**
   * Check if a module is removed
   * @param {string} name - Module name
   * @returns {boolean} True if module is removed
   */
  isModuleRemoved: function(name) {
    return this.removedModules && this.removedModules.includes(name);
  }
};

// ============================================
// ENTRY POINT
// ============================================

// Global application instance
let app = null;

/**
 * Initialize the Roadmap Planner application
 * @returns {RoadmapApp} Application instance
 */
function initRoadmapApp() {
  console.log('=== Roadmap Planner ===');
  console.log('Initializing application...');
  
  // Create application instance
  app = new RoadmapApp(CONFIG.CANVAS_ID);
  
  // Initialize module system
  ModuleSystem.init(app);
  
  // Add demo objects
  addDemoObjects();
  
  console.log('Application ready!');
  console.log('Available modules:', Object.keys(app.modules));
  
  return app;
}

/**
 * Add demo objects for demonstration
 */
function addDemoObjects() {
  if (!app || !window.ObjectModule) return;
  
  // Create demo objects
  const titleObj = window.ObjectModule.createObject('Заголовок', 'My Project', 100, 80);
  titleObj.width = 250;
  titleObj.height = 80;
  app.addObject(titleObj);
  
  const topicObj = window.ObjectModule.createObject('Тема', 'Planning Stages', 100, 200);
  app.addObject(topicObj);
  
  const taskObj1 = window.ObjectModule.createObject('Задача', 'Requirements Analysis', 400, 180);
  app.addObject(taskObj1);
  
  const taskObj2 = window.ObjectModule.createObject('Задача', 'Prototype Development', 400, 300);
  app.addObject(taskObj2);
  
  const milestoneObj = window.ObjectModule.createObject('Веха', 'Launch Version 1.0', 700, 250);
  app.addObject(milestoneObj);
  
  // Create connections if ConnectionModule is available
  if (app.modules.ConnectionModule) {
    window.ConnectionModule.createConnection(topicObj.id, taskObj1.id);
    window.ConnectionModule.createConnection(taskObj1.id, taskObj2.id);
    window.ConnectionModule.createConnection(taskObj2.id, milestoneObj.id);
  }
  
  app.render();
}

// Initialize application when DOM is loaded
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initRoadmapApp);
}

// Export to global scope
if (typeof window !== 'undefined') {
  window.RoadmapApp = RoadmapApp;
  window.ModuleSystem = ModuleSystem;
  window.app = app;
}
