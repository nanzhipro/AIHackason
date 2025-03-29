import { parse } from "subtitle";

import { esSubsChanged } from "@src/models/subs";
import { esRenderSetings } from "@src/models/settings";
import Service from "./service";

class Tencent implements Service {
  name = "tencent";

  private subCache: {
    [moveId: string]: {
      [lang: string]: string;
    };
  };

  constructor() {
    this.subCache = {};
    this.handleCaptionsData = this.handleCaptionsData.bind(this);
    this.handleCaptionsChanges = this.handleCaptionsChanges.bind(this);
  }

  public init(): void {
    this.injectScript();
    window.addEventListener("esTencentCaptionsData", this.handleCaptionsData as EventListener);
    window.addEventListener("esTencentCaptionsChanged", this.handleCaptionsChanges as EventListener);
    window.addEventListener("esTencentLoaded", this.handleLoaded as EventListener);
  }

  public async getSubs(label: string) {
    if (!label) return parse("");
    const videoId = this.getVideoId();

    if (!this.subCache[videoId] || !this.subCache[videoId][label]) {
      return parse("");
    }

    const urlObject: URL = new URL(this.subCache[videoId][label]);
    const subUri: string = urlObject.href;

    try {
      const resp = await fetch(subUri);
      const text = await resp.text();
      return parse(text);
    } catch (e) {
      console.error("Error fetching Tencent subtitles:", e);
      return parse("");
    }
  }

  public getSubsContainer() {
    // 腾讯视频播放器容器
    const selector = document.querySelector(".txp_video_container") || 
                    document.querySelector(".tenvideo_player") ||
                    document.querySelector("#player-container");
    if (selector === null) throw new Error("Subtitles container not found");
    return selector as HTMLElement;
  }

  public getSettingsButtonContainer() {
    // 腾讯视频播放器控制栏右侧
    const selector = document.querySelector(".txp_right_controls") || 
                    document.querySelector(".txp_menu_right");
    if (selector === null) throw new Error("Settings button container not found");
    return selector as HTMLElement;
  }

  public getSettingsContentContainer() {
    // 腾讯视频播放器容器
    const selector = document.querySelector(".txp_video_container") || 
                    document.querySelector(".tenvideo_player") ||
                    document.querySelector("#player-container");
    if (selector === null) throw new Error("Settings content container not found");
    return selector as HTMLElement;
  }

  public isOnFlight() {
    return false;
  }

  private getVideoId(): string {
    // 从URL中提取视频ID
    // 腾讯视频URL格式通常为 https://v.qq.com/x/cover/xxx/yyy.html 或 https://v.qq.com/x/page/yyy.html
    // 其中yyy是视频ID
    
    // 尝试获取页面vid参数
    const vidScript = document.querySelector('script:contains("vid")');
    if (vidScript) {
      const vidMatch = vidScript.textContent?.match(/vid\s*[:=]\s*["']([^"']+)["']/);
      if (vidMatch && vidMatch[1]) {
        return vidMatch[1];
      }
    }
    
    // 从URL中提取
    const vidFromUrl = window.location.href.match(/\/([a-z0-9]+)\.html/);
    if (vidFromUrl && vidFromUrl[1]) {
      return vidFromUrl[1];
    }
    
    console.error("Can't get Tencent video id");
    return "";
  }

  private handleCaptionsData(event: CustomEvent): void {
    const { videoId, lang, url } = event.detail;
    if (!this.subCache[videoId]) {
      this.subCache[videoId] = {};
    }
    this.subCache[videoId][lang] = url;
  }

  private handleCaptionsChanges(event: CustomEvent): void {
    esSubsChanged(event.detail);
  }

  private handleLoaded() {
    console.log("Tencent player loaded");
    esRenderSetings();
  }

  private injectScript() {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("assets/js/tencent.js");
    script.type = "module";
    document.head.prepend(script);
  }
}

export default Tencent; 