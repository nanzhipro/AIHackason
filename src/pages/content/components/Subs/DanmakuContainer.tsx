import { FC, useState, useEffect, useRef } from 'react';
import { DanmakuTranslation } from './DanmakuTranslation';

// 美化弹幕文本 - 添加表情符号
const enhanceText = (text: string): string => {
  // 如果文本中已经包含表情，就不再添加
  if (/[\u{1F300}-\u{1F6FF}]/u.test(text)) {
    return text;
  }

  // 常用表情符号
  const emojis = ['😂', '😍', '🤣', '😊', '😁', '👍', '🔥', '✨', '💯', '🎉', '👀', '💪', '❤️', '🙌', '🤔'];
  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

  // 随机决定表情放在开头还是结尾
  return Math.random() > 0.5 ? `${randomEmoji} ${text}` : `${text} ${randomEmoji}`;
};

interface DanmakuContainerProps {
  translation: string;
  isActive: boolean;
}

interface DanmakuItem {
  id: number;
  text: string;
  top: number; // 垂直位置百分比
  track: number; // 所在轨道编号
  width?: number; // 弹幕宽度（像素）
  rightEdge?: number; // 右边缘位置
}

// 设置可用的轨道数量
const TRACK_COUNT = 10;
// 每个轨道的高度占比
const TRACK_HEIGHT = 6; // 百分比单位
// 轨道之间的间距
const TRACK_MARGIN = 1; // 百分比单位
// 轨道起始位置（顶部留出空间）
const TRACK_START = 10; // 百分比单位

// 设置最大同时显示的弹幕数量
const MAX_DANMAKUS = 12;
let lastDanmakuId = 0;

// 弹幕间隔时间(毫秒)
const DANMAKU_INTERVAL = 1000;

// 轨道系统，每个元素表示一个轨道上最后一个弹幕的右边缘位置
// 初始值都是0，表示轨道空闲
const trackSystem: number[] = Array(TRACK_COUNT).fill(0);

