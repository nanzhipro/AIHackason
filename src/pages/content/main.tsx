import { createRoot } from "react-dom/client";
import refreshOnUpdate from "virtual:reload-on-update-in-view";

import { $streaming, fetchCurrentStreamingFx } from "@src/models/streamings";
import { esRenderSetings } from "@src/models/settings";
import { esSubsChanged } from "@src/models/subs";
import { $video, getCurrentVideoFx, videoTimeUpdate } from "@src/models/videos";
import { Settings } from "@src/pages/content/components/Settings";
import { Subs } from "./components/Subs";
import { ProgressBar } from "./components/ProgressBar";
import { removeKeyboardEventsListeners } from "@src/utils/keyboardHandler";
import { setDanmakuStyle, addStyleChangeListener, getCurrentStyleKey } from "@src/utils/openaiService";

refreshOnUpdate("pages/content");

fetchCurrentStreamingFx();

const handleTimeUpdate = () => {
  videoTimeUpdate();
};

// 添加消息监听器处理风格选择
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "setDanmakuStyle" && message.styleKey) {
    console.log("设置弹幕风格为:", message.styleKey);
    setDanmakuStyle(message.styleKey);
    // 向popup返回当前设置的风格，确保界面同步
    sendResponse({ success: true, currentStyle: getCurrentStyleKey() });
  }
  return true;
});

// 从存储中加载用户的风格设置
chrome.storage.sync.get("danmakuStyle", (result) => {
  if (result.danmakuStyle) {
    console.log("从存储加载弹幕风格:", result.danmakuStyle);
    setDanmakuStyle(result.danmakuStyle);
  }
});

// 监听风格变更，更新页面状态
const removeStyleListener = addStyleChangeListener((newStyleKey) => {
  console.log("弹幕风格已更新为:", newStyleKey);
  // 这里可以添加一个通知或者视觉提示
  
  // 发送通知到页面
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.top = '10%';
  notification.style.left = '50%';
  notification.style.transform = 'translateX(-50%)';
  notification.style.background = 'rgba(0, 0, 0, 0.7)';
  notification.style.color = 'white';
  notification.style.padding = '10px 20px';
  notification.style.borderRadius = '5px';
  notification.style.zIndex = '9999';
  notification.style.fontWeight = 'bold';
  notification.style.transition = 'opacity 0.5s';
  notification.style.opacity = '0';
  
  // 获取风格名称
  const styleName = {
    FUNNY: '搞笑',
    ACADEMIC: '学术风',
    MEME: '网络梗',
    MOVIE: '影视陪伴',
    DUSHE: '毒舌'
  }[newStyleKey] || newStyleKey;
  
  notification.textContent = `弹幕风格已切换为: ${styleName}`;
  document.body.appendChild(notification);
  
  // 显示通知
  setTimeout(() => {
    notification.style.opacity = '1';
    
    // 3秒后淡出
    setTimeout(() => {
      notification.style.opacity = '0';
      // 完全淡出后移除DOM
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 3000);
  }, 100);
});

// 页面卸载时清理监听器
window.addEventListener('unload', () => {
  removeStyleListener();
});

$streaming.watch((streaming) => {
  console.log("streaming changed", streaming);
  document.body.classList.add("es-" + streaming.name);

  if (streaming == null) {
    return;
  }

  esRenderSetings.watch(() => {
    console.log("Event:", "esRenderSetings");
    document.querySelectorAll(".es-settings").forEach((e) => e.remove());
    const buttonContainer = streaming.getSettingsButtonContainer();
    const contentContainer = streaming.getSettingsContentContainer();

    const parentNode = buttonContainer?.parentNode;
    const settingNode = document.createElement("div");
    settingNode.className = "es-settings";
    parentNode?.insertBefore(settingNode, buttonContainer);

    getCurrentVideoFx();
    $video.watch((video) => {
      video?.removeEventListener("timeupdate", handleTimeUpdate as EventListener);
      video?.addEventListener("timeupdate", handleTimeUpdate as EventListener);
    });
    createRoot(settingNode).render(<Settings contentContainer={contentContainer} />);
  });

  streaming.init();
});

esSubsChanged.watch((language) => {
  console.log("Event:", "esSubsChanged");
  console.log("Language:", language);
  removeKeyboardEventsListeners();
  document.querySelectorAll("#es").forEach((e) => e.remove());
  const subsContainer = $streaming.getState().getSubsContainer();
  const subsNode = document.createElement("div");
  subsNode.id = "es";
  subsContainer?.appendChild(subsNode);
  createRoot(subsNode).render(<Subs />);

  if (!$streaming.getState().isOnFlight()) {
    document.querySelectorAll(".es-progress-bar").forEach((e) => e.remove());
    const progressBarNode = document.createElement("div");
    progressBarNode.classList.add("es-progress-bar");
    subsContainer?.appendChild(progressBarNode);
    createRoot(progressBarNode).render(<ProgressBar />);
  }
});
