import { createStore, createEvent } from "effector";

// 存储当前视频播放时间
export const $currentTime = createStore<string>("00:00:00");

// 存储是否显示彩蛋
export const $showEasterEgg = createStore<boolean>(false);

// 更新当前时间的事件
export const updateCurrentTime = createEvent<string>();

// 显示彩蛋的事件
export const showEasterEgg = createEvent();

// 隐藏彩蛋的事件
export const hideEasterEgg = createEvent();

// 特定的彩蛋触发时间点（小时:分钟:秒）
export const EASTER_EGG_TIME = "01:28:29";

// 初始化stores
$currentTime.on(updateCurrentTime, (_, time) => time);
$showEasterEgg.on(showEasterEgg, () => true);
$showEasterEgg.on(hideEasterEgg, () => false);

// 格式化时间的函数（秒 -> HH:MM:SS）
export const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  return [
    h.toString().padStart(2, "0"),
    m.toString().padStart(2, "0"),
    s.toString().padStart(2, "0"),
  ].join(":");
};

// 检查是否到达彩蛋时间点
export const checkEasterEggTime = (time: string): boolean => {
  return time === EASTER_EGG_TIME;
}; 