export const DanmakuContainer: FC<DanmakuContainerProps> = ({ translation, isActive }) => {
  const [danmakus, setDanmakus] = useState<DanmakuItem[]>([]);
  const lastTranslationRef = useRef<string>('');
  const processingRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationsInProgressRef = useRef<Set<number>>(new Set());

  // 保存上次显示的翻译，即使translation为空也能显示上次的内容
  const [lastValidTranslation, setLastValidTranslation] = useState<string>('');

  // 当有新的有效翻译时，更新lastValidTranslation
  useEffect(() => {
    if (translation && translation.trim() !== '') {
      setLastValidTranslation(translation);
    }
  }, [translation]);

  // 获取可用轨道
  const getAvailableTrack = (): number => {
    // 1. 找出最空闲的轨道（右边缘位置最小的轨道）
    let minEdge = Number.MAX_SAFE_INTEGER;
    let bestTrack = 0;

    // 轨道0是最上面的，轨道TRACK_COUNT-1是最下面的
    for (let i = 0; i < TRACK_COUNT; i++) {
      if (trackSystem[i] < minEdge) {
        minEdge = trackSystem[i];
        bestTrack = i;
      }
    }

    // 如果所有轨道都有弹幕且右边缘都很靠右，则选择随机轨道
    if (minEdge > 80) { // 80%的位置
      return Math.floor(Math.random() * TRACK_COUNT);
    }

    return bestTrack;
  };

  // 计算轨道的垂直位置（转为top百分比）
  const getTrackPosition = (track: number): number => {
    return TRACK_START + (track * (TRACK_HEIGHT + TRACK_MARGIN));
  };

  // 更新轨道系统
  const updateTrackSystem = (track: number, rightEdge: number) => {
    trackSystem[track] = rightEdge;
  };

  // 当弹幕移出时，更新轨道系统状态
  const clearTrack = (track: number) => {
    trackSystem[track] = 0;
  };

  // 清理轨道系统，移除已完成的弹幕占位
  const cleanupTrackSystem = () => {
    // 获取当前所有在轨道上的弹幕
    const activeTracks = new Set(danmakus.map(d => d.track));

    // 清理没有弹幕的轨道
    for (let i = 0; i < TRACK_COUNT; i++) {
      if (!activeTracks.has(i)) {
        trackSystem[i] = 0;
      }
    }
  };

  // 当有新翻译时，添加新弹幕
  useEffect(() => {
    // 使用lastValidTranslation替代translation，确保始终有内容可显示
    const displayTranslation = translation || lastValidTranslation;

    if (!displayTranslation || !isActive || processingRef.current) return;
    if (displayTranslation === lastTranslationRef.current) return; // 避免重复弹幕

    lastTranslationRef.current = displayTranslation;

    try {
      // 分割弹幕文本
      const danmakuTexts = displayTranslation.split('||').map(text => text.trim()).filter(Boolean);

      // 如果只有一条弹幕，直接显示
      if (danmakuTexts.length === 1) {
        addDanmaku(danmakuTexts[0]);
        return;
      }

      // 如果有多条弹幕，依次显示
      processingRef.current = true;

      // 创建一个显示弹幕的函数
      const showDanmakusSequentially = (texts: string[], index = 0) => {
        if (index >= texts.length) {
          processingRef.current = false;
          return;
        }

        // 添加当前弹幕
        addDanmaku(texts[index]);

        // 等待一秒后显示下一条
        setTimeout(() => {
          showDanmakusSequentially(texts, index + 1);
        }, DANMAKU_INTERVAL);
      };

      // 开始顺序显示弹幕
      showDanmakusSequentially(danmakuTexts);

    } catch (error) {
      console.error('Failed to process danmakus:', error);
      processingRef.current = false;
    }
  }, [translation, lastValidTranslation, isActive]);

  // 定期清理轨道系统
  useEffect(() => {
    const interval = setInterval(() => {
      cleanupTrackSystem();
    }, 2000); // 每2秒清理一次

    return () => clearInterval(interval);
  }, [danmakus]);

  // 移除已完成的弹幕
  const handleDanmakuComplete = (id: number, track: number) => {
    // 清理轨道占用
    clearTrack(track);

    // 确保弹幕确实已完成动画，从集合中移除
    animationsInProgressRef.current.delete(id);

    setDanmakus(prev => prev.filter(item => item.id !== id));
  };

  // 添加单条弹幕的函数
  const addDanmaku = (text: string) => {
    if (!text) return;

    // 获取可用轨道
    const track = getAvailableTrack();

    // 计算轨道对应的垂直位置
    const top = getTrackPosition(track);

    const newDanmaku: DanmakuItem = {
      id: ++lastDanmakuId,
      text: enhanceText(text),
      top,
      track,
      rightEdge: 100, // 初始位置在最右侧
    };

    // 更新轨道系统
    updateTrackSystem(track, 100);

    // 将新弹幕ID添加到正在进行动画的集合中
    animationsInProgressRef.current.add(newDanmaku.id);

    setDanmakus(prev => {
      // 限制最大弹幕数量
      const newDanmakus = [...prev, newDanmaku];

      if (newDanmakus.length > MAX_DANMAKUS) {
        // 找到第一个不在动画中的弹幕
        const indexToRemove = newDanmakus.findIndex(
          item => !animationsInProgressRef.current.has(item.id)
        );

        // 如果找到了已完成动画的弹幕，移除它
        if (indexToRemove !== -1) {
          return [
            ...newDanmakus.slice(0, indexToRemove),
            ...newDanmakus.slice(indexToRemove + 1)
          ];
        }

        // 如果所有弹幕都在动画中，移除最旧的一个
        return newDanmakus.slice(1);
      }

      return newDanmakus;
    });
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: 'transparent',
        zIndex: 1000
      }}
    >
      {danmakus.map(danmaku => (
        <DanmakuTranslation
          key={danmaku.id}
          text={danmaku.text}
          onComplete={() => handleDanmakuComplete(danmaku.id, danmaku.track)}
          onPositionUpdate={(position) => {
            // 更新弹幕在轨道上的位置信息
            updateTrackSystem(danmaku.track, position);
          }}
          style={{ top: `${danmaku.top}%` }}
        />
      ))}
    </div>
  );
}; 