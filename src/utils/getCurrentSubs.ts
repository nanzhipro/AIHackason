import { TSub } from "@src/models/types";

// 定义一个延迟时间，单位为毫秒，表示字幕结束后保持显示的时间
const SUBTITLE_RETENTION_TIME = 2000; // 2秒

export const getCurrentSubs = (subs: TSub[], time: number): TSub[] => {
  // 检查当前时间点是否有字幕
  const currentSubs = subs.filter((sub) => sub.start <= time && sub.end >= time);
  
  // 如果当前时间点有字幕，直接返回
  if (currentSubs.length > 0) {
    return currentSubs;
  }
  
  // 如果当前没有字幕，查找是否有刚刚结束不久的字幕
  // 找到所有已经结束的字幕，且结束时间与当前时间的差值不超过保留时间
  const recentEndedSubs = subs.filter(
    (sub) => sub.end < time && (time - sub.end) <= SUBTITLE_RETENTION_TIME
  );
  
  // 如果有刚刚结束的字幕，返回最近的一个
  if (recentEndedSubs.length > 0) {
    // 按结束时间降序排列，获取最近结束的字幕
    recentEndedSubs.sort((a, b) => b.end - a.end);
    return [recentEndedSubs[0]];
  }
  
  // 如果既没有当前字幕，也没有刚刚结束的字幕，返回空数组
  return [];
};
