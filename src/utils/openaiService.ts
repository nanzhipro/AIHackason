// 速率限制 - 设置最小请求间隔为1500毫秒
const MIN_REQUEST_INTERVAL = 1500;
let lastRequestTime: number | null = null;

// 添加翻译缓存
const translationCache: Map<string, string> = new Map();

// 弹幕风格提示词
export const DANMAKU_STYLES = {
  FUNNY: '你是一个弹幕生成助手. 你将根据视频内容生成搞笑风格的弹幕. 弹幕要诙谐幽默，带有夸张效果，善用网络流行语。一次生成3条弹幕，使用||分割，控制在 10 个字以内',
  ACADEMIC: '你是一个弹幕生成助手. 你将根据视频内容生成学术风格的弹幕. 弹幕应该使用学术性、专业性词汇，像一位学者或教授点评视频内容。一次生成3条弹幕，使用||分割，控制在 10 个字以内',
  MEME: '你是一个弹幕生成助手. 你将根据视频内容生成网络梗风格的弹幕. 弹幕要充满时下最流行的网络用语和梗，追求潮流感和共鸣度。一次生成3条弹幕，使用||分割，控制在 10 个字以内',
  MOVIE: '你是一个弹幕生成助手. 你将根据视频内容生成电影风格的弹幕. 弹幕要模仿经典电影台词和场景，带有戏剧性和电影感。一次生成3条弹幕，使用||分割，控制在 10 个字以内',
  DUSHE: '根据输入的文本，用简短又桀骜不驯的话术回复我，控制在 10 个字以内。'
};

// 当前选择的弹幕风格
let currentDanmakuStyle = DANMAKU_STYLES.FUNNY;
// 当前选择的风格标识
let currentStyleKey: keyof typeof DANMAKU_STYLES = 'FUNNY';

// 风格切换事件订阅者
const styleChangeListeners: Array<(styleKey: keyof typeof DANMAKU_STYLES) => void> = [];

// 设置弹幕风格
export function setDanmakuStyle(styleKey: keyof typeof DANMAKU_STYLES) {
  if (!DANMAKU_STYLES[styleKey]) {
    console.error(`无效的风格键: ${styleKey}`);
    return;
  }
  
  // 记录之前的风格
  const previousStyle = currentStyleKey;
  
  // 更新当前风格
  currentDanmakuStyle = DANMAKU_STYLES[styleKey];
  currentStyleKey = styleKey;
  
  // 只有当风格真正变化时才清空缓存
  if (previousStyle !== styleKey) {
    console.log(`弹幕风格从 ${previousStyle} 更改为 ${styleKey}，清空翻译缓存`);
    translationCache.clear();
    
    // 通知所有监听器
    styleChangeListeners.forEach(listener => {
      try {
        listener(styleKey);
      } catch (error) {
        console.error('风格变更监听器执行失败:', error);
      }
    });
  }
}

// 获取当前风格
export function getCurrentStyleKey(): keyof typeof DANMAKU_STYLES {
  return currentStyleKey;
}

// 添加风格变更监听器
export function addStyleChangeListener(listener: (styleKey: keyof typeof DANMAKU_STYLES) => void) {
  styleChangeListeners.push(listener);
  return () => {
    // 返回取消监听的函数
    const index = styleChangeListeners.indexOf(listener);
    if (index > -1) {
      styleChangeListeners.splice(index, 1);
    }
  };
}

/**
 * 直接调用DeepSeek API进行翻译
 * @param text 要翻译的文本
 */
async function callDeepSeekAPI(text: string): Promise<string> {
  try {
    // 创建AbortController用于请求超时
    const controller = new AbortController();
    // const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    console.log(`使用 ${currentStyleKey} 风格生成弹幕`);
    
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-746c180cbc74426b841779e3497dff91'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { 
            role: 'system', 
            content: currentDanmakuStyle // 使用当前选择的风格
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.2
      }),
      signal: controller.signal
    });
    
    // 清除超时定时器
    // clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('API response not OK:', response.status, response.statusText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices.length) {
      console.error('Invalid API response format:', data);
      return '翻译出错：无效的API响应';
    }
    
    const result = data.choices[0]?.message?.content?.trim() || '';
    
    // 将结果添加到缓存中
    translationCache.set(text, result);
    
    return result;
  } catch (error) {
    // 处理不同类型的错误
    if (error.name === 'AbortError') {
      console.error('Translation request timed out');
      return '翻译出错：请求超时';
    } else if (error instanceof TypeError && error.message.includes('NetworkError')) {
      console.error('Network error:', error);
      return '翻译出错：网络异常';
    } else {
      console.error('Translation API error:', error);
      return '翻译出错';
    }
  }
}

/**
 * 翻译字幕并返回结果
 * @param text 要翻译的文本
 * @returns 翻译后的文本
 */
export async function translateSubtitle(text: string): Promise<string> {
  if (!text || text.trim() === '') {
    return '';
  }

  // 检查缓存中是否已有翻译
  if (translationCache.has(text)) {
    console.log('Using cached translation');
    return translationCache.get(text) || '';
  }

  // 检查请求频率限制
  const now = Date.now();
  if (lastRequestTime && now - lastRequestTime < MIN_REQUEST_INTERVAL) {
    console.log('Rate limiting translation request');
    return '';  // 返回空字符串表示当前不翻译
  }
  lastRequestTime = now;

  try {
    // 调用API获取翻译并返回结果
    const translation = await callDeepSeekAPI(text);
    return translation;
  } catch (error) {
    console.error('Translation failed:', error);
    return '翻译服务暂时不可用';
  }
} 