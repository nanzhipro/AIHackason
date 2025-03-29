import { parse } from "subtitle";

import Service from "./service";

class ServiceStub implements Service {
  name = "stub";

  public init(): void {
    console.warn("Current streaming service is not supported. Please visit a supported streaming site.");
  }

  public async getSubs() {
    console.warn("Cannot get subtitles: current streaming service is not supported.");
    return parse("");
  }

  public getSubsContainer() {
    // 返回一个可能的容器，如果不存在则创建一个
    const container = document.querySelector("video")?.parentElement || document.body;
    console.warn("Using fallback container for subtitles");
    return container;
  }

  public getSettingsButtonContainer() {
    // 尝试找到视频控制区域或返回body
    const container = document.querySelector("video")?.parentElement || document.body;
    console.warn("Using fallback container for settings button");
    return container;
  }

  public getSettingsContentContainer() {
    // 返回body作为设置内容的容器
    console.warn("Using body as settings content container");
    return document.body;
  }

  public isOnFlight() {
    return false;
  }
}

export default ServiceStub;
