import { $streaming, fetchCurrentStreamingFx } from "./";
import { getCurrentService } from "@src/utils/getCurrentService";
import { initTimeTracker } from "@src/models/timeTracker/init";

$streaming.on(fetchCurrentStreamingFx.doneData, (_, streaming) => streaming);
fetchCurrentStreamingFx.use(() => {
  const service = getCurrentService();
  
  // 初始化视频服务
  service.init();
  
  // 初始化时间追踪器和显示组件
  initTimeTracker();
  
  return service;
});
