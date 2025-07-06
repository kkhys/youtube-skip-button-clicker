import "./style.css";
import { version } from "../../package.json";

interface SkipperConfig {
  enabled: boolean;
  skipCount: number;
  lastSkipTime: number;
}

class PopupUI {
  private config: SkipperConfig = {
    enabled: false,
    skipCount: 0,
    lastSkipTime: 0,
  };

  constructor() {
    void this.init();
  }

  private async init() {
    await this.loadConfig();
    this.renderUI();
    this.setupEventListeners();
  }

  private async loadConfig() {
    try {
      const result = await chrome.storage.sync.get("skipperConfig");
      if (result.skipperConfig) {
        this.config = { ...this.config, ...result.skipperConfig };
      }
    } catch (error) {
      console.error("設定読み込みエラー:", error);
    }
  }

  private async saveConfig() {
    try {
      await chrome.storage.sync.set({ skipperConfig: this.config });
    } catch (error) {
      console.error("設定保存エラー:", error);
    }
  }

  private renderUI() {
    const appElement = document.querySelector("#app");
    if (!appElement) return;

    appElement.innerHTML = `
      <div class="popup-container">
        <div class="header">
          <div class="logo">
            <img src="/images/icon-48.png" alt="YouTube Skip Button Clicker" />
            <h1>${chrome.i18n.getMessage("chrome_extension_name")}</h1>
          </div>
        </div>
        <div class="main-content">
          <div class="toggle-section">
            <div class="toggle-container">
              <label class="toggle-label">
                <input type="checkbox" id="enableToggle" ${this.config.enabled ? "checked" : ""}>
                <span class="slider"></span>
              </label>
              <span class="toggle-text">${this.config.enabled ? "ON" : "OFF"}</span>
            </div>
            <p class="toggle-description">
              ${this.config.enabled ? "広告を自動でスキップします" : "広告スキップは無効です"}
            </p>
          </div>
          <div class="stats-section">
            <div class="stat-item">
              <span class="stat-label">スキップ回数</span>
              <span class="stat-value">${this.config.skipCount}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">最終スキップ</span>
              <span class="stat-value">${this.getLastSkipText()}</span>
            </div>
          </div>
          <div class="actions-section">
            <button id="resetStats" class="reset-button">統計をリセット</button>
          </div>
        </div>
        <div class="footer">
          <p class="version">v${version}</p>
          <p class="usage-tip">💡 YouTubeページでのみ動作します</p>
        </div>
      </div>
    `;
  }

  private setupEventListeners() {
    const enableToggle = document.getElementById(
      "enableToggle",
    ) as HTMLInputElement;
    enableToggle?.addEventListener("change", async (e) => {
      this.config.enabled = (e.target as HTMLInputElement).checked;
      await this.saveConfig();
      this.updateToggleUI();
    });

    const resetButton = document.getElementById("resetStats");
    resetButton?.addEventListener("click", async () => await this.resetStats());
  }

  private updateToggleUI() {
    const toggleText = document.querySelector(".toggle-text");
    const toggleDescription = document.querySelector(".toggle-description");

    if (toggleText) {
      toggleText.textContent = this.config.enabled ? "ON" : "OFF";
    }

    if (toggleDescription) {
      toggleDescription.textContent = this.config.enabled
        ? "広告を自動でスキップします"
        : "広告スキップは無効です";
    }
  }

  /**
   * 最終スキップ時間のテキストを取得
   */
  private getLastSkipText() {
    if (this.config.lastSkipTime === 0) {
      return "なし";
    }

    const date = new Date(this.config.lastSkipTime);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) {
      // 1分未満
      return "1分前";
    } else if (diff < 3600000) {
      // 1時間未満
      return `${Math.floor(diff / 60000)}分前`;
    } else if (diff < 86400000) {
      // 1日未満
      return `${Math.floor(diff / 3600000)}時間前`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * 統計をリセット
   */
  private async resetStats() {
    this.config.skipCount = 0;
    this.config.lastSkipTime = 0;
    await this.saveConfig();
    this.renderUI();
    this.setupEventListeners();
  }
}

document.addEventListener("DOMContentLoaded", () => new PopupUI());
