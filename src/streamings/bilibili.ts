import { parse } from "subtitle";

import { esSubsChanged } from "@src/models/subs";
import { esRenderSetings } from "@src/models/settings";
import Service from "./service";

class Bilibili implements Service {
  name = "bilibili";

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
    window.addEventListener("esBilibiliCaptionsData", this.handleCaptionsData as EventListener);
    window.addEventListener("esBilibiliCaptionsChanged", this.handleCaptionsChanges as EventListener);
    window.addEventListener("esBilibiliLoaded", this.handleLoaded as EventListener);
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
      console.error("Error fetching Bilibili subtitles:", e);
      return parse("");
    }
  }

  public getSubsContainer() {
    // Bilibili视频播放器容器
    const selector = document.querySelector(".bilibili-player-video-wrap") || 
                     document.querySelector(".bpx-player-video-wrap");
    if (selector === null) throw new Error("Subtitles container not found");
    return selector as HTMLElement;
  }

  public getSettingsButtonContainer() {
    // Bilibili视频播放器控制栏右侧
    const selector = document.querySelector(".bilibili-player-video-control-bottom-right") || 
                     document.querySelector(".bpx-player-control-bottom-right");
    if (selector === null) throw new Error("Settings button container not found");
    return selector as HTMLElement;
  }

  public getSettingsContentContainer() {
    // Bilibili视频播放器容器
    const selector = document.querySelector(".bilibili-player-video-wrap") || 
                     document.querySelector(".bpx-player-video-wrap");
    if (selector === null) throw new Error("Settings content container not found");
    return selector as HTMLElement;
  }

  public isOnFlight() {
    return false;
  }

  private getVideoId(): string {
    // 从URL中提取BV号或av号
    const bvidMatch = window.location.href.match(/\/video\/(BV\w+)/);
    if (bvidMatch && bvidMatch[1]) {
      return bvidMatch[1];
    }
    
    const aidMatch = window.location.href.match(/\/video\/av(\d+)/);
    if (aidMatch && aidMatch[1]) {
      return `av${aidMatch[1]}`;
    }
    
    console.error("Can't get Bilibili video id");
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
    console.log("Bilibili player loaded");
    esRenderSetings();
  }

  private injectScript() {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("assets/js/bilibili.js");
    script.type = "module";
    document.head.prepend(script);
  }
}

export default Bilibili; 