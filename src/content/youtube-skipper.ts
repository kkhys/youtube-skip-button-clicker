interface SkipperConfig {
  enabled: boolean;
  skipCount: number;
  lastSkipTime: number;
}

class YouTubeAdSkipper {
  private config: SkipperConfig = {
    enabled: true,
    skipCount: 0,
    lastSkipTime: 0,
  };

  private observer: MutationObserver | null = null;

  constructor() {
    void this.init();
  }

  private async init() {
    try {
      await this.loadConfig();
      this.setupObserver();

      chrome.storage.onChanged.addListener((changes) => {
        if (changes.skipperConfig) {
          this.config = changes.skipperConfig.newValue;
        }
      });
    } catch (error) {
      console.error("YouTubeAdSkipper初期化エラー:", error);
    }
  }

  /**
   * DOM監視を設定
   */
  private setupObserver() {
    this.observer = new MutationObserver((mutationsList) => {
      if (!this.config.enabled) return;

      for (const mutation of mutationsList) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            const element = node as Element;

            if (element.matches?.("button.ytp-skip-ad-button")) {
              void this.handleSkipButton(element as HTMLElement);
              return;
            }
          }
        }
      }
    });

    const targetElement =
      document.querySelector("#player-container") || document.body;

    this.observer.observe(targetElement, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });
  }

  /**
   * スキップボタンを処理
   */
  private async handleSkipButton(button: HTMLElement) {
    await this.clickSkipButton(button);
  }

  /**
   * 設定を読み込む
   */
  private async loadConfig() {
    try {
      const result = await chrome.storage.sync.get("skipperConfig");
      if (result.skipperConfig) {
        this.config = { ...this.config, ...result.skipperConfig };
      }
    } catch (error) {
      console.error("設定の読み込みエラー:", error);
    }
  }

  /**
   * スキップボタンをクリック
   */
  private async clickSkipButton(button: HTMLElement) {
    const now = Date.now();

    try {
      let success = false;

      // 方法1: 通常のclick()
      try {
        button.click();
        console.log("通常のclick()実行");
        success = true;
      } catch (error) {
        console.error("通常のclick()失敗:", error);
      }

      // 方法2: MouseEventでのクリック
      if (!success) {
        try {
          const rect = button.getBoundingClientRect();
          const event = new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
          });
          button.dispatchEvent(event);
          console.log("MouseEventクリック実行");
          success = true;
        } catch (error) {
          console.error("MouseEventクリック失敗:", error);
        }
      }

      if (success) {
        console.log("スキップボタンクリック成功！");

        // 統計更新
        this.config.skipCount++;
        this.config.lastSkipTime = now;
        await this.saveConfig();

        // バックグラウンドに通知
        try {
          await chrome.runtime.sendMessage({
            action: "adSkipped",
            timestamp: now,
            skipCount: this.config.skipCount,
            success: true,
          });
        } catch (error) {
          console.error("バックグラウンドへの通知エラー:", error);
        }
      } else {
        console.error("全てのクリック方法が失敗しました");
      }
    } catch (error) {
      console.error("スキップボタンクリックエラー:", error);
    }
  }

  /**
   * 設定を保存
   */
  private async saveConfig() {
    try {
      await chrome.storage.sync.set({ skipperConfig: this.config });
    } catch (error) {
      console.error("設定保存エラー:", error);
    }
  }

  /**
   * クリーンアップ
   */
  public destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

if (window.location.hostname === "www.youtube.com") {
  // 拡張機能を初期化
  const skipper = new YouTubeAdSkipper();
  window.addEventListener("beforeunload", () => skipper.destroy());
} else {
  console.log("YouTube以外のページです:", window.location.hostname);
}
