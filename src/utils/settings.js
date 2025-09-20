import { v4 as uuidv4 } from "uuid";
// 请求通知权限
async function requestNotificationPermission() {
  if (Notification && Notification.requestPermission) {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("通知权限已授予");
      return true;
    } else {
      console.warn("通知权限被拒绝");
      return false;
    }
  } else {
    console.warn("浏览器不支持通知权限请求");
    return false;
  }
}

/**
 * 请求持久性存储权限
 * @returns {Promise<boolean>} 是否成功启用持久性存储
 */
async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist) {
      return await navigator.storage.persist();
    }
    return false;
  } catch (error) {
    console.warn("请求持久性存储失败:", error);
    return false;
  }
}

/**
 * 初始化存储权限
 */
async function initializeStorage() {
  const notificationGranted = await requestNotificationPermission();
  if (
    notificationGranted &&
    SettingsManager.getSetting("storage.persistOnLoad")
  ) {
    const persisted = await requestPersistentStorage();
    console.log(`持久性存储状态: ${persisted ? "已启用" : "未启用"}`);
  }
}

// 在页面加载时初始化
if (typeof window !== "undefined") {
  window.addEventListener("load", initializeStorage);
}

/**
 * 配置项定义
 * @typedef {Object} SettingDefinition
 * @property {string} type - 配置项类型 ('boolean' | 'number' | 'string')
 * @property {any} default - 默认值
 * @property {Function} [validate] - 可选的验证函数
 * @property {string} [description] - 配置项描述
 * @property {string} [legacyKey] - 旧版本localStorage键名(用于迁移)
 * @property {boolean} [requireDeveloper] - 是否需要开发者选项启用
 * @property {string} [icon] - 设置项的图标
 */

// 存储所有设置的localStorage键名
const SETTINGS_STORAGE_KEY = "Classworks_settings";

/**
 * 生成UUID v4
 * @returns {string} 生成的UUID字符串
 */
function generateUUID() {
  return uuidv4();
}

// 新增: Classworks云端存储的默认设置
const classworksCloudDefaults = {
  "server.domain": "https://kv.wuyuan.dev",
  "server.siteKey": "",
};

/**
 * 所有配置项的定义
 * @type {Object.<string, SettingDefinition>}
 */
