import { formatTime, updateCurrentTime, checkEasterEggTime, showEasterEgg, EASTER_EGG_TIME } from '@src/models/timeEgg';

// 视频播放器元素选择器
const VIDEO_SELECTORS = [
  // YouTube
  'video.html5-main-video',
  // Netflix
  '.VideoContainer video',
  // Bilibili
  '.bilibili-player-video video',
  '.bpx-player-video-wrap video',
  // 腾讯视频
  '.txp_video_container video',
  '.tenvideo_player video',
  '#player-container video',
  // 通用视频选择器
  'video'
];

// 追踪视频时间的类
export class VideoTimeTracker {
  private interval: number | null = null;
  private lastTime: string = '';
  private eggTriggered: boolean = false;
  
  constructor(private checkInterval: number = 1000) {}
  
  // 开始监听
  public start(): void {
    if (this.interval) {
      this.stop();
    }
    
    this.interval = window.setInterval(() => {
      this.checkVideoTime();
    }, this.checkInterval);
    
    console.log('Video time tracker started');
  }
  
  // 停止监听
  public stop(): void {
    if (this.interval) {
      window.clearInterval(this.interval);
      this.interval = null;
      console.log('Video time tracker stopped');
    }
  }
  
  // 重置彩蛋触发状态
  public resetEggTrigger(): void {
    this.eggTriggered = false;
  }
  
  // 检查视频时间
  private checkVideoTime(): void {
    const videoElement = this.findVideoElement();
    
    if (videoElement && !isNaN(videoElement.currentTime)) {
      const currentSeconds = Math.floor(videoElement.currentTime);
      const formattedTime = formatTime(currentSeconds);
      
      // 只有当时间变化时才更新UI
      if (formattedTime !== this.lastTime) {
        this.lastTime = formattedTime;
        updateCurrentTime(formattedTime);
        
        // 检查是否达到彩蛋时间
        if (formattedTime === EASTER_EGG_TIME && !this.eggTriggered) {
          this.eggTriggered = true;
          showEasterEgg();
          console.log('Easter egg triggered at time:', formattedTime);
        } else if (formattedTime !== EASTER_EGG_TIME) {
          // 当播放时间不是彩蛋时间时，重置触发状态，允许再次触发
          this.eggTriggered = false;
        }
      }
    }
  }
  
  // 查找视频元素
  private findVideoElement(): HTMLVideoElement | null {
    for (const selector of VIDEO_SELECTORS) {
      const element = document.querySelector(selector) as HTMLVideoElement;
      if (element && element instanceof HTMLVideoElement) {
        return element;
      }
    }
    return null;
  }
}

// 创建单例实例
export const videoTimeTracker = new VideoTimeTracker();

// 导出默认实例，方便导入
export default videoTimeTracker; 