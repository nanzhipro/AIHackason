import { FC, useEffect, useState, useCallback, useRef } from "react";
import { useUnit } from "effector-react";

import { $currentSubs } from "@src/models/subs";
import { $video, $wasPaused, wasPausedChanged } from "@src/models/videos";
import { TSub } from "@src/models/types";
import {
  $autoStopEnabled,
  $moveBySubsEnabled,
  $subsBackground,
  $subsBackgroundOpacity,
  $subsFontSize,
} from "@src/models/settings";
import {
  $findPhrasalVerbsPendings
} from "@src/models/translations";
import { addKeyboardEventsListeners, removeKeyboardEventsListeners } from "@src/utils/keyboardHandler";
import { translateSubtitle } from "@src/utils/openaiService";
import { DanmakuContainer } from "./DanmakuContainer";

// 新增一个设置项，控制是否启用弹幕模式
const ENABLE_DANMAKU = true;

// 检查弹幕功能初始化
const initDanmaku = () => {
  try {
    console.log('弹幕功能初始化完成');
    return true;
  } catch (error) {
    console.error('弹幕功能初始化失败:', error);
    return false;
  }
};

// 初始化弹幕
const danmakuEnabled = ENABLE_DANMAKU && initDanmaku();

type TSubsProps = {};

export const Subs: FC<TSubsProps> = () => {
  const [video, currentSubs, subsFontSize, moveBySubsEnabled, wasPaused, handleWasPausedChanged, autoStopEnabled] =
    useUnit([$video, $currentSubs, $subsFontSize, $moveBySubsEnabled, $wasPaused, wasPausedChanged, $autoStopEnabled]);

  // 计算字体大小，保证适配各种播放器尺寸
  const fontSize = Math.max(((video.clientWidth / 100) * subsFontSize) / 43, 16);

  // 为弹幕功能添加的状态
  const [lastTranslation, setLastTranslation] = useState<string>('');
  const [showDanmaku, setShowDanmaku] = useState<boolean>(danmakuEnabled);

  // 保存上一次显示的字幕，防止在没有新字幕时清空
  const [lastDisplayedSubs, setLastDisplayedSubs] = useState<TSub[]>([]);

  // 获取视频尺寸和位置信息
  const [videoRect, setVideoRect] = useState<DOMRect | null>(null);

  // 当有新字幕时更新lastDisplayedSubs
  useEffect(() => {
    if (currentSubs && currentSubs.length > 0) {
      setLastDisplayedSubs(currentSubs);
    }
  }, [currentSubs]);

  // 监听视频元素的尺寸变化
  useEffect(() => {
    if (!video) return;

    const updateVideoRect = () => {
      setVideoRect(video.getBoundingClientRect());
    };

    // 初始更新
    updateVideoRect();

    // 添加事件监听
    window.addEventListener('resize', updateVideoRect);

    // 使用MutationObserver监听DOM变化
    const observer = new MutationObserver(updateVideoRect);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('resize', updateVideoRect);
      observer.disconnect();
    };
  }, [video]);

  useEffect(() => {
    if (moveBySubsEnabled) {
      addKeyboardEventsListeners();
    }
    return () => {
      removeKeyboardEventsListeners();
    };
  }, []);

  // 设置最新的翻译文本用于弹幕显示
  const updateLastTranslation = useCallback((translation: string) => {
    if (translation && !translation.startsWith('翻译出错') && showDanmaku) {
      setLastTranslation(translation);
    }
  }, [showDanmaku]);

  // 使用lastDisplayedSubs而不是currentSubs来决定显示内容
  const subsToDisplay = (currentSubs && currentSubs.length > 0) ? currentSubs : lastDisplayedSubs;

  // 如果没有任何可显示的字幕，返回null
  if (!subsToDisplay || subsToDisplay.length === 0) {
    return null;
  }

  // 隐藏处理翻译但不显示中间字幕
  const hiddenStyle = {
    position: 'absolute' as const,
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap' as const,
    border: '0'
  };

  return (
    <>
      {/* 隐藏的字幕区域，只用于处理字幕并获取翻译 */}
      <div style={hiddenStyle}>
        {subsToDisplay.map((sub) => (
          <Sub
            sub={sub}
            key={sub.text}
            onTranslationReceived={updateLastTranslation}
          />
        ))}
      </div>

      {/* 弹幕容器 */}
      {danmakuEnabled && video && videoRect && (
        <div
          style={{
            // position: 'fixed',
            top: videoRect.top + 'px',
            left: videoRect.left + 'px',
            width: videoRect.width + 'px',
            height: videoRect.height + 'px', // 调整为与播放器相同高度
            pointerEvents: 'none',
            overflow: 'visible', // 不裁剪溢出内容
            zIndex: 9998,
            background: 'transparent' // 确保背景透明
            // 移除调试边框
            // border: '1px solid rgba(255, 0, 0, 0.2)'
          }}
        >
          <DanmakuContainer
            translation={lastTranslation}
            isActive={showDanmaku && !video.paused}
          />
        </div>
      )}
    </>
  );
};

const Sub: FC<{
  sub: TSub;
  onTranslationReceived?: (translation: string) => void;
}> = ({ sub, onTranslationReceived }) => {
  const [aiTranslation, setAiTranslation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [retries, setRetries] = useState<number>(0);
  const [, , findPhrasalVerbsPendings] = useUnit([
    $subsBackground,
    $subsBackgroundOpacity,
    $findPhrasalVerbsPendings,
  ]);

  // 添加重试翻译功能
  const handleRetry = useCallback(() => {
    setError('');
    setRetries(prev => prev + 1);
  }, []);

  // 优化的翻译函数
  const fetchTranslation = useCallback(async (text: string) => {
    if (!text.trim()) return;

    try {
      setLoading(true);
      setError('');
      const translatedText = await translateSubtitle(text);

      if (translatedText === '翻译出错' || translatedText.startsWith('翻译出错：')) {
        setError('翻译服务暂时不可用，请稍后再试');
        setTimeout(handleRetry, 3000); // 自动重试
      } else if (translatedText) {
        setAiTranslation(translatedText);

        // 向父组件传递翻译结果，用于弹幕显示
        if (onTranslationReceived) {
          onTranslationReceived(translatedText);
        }
      }
    } catch (error) {
      console.error('Error fetching translation:', error);
      setError('翻译失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  }, [onTranslationReceived, handleRetry]);

  // 在组件挂载后获取翻译
  useEffect(() => {
    let isMounted = true;

    if (sub.cleanedText) {
      fetchTranslation(sub.cleanedText);
    }

    return () => {
      isMounted = false;
    };
  }, [sub.cleanedText, retries, fetchTranslation]);

  if (findPhrasalVerbsPendings[sub.text]) {
    return null;
  }

  // 只返回一个处理进度的容器，不显示任何内容
  return <div className="translation-processor" />;
};