const settingsDefinitions = {
  // 设备标识
  "device.uuid": {
    type: "string",
    default: generateUUID(),
    description: "设备唯一标识符",
    icon: "mdi-identifier",
  },

  // 命名空间设置
  "namespace.password": {
    type: "string",
    default: "",
    description: "命名空间访问密码",
    icon: "mdi-key",
  },
  "namespace.accessType": {
    type: "string",
    default: "readwrite",
    description: "访问权限类型",
    icon: "mdi-shield-lock",
    validate: (value) => ["readonly", "readwrite"].includes(value),
  },

  // 存储设置
  "storage.persistOnLoad": {
    type: "boolean",
    default: true,
    description: "是否在页面加载时自动请求持久性存储",
    icon: "mdi-database-sync",
  },

  // 显示设置
  "display.emptySubjectDisplay": {
    type: "string",
    default: "card", // 修改默认值为 'button'
    validate: (value) => ["card", "button"].includes(value),
    description: "空科目的显示方式",
    icon: "mdi-card-outline",
  },
  "display.dynamicSort": {
    type: "boolean",
    default: true,
    description: "是否启用动态排序",
    icon: "mdi-sort-variant",
    // 启用后会根据内容自动调整卡片顺序，提供更好的视觉体验
  },
  "display.showRandomButton": {
    type: "boolean",
    default: false,
    description: "是否显示随机点人按钮",
    icon: "mdi-shuffle-variant",
    // 控制是否显示随机排序按钮，可用于随机调整卡片顺序
  },
  "display.showFullscreenButton": {
    type: "boolean",
    default: true,
    description: "是否显示全屏按钮",
    icon: "mdi-fullscreen",
    // 控制是否显示进入全屏模式的按钮
  },
  "display.cardHoverEffect": {
    type: "boolean",
    default: true,
    description: "是否启用卡片悬浮效果",
    icon: "mdi-gesture-tap",
    // 启用后鼠标悬停在卡片上时会显示视觉反馈效果
  },
  "display.enhancedTouchMode": {
    type: "boolean",
    default: true,
    description: "是否启用增强触摸模式",
    icon: "mdi-gesture-tap-button",
  },
  "display.showAntiScreenBurnCard": {
    type: "boolean",
    default: false,
    description: "是否显示防烧屏忽悠卡片",
    icon: "mdi-monitor-shimmer",
  },
  "display.showListCard": {
    type: "boolean",
    default: true,
    description: "是否显示列表卡片",
    icon: "mdi-list-box",
  },
  "display.showExamScheduleButton": {
    type: "boolean",
    default: true,
    description: "是否显示考试看板",
    icon: "mdi-calendar-check",
    // 控制是否在主页显示考试看板按钮，指向考试安排页面
  },
  // 服务器设置（合并了数据提供者设置）
  "server.domain": {
    type: "string",
    default: "",
    validate: (value) => {
      // 如果不是服务器模式或值为空，直接通过
      if (!value) return true;
      // 验证URL格式
      try {
        new URL(value);
        return true;
      } catch (e) {
        console.error("域名格式无效:", e);
        return false;
      }
    },
    description: "后端服务器域名",
    icon: "mdi-web",
    // 设置后端服务器的域名，用于从远程服务器获取数据
  },
  "server.classNumber": {
    type: "string",
    default: "高一6班",
    //validate: (value) => /^[A-Za-z0-9]*$/.test(value),
    validate: (value) => /.*/.test(value),
    description: "班级编号",
    icon: "mdi-account-group",
    // 设置班级标识，用于区分不同班级的数据
  },
  "server.siteKey": {
    type: "string",
    default: "",
    description: "网站令牌",
    icon: "mdi-key-chain",
    // 用于后端验证请求的令牌，将作为请求头 x-site-key 发送
  },
  "server.provider": {
    type: "string",
    default: "kv-local",
    validate: (value) =>
      ["kv-local", "kv-server", "classworkscloud"].includes(value),
    description: "数据提供者",
    icon: "mdi-database",
    // 选择数据存储方式：使用本地存储或远程服务器
  },

  // 刷新设置
  "refresh.auto": {
    type: "boolean",
    default: false,
    description: "是否启用自动刷新",
    icon: "mdi-refresh-auto",
    // 启用后将按设定的时间间隔自动刷新数据
  },
  "refresh.interval": {
    type: "number",
    default: 300,
    validate: (value) => value >= 10 && value <= 3600,
    description: "自动刷新间隔（秒）",
    icon: "mdi-timer-outline",
    // 设置自动刷新的时间间隔，范围10-3600秒
  },

  // 字体设置
  "font.size": {
    type: "number",
    default: 28,
    validate: (value) => value >= 16 && value <= 100,
    description: "字体大小",
    icon: "mdi-format-size",
  },

  // 编辑设置
  "edit.autoSave": {
    type: "boolean",
    default: true,
    description: "是否启用自动保存",
    icon: "mdi-content-save-outline",
    // 启用后编辑内容时会自动保存更改，无需手动点击保存按钮
  },
  "edit.blockNonTodayAutoSave": {
    // 添加新选项
    type: "boolean",
    default: true,
    description: "禁止自动保存非当天数据",
    icon: "mdi-calendar-lock",
    // 启用后只有当天的数据会自动保存，防止意外修改历史数据
  },
  "edit.refreshBeforeEdit": {
    type: "boolean",
    default: true,
    description: "编辑前是否自动刷新",
    icon: "mdi-refresh",
    // 启用后在开始编辑前会自动刷新数据，确保编辑的是最新内容
  },
  "edit.confirmNonTodaySave": {
    // 添加新选项
    type: "boolean",
    default: true,
    description: "保存非当天数据需确认",
    icon: "mdi-calendar-alert",
  },

  // 开发者选项
  "developer.enabled": {
    type: "boolean",
    default: false,
    description: "是否启用开发者选项",
    icon: "mdi-developer-board",
    // 启用后可以访问高级开发者功能和设置项
  },
  "developer.showDebugConfig": {
    type: "boolean",
    default: false,
    description: "是否显示调试配置",
    icon: "mdi-bug-outline",
    // 启用后在控制台显示详细的配置信息和设置变更日志
  },
  "developer.disableMessageLog": {
    // 添加新的设置项
    type: "boolean",
    default: false,
    description: "禁用消息日志记录",
    requireDeveloper: true,
    icon: "mdi-message-off-outline",
    // 启用后将不再记录应用消息到日志，可减少内存占用
  },

  // 主题设置
  "theme.mode": {
    type: "string",
    default: "dark",
    validate: (value) => ["light", "dark"].includes(value),
    description: "主题模式",
    icon: "mdi-theme-light-dark",
    // 设置应用的主题模式，可选亮色或暗色主题
  },
};

