import { useState, useEffect } from "react";
import { CSSProperties } from "react";

function castTarget(target) {
  return typeof target === "object"
    ? target
    : {
        tabId: target,
        frameId: 0,
      };
}

async function getTab() {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tabs[0];
}

// 风格选项
const STYLE_OPTIONS = [
  { key: "FUNNY", label: "搞笑" },
  { key: "ACADEMIC", label: "学术风" },
  { key: "MEME", label: "网络梗" },
  { key: "MOVIE", label: "影视陪伴" },
];

// 弹幕风格菜单的样式
const styleMenuStyle: CSSProperties = {
  position: 'absolute' as const,
  background: '#fff',
  border: '1px solid #ccc',
  borderRadius: '4px',
  padding: '8px 0',
  zIndex: 1000,
  boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
  width: '120px',
  left: '100px',
};

const styleOptionStyle: CSSProperties = {
  padding: '8px 16px',
  cursor: 'pointer',
  fontSize: '14px',
  color: '#000', // 黑色文字
  fontWeight: 'bold', // 粗体显示
  transition: 'background-color 0.2s',
};

const styleOptionHoverStyle: CSSProperties = {
  background: '#f0f0f0',
};

const selectedStyleOptionStyle: CSSProperties = {
  background: '#e6f7ff',
  borderLeft: '3px solid #1890ff',
};

const Popup = () => {
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const [currentStyle, setCurrentStyle] = useState<string>("FUNNY"); // 默认风格
  
  // 在组件加载时获取当前设置的风格
  useEffect(() => {
    chrome.storage.sync.get("danmakuStyle", (result) => {
      if (result.danmakuStyle) {
        setCurrentStyle(result.danmakuStyle);
      }
    });
  }, []);
  
  const handleRequestPermissions = async () => {
    const tab = await getTab();
    const isGranted = await chrome.permissions.request({
      permissions: ["scripting", "storage", "activeTab"],
      origins: [tab.url],
    });
    if (isGranted) {
      chrome.tabs.reload(tab.id);
    }
  };

  const handleFaqLinkClick = () => {
    const faqUrl = "https://easysubs.cc/en/faq/";
    chrome.tabs.create({ url: faqUrl });
  };
  
  const handleStyleClick = () => {
    setShowStyleMenu(!showStyleMenu);
  };
  
  const selectStyle = async (styleKey) => {
    // 保存用户选择到storage
    await chrome.storage.sync.set({ danmakuStyle: styleKey });
    
    // 更新当前选中的风格
    setCurrentStyle(styleKey);
    
    // 发送消息到content script更新风格
    const tab = await getTab();
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: "setDanmakuStyle", styleKey });
    }
    
    // 关闭风格菜单
    setShowStyleMenu(false);
  };

  // 获取当前选中风格的标签
  const getCurrentStyleLabel = () => {
    const option = STYLE_OPTIONS.find(opt => opt.key === currentStyle);
    return option ? option.label : '搞笑'; // 默认为搞笑
  };

  return (
    <div className="content">
      <div className="header">Easysubs</div>
      <menu>
        <li>
          <a target="_blank" href="https://easysubs.cc" rel="noreferrer">
            Home
          </a>
        </li>
        <li onClick={handleRequestPermissions}>
          <a className="es-popup-kinopub">Enable on Kinopub</a>
        </li>
        <li onClick={handleStyleClick}>
          <a className="es-style-settings">弹幕风格 ({getCurrentStyleLabel()})</a>
          {showStyleMenu && (
            <div style={styleMenuStyle}>
              {STYLE_OPTIONS.map((option) => (
                <div 
                  key={option.key} 
                  style={{
                    ...styleOptionStyle,
                    ...(hoveredOption === option.key ? styleOptionHoverStyle : {}),
                    ...(currentStyle === option.key ? selectedStyleOptionStyle : {})
                  }}
                  onClick={() => selectStyle(option.key)}
                  onMouseEnter={() => setHoveredOption(option.key)}
                  onMouseLeave={() => setHoveredOption(null)}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </li>
        <li onClick={handleFaqLinkClick}>
          <a>FAQ</a>
        </li>
        <li>
          <a target="_blank" href="https://github.com/Nitrino/easysubs" rel="noreferrer">
            Github
          </a>
        </li>
        <li>
          <a target="_blank" href="https://github.com/Nitrino/easysubs/issues" rel="noreferrer">
            Report bugs
          </a>
        </li>
        <li>
          <a target="_blank" href="https://github.com/Nitrino/easysubs/issues" rel="noreferrer">
            Suggest features
          </a>
        </li>
        <li>
          <a target="_blank" href="https://t.me/easysubs_ext" rel="noreferrer">
            Support chat
          </a>
        </li>
      </menu>
    </div>
  );
};

export default Popup;
