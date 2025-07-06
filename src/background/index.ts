interface SkipperConfig {
  enabled: boolean;
  skipCount: number;
  lastSkipTime: number;
}

const DEFAULT_CONFIG: SkipperConfig = {
  enabled: false,
  skipCount: 0,
  lastSkipTime: 0,
};

/**
 * 拡張機能インストール時の初期化処理
 */
chrome.runtime.onInstalled.addListener(async () => {
  try {
    // 初期設定の保存
    const result = await chrome.storage.sync.get("skipperConfig");
    if (!result.skipperConfig) {
      await chrome.storage.sync.set({ skipperConfig: DEFAULT_CONFIG });
    }

    // 現在の設定に基づいてバッジを更新
    await updateBadge();
  } catch (error) {
    console.error("初期化エラー:", error);
  }
});

/**
 * 設定変更時のバッジ更新
 */
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === "sync" && changes.skipperConfig) {
    await updateBadge();
  }
});

/**
 * コンテンツスクリプトからのメッセージ処理
 */
chrome.runtime.onMessage.addListener(async (message, _sender) => {
  if (message.action === "adSkipped") {
    await handleAdSkipped(message);
  }
});

/**
 * 広告スキップ時の処理
 */
async function handleAdSkipped(message: {
  timestamp: number;
  skipCount: number;
}) {
  try {
    if (chrome.notifications) {
      await chrome.notifications.create({
        type: "basic",
        iconUrl: "images/icon-48.png",
        title: chrome.i18n.getMessage("chrome_extension_name"),
        message: `広告をスキップしました (${message.skipCount}回目)`,
      });
    }
  } catch (error) {
    console.error("広告スキップ処理エラー:", error);
  }
}

/**
 * バッジを現在の設定と同期
 */
async function updateBadge() {
  try {
    const result = await chrome.storage.sync.get("skipperConfig");
    const config = result.skipperConfig || DEFAULT_CONFIG;

    await chrome.action.setBadgeText({
      text: config.enabled ? "ON" : "OFF",
    });

    await chrome.action.setBadgeBackgroundColor({
      color: config.enabled ? "#ff0000" : "#999999",
    });
  } catch (error) {
    console.error("バッジ更新エラー:", error);
  }
}

/**
 * 拡張機能の開始/停止時の処理
 */
chrome.runtime.onStartup.addListener(async () => {
  // スタートアップ時にバッジを現在の設定と同期
  await updateBadge();
});