/**
 * 设置管理器单例类
 */
class SettingsManagerClass {
  constructor() {
    this.settingsCache = null;
    this.isInitialized = false;
  }

  /**
   * 初始化设置管理器
   */
  init() {
    if (this.isInitialized) return;
    this.loadSettings();
    this.isInitialized = true;
  }

  /**
   * 从localStorage加载所有设置
   * @returns {Object} 所有设置的值
   */
  loadSettings() {
    // Initialize settingsCache as an empty object first
    this.settingsCache = {};

    try {
      const stored =
        typeof localStorage !== "undefined"
          ? localStorage.getItem(SETTINGS_STORAGE_KEY)
          : null;
      if (stored) {
        this.settingsCache = JSON.parse(stored);
      }
    } catch (error) {
      console.error("加载设置失败:", error);
      // settingsCache is already an empty object, no need to reinitialize
    }

    // 确保所有设置项都有值（使用默认值填充）
    for (const [key, definition] of Object.entries(settingsDefinitions)) {
      if (!(key in this.settingsCache)) {
        this.settingsCache[key] = definition.default;
      }
    }

    return this.settingsCache;
  }

  /**
   * 保存所有设置到localStorage
   */
  saveSettings() {
    if (typeof localStorage === "undefined") return;

    try {
      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(this.settingsCache)
      );
    } catch (error) {
      console.error("保存设置失败:", error);
    }
  }

  /**
   * 获取设置项的值
   * @param {string} key - 设置项键名
   * @returns {any} 设置项的值
   */
  getSetting(key) {
    if (!this.isInitialized) {
      this.init();
    }

    const definition = settingsDefinitions[key];
    if (!definition) {
      console.warn(`未定义的设置项: ${key}`);
      return null;
    }

    // 确保开发者相关设置正确处理
    if (definition.requireDeveloper) {
      const devEnabled = this.settingsCache["developer.enabled"];
      if (!devEnabled) {
        return definition.default;
      }
    }

    // 检查是否使用Classworks云端存储，并覆盖特定设置
    if (this.settingsCache["server.provider"] === "classworkscloud") {
      if (classworksCloudDefaults[key] !== undefined) {
        return classworksCloudDefaults[key];
      }
    }

    const value = this.settingsCache[key];
    return value !== undefined ? value : definition.default;
  }

  /**
   * 设置配置项的值
   * @param {string} key - 设置项键名
   * @param {any} value - 要设置的值
   * @returns {boolean} 是否设置成功
   */
  setSetting(key, value) {
    if (!this.isInitialized) {
      this.init();
    }

    const definition = settingsDefinitions[key];
    if (!definition) {
      console.warn(`未定义的设置项: ${key}`);
      return false;
    }

    // 添加对开发者选项依赖的检查
    if (
      definition.requireDeveloper &&
      !this.settingsCache["developer.enabled"]
    ) {
      console.warn(`设置项 ${key} 需要启用开发者选项`);
      return false;
    }

    try {
      const oldValue = this.settingsCache[key];
      // 类型转换
      if (typeof value !== definition.type) {
        value =
          definition.type === "boolean"
            ? Boolean(value)
            : definition.type === "number"
            ? Number(value)
            : String(value);
      }

      // 验证
      if (definition.validate && !definition.validate(value)) {
        console.warn(`设置项 ${key} 的值无效`);
        return false;
      }

      this.settingsCache[key] = value;
      this.saveSettings();
      this.logSettingsChange(key, oldValue, value);

      // 为了保持向后兼容，同时更新旧的localStorage键
      const legacyKey = definition.legacyKey;
      if (legacyKey && typeof localStorage !== "undefined") {
        localStorage.setItem(legacyKey, value.toString());
      }

      return true;
    } catch (error) {
      console.error(`设置配置项 ${key} 失败:`, error);
      return false;
    }
  }

  /**
   * 记录设置变更
   */
  logSettingsChange(key, oldValue, newValue) {
    const shouldLog =
      this.settingsCache["developer.enabled"] &&
      this.settingsCache["developer.showDebugConfig"];

    if (shouldLog) {
      console.log(`[Settings] ${key}:`, {
        old: oldValue,
        new: newValue,
        time: new Date().toLocaleTimeString(),
      });
    }
  }

  /**
   * 重置指定设置项到默认值
   * @param {string} key - 设置项键名
   */
  resetSetting(key) {
    if (!this.isInitialized) {
      this.init();
    }

    const definition = settingsDefinitions[key];
    if (!definition) {
      console.warn(`未定义的设置项: ${key}`);
      return;
    }

    this.settingsCache[key] = definition.default;
    this.saveSettings();
  }

  /**
   * 重置所有设置项到默认值
   */
  resetAllSettings() {
    this.settingsCache = {};
    for (const [key, definition] of Object.entries(settingsDefinitions)) {
      this.settingsCache[key] = definition.default;
    }
    this.saveSettings();
  }

  /**
   * 监听设置变化
   * @param {Function} callback - 当设置改变时调用的回调函数
   * @returns {Function} 取消监听的函数
   */
  watchSettings(callback) {
    if (typeof window === "undefined") return () => {};

    const handler = (event) => {
      if (event.key === SETTINGS_STORAGE_KEY) {
        this.settingsCache = JSON.parse(event.newValue);
        callback(this.settingsCache);
      }
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }

  /**
   * 获取设置项的定义
   * @param {string} key - 设置项键名
   * @returns {SettingDefinition|null} 设置项的定义或null
   */
  getSettingDefinition(key) {
    return settingsDefinitions[key] || null;
  }

  /**
   * 将当前配置导出为简单的键值对对象
   * @returns {Object} 包含所有设置的键值对对象
   */
  exportSettingsAsKeyValue() {
    if (!this.isInitialized) {
      this.init();
    }

    // 创建一个新对象，避免直接返回引用
    const exportedSettings = {};

    // 遍历所有设置项
    for (const key in settingsDefinitions) {
      // 获取当前值（确保使用getSetting以应用所有规则，如开发者选项依赖）
      exportedSettings[key] = this.getSetting(key);
    }

    return exportedSettings;
  }
}

// 创建单例实例
const SettingsManager = new SettingsManagerClass();

// 在服务器端和客户端都能正常工作的初始化
if (typeof window !== "undefined") {
  SettingsManager.init();
}

// 为了向后兼容性，提供与原来相同的函数接口
const getSetting = (key) => SettingsManager.getSetting(key);
const setSetting = (key, value) => SettingsManager.setSetting(key, value);
const resetSetting = (key) => SettingsManager.resetSetting(key);
const resetAllSettings = () => SettingsManager.resetAllSettings();
const watchSettings = (callback) => SettingsManager.watchSettings(callback);
const getSettingDefinition = (key) => SettingsManager.getSettingDefinition(key);
const exportSettingsAsKeyValue = () =>
  SettingsManager.exportSettingsAsKeyValue();

// 导出单例和直接方法
export {
  settingsDefinitions,
  SettingsManager,
  getSetting,
  setSetting,
  resetSetting,
  resetAllSettings,
  watchSettings,
  getSettingDefinition,
  exportSettingsAsKeyValue,
};
