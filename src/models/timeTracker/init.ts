import React from 'react';
import { createRoot } from 'react-dom/client';
import TimeDisplay from '@src/components/TimeDisplay';
import videoTimeTracker from '@src/utils/videoTimeTracker';

// 创建用于渲染组件的容器
const createContainer = (): HTMLElement => {
  const container = document.createElement('div');
  container.id = 'es-time-display-container';
  document.body.appendChild(container);
  return container;
};

// 初始化时间追踪器和显示组件
export const initTimeTracker = (): void => {
  try {
    console.log('Initializing video time tracker...');
    
    // 启动时间追踪器
    videoTimeTracker.start();
    
    // 确保只创建一次容器
    let container = document.getElementById('es-time-display-container');
    
    if (!container) {
      container = createContainer();
    }
    
    // 使用React 18的createRoot API渲染时间显示组件
    const root = createRoot(container);
    root.render(React.createElement(TimeDisplay));
    
    console.log('Video time tracker initialized.');
  } catch (error) {
    console.error('Failed to initialize video time tracker:', error);
  }
};

// 提供一个销毁函数，以便在需要时清理资源
export const destroyTimeTracker = (): void => {
  try {
    // 停止时间追踪器
    videoTimeTracker.stop();
    
    // 移除组件容器
    const container = document.getElementById('es-time-display-container');
    if (container) {
      // React 18中不再使用unmountComponentAtNode，使用createRoot创建的root有自己的unmount方法
      // 但由于我们无法保存root引用，简单的做法是直接移除DOM元素
      container.remove();
    }
    
    console.log('Video time tracker destroyed.');
  } catch (error) {
    console.error('Failed to destroy video time tracker:', error);
  }
}; 