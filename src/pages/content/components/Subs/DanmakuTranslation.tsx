import { FC, useEffect, useRef, useState } from 'react';

// 随机颜色生成函数
const getRandomColor = (): string => {
  // 预定义一些适合弹幕的鲜艳颜色
  const colors = [
    '#FFFFFF', // 白色
    '#00FFFF', // 青色
    '#FFA500', // 橙色
    '#FF69B4', // 粉红色
    '#1E90FF', // 蓝色
    '#FFFF00', // 黄色
    '#7CFC00', // 亮绿色
    '#FF00FF', // 紫色
    '#FF6347', // 西红柿色
    '#00FF7F', // 绿色
    '#F0E68C', // 米色
    '#87CEFA', // 浅蓝色
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
};

// 随机字体大小生成函数
const getRandomFontSize = (): string => {
  // 基础字体大小范围：1.0em - 1.4em
  const sizes = ['1.0em', '1.1em', '1.2em', '1.3em', '1.4em'];
  return sizes[Math.floor(Math.random() * sizes.length)];
};

interface DanmakuTranslationProps {
  text: string;
  onComplete?: () => void;
  style?: React.CSSProperties;
  onPositionUpdate?: (progress: number) => void;
}

// 弹幕动画的关键帧定义
const danmakuKeyframes = `
@keyframes danmakuSlide {
  from {
    transform: translateX(100%);
    opacity: 1;
  }
  to {
    transform: translateX(-200%); /* 增加滑出距离，确保完全离开视野 */
    opacity: 1;
  }
}
`;

// 在组件外部创建动画样式元素并添加到document
let styleElement: HTMLStyleElement | null = null;

const createStyleElement = () => {
  if (typeof document === 'undefined') return;
  if (styleElement) return;
  
  try {
    styleElement = document.createElement('style');
    styleElement.innerHTML = danmakuKeyframes;
    document.head.appendChild(styleElement);
    
    // 确保样式正确加载
    setTimeout(() => {
      if (styleElement && !document.head.contains(styleElement)) {
        document.head.appendChild(styleElement);
      }
    }, 100);
  } catch (error) {
    console.error('Failed to create danmaku style:', error);
  }
};

export const DanmakuTranslation: FC<DanmakuTranslationProps> = ({ 
  text, 
  onComplete, 
  style,
  onPositionUpdate 
}) => {
  const danmakuRef = useRef<HTMLDivElement>(null);
  const [animationDuration, setAnimationDuration] = useState(10); // 默认10秒
  const [animationSupported, setAnimationSupported] = useState(true);
  const animationEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [textColor] = useState(getRandomColor); // 生成随机颜色并保持一致
  const [fontSize] = useState(getRandomFontSize); // 生成随机字体大小并保持一致
  
  // 创建动画样式
  useEffect(() => {
    try {
      createStyleElement();
    } catch (e) {
      console.error('Animation creation failed, using fallback:', e);
      setAnimationSupported(false);
    }
  }, []);
  
  // 如果动画不支持，使用简单的定时器来模拟动画效果
  useEffect(() => {
    if (animationSupported || !danmakuRef.current || !text) return;
    
    const element = danmakuRef.current;
    
    // 计算动画时长
    const textLength = text.length;
    const baseDuration = 10; // 基础持续时间10秒
    // 根据文本长度调整速度，但有最小和最大限制
    const duration = Math.max(8, Math.min(15, baseDuration + (textLength / 30))) * 1000;
    
    // 模拟动画
    let startTime = Date.now();
    let rafId: number;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 从右侧(100%)匀速移动到左侧(-200%)，不改变透明度
      const translateX = 100 - (progress * 300);
      element.style.transform = `translateX(${translateX}%)`;
      element.style.opacity = '1'; // 保持完全不透明
      
      // 向父组件报告位置
      if (onPositionUpdate) {
        onPositionUpdate(100 - progress * 300);
      }
      
      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        if (onComplete) onComplete();
      }
    };
    
    rafId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [text, onComplete, animationSupported, onPositionUpdate]);
  
  // 正常的动画结束事件监听
  useEffect(() => {
    if (!animationSupported || !danmakuRef.current || !text) return;
    
    const danmaku = danmakuRef.current;
    
    // 设置动画时长，根据文本长度和父容器宽度调整
    // 文本较长时速度适当加快，确保流畅性
    const textLength = text.length;
    const baseDuration = 10; // 基础持续时间10秒
    
    // 根据文本长度调整速度，但有最小和最大限制
    const duration = Math.max(8, Math.min(15, baseDuration + (textLength / 30)));
    setAnimationDuration(duration);
    
    // 设置定期更新位置的定时器
    if (onPositionUpdate) {
      const updateInterval = 100; // 每100ms更新一次位置
      let startTime = Date.now();
      
      progressUpdateIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / (duration * 1000), 1);
        const position = 100 - (progress * 300); // 相对位置
        
        onPositionUpdate(position);
        
        // 如果动画已经结束，清除定时器
        if (progress >= 1) {
          if (progressUpdateIntervalRef.current) {
            clearInterval(progressUpdateIntervalRef.current);
          }
        }
      }, updateInterval);
    }
    
    // 在弹幕完全离开容器后才触发移除
    // 监听动画结束事件，但不立即触发onComplete
    const handleAnimationEnd = () => {
      // 清除任何可能存在的timeout
      if (animationEndTimeoutRef.current) {
        clearTimeout(animationEndTimeoutRef.current);
      }
      
      // 清除位置更新定时器
      if (progressUpdateIntervalRef.current) {
        clearInterval(progressUpdateIntervalRef.current);
      }
      
      // 此时弹幕已经到达动画的最终位置(-200%)
      // 但我们确保它彻底离开视野后再触发移除
      if (onComplete) {
        // 给一个小延迟确保弹幕完全离开视野
        animationEndTimeoutRef.current = setTimeout(() => {
          onComplete();
        }, 100); // 100ms的缓冲时间
      }
    };
    
    danmaku.addEventListener('animationend', handleAnimationEnd);
    
    return () => {
      danmaku.removeEventListener('animationend', handleAnimationEnd);
      // 清除timeout
      if (animationEndTimeoutRef.current) {
        clearTimeout(animationEndTimeoutRef.current);
      }
      
      // 清除位置更新定时器
      if (progressUpdateIntervalRef.current) {
        clearInterval(progressUpdateIntervalRef.current);
      }
    };
  }, [text, onComplete, animationSupported, onPositionUpdate]);
  
  // 获取弹幕宽度并通知父组件
  useEffect(() => {
    if (!danmakuRef.current) return;
    
    // 使用ResizeObserver监控弹幕大小变化
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(entries => {
        for (const entry of entries) {
          const { width } = entry.contentRect;
          // 将宽度转换为相对于容器的百分比（假设弹幕容器宽度是100%）
          const parent = danmakuRef.current?.parentElement;
          if (parent && width > 0) {
            const containerWidth = parent.clientWidth;
            const widthPercent = (width / containerWidth) * 100;
            // 动态更新轨道占用信息
            if (onPositionUpdate) {
              onPositionUpdate(100 - widthPercent); // 初始化位置
            }
          }
        }
      });
      
      observer.observe(danmakuRef.current);
      
      return () => {
        observer.disconnect();
      };
    }
  }, [onPositionUpdate]);
  
  if (!text) return null;
  
  const danmakuStyle: React.CSSProperties = {
    position: 'absolute',
    right: animationSupported ? '0' : 'auto',
    color: textColor, // 使用随机生成的颜色
    fontSize: fontSize, // 使用随机生成的字体大小
    padding: '5px 12px',
    borderRadius: '6px',
    background: 'rgba(0, 0, 0, 0.6)', // 调整背景透明度为0.6
    whiteSpace: 'nowrap',
    zIndex: 9999,
    pointerEvents: 'none',
    textShadow: '1px 1px 3px rgba(0, 0, 0, 0.9)',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
    transform: animationSupported ? 'translateX(100%)' : 'translateX(100%)',
    willChange: 'transform',
    maxWidth: '90%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    opacity: 1, // 确保完全不透明
    ...style, // 合并外部传入的样式
  };
  
  // 只有当动画支持时才添加animation属性
  if (animationSupported) {
    danmakuStyle.animation = `danmakuSlide ${animationDuration}s linear forwards`;
  }
  
  return (
    <div ref={danmakuRef} style={danmakuStyle} className="danmaku-item">
      {text}
    </div>
  );
}; 