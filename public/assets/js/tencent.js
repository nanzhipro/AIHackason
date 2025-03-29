window.setInterval(() => {
  const player = document.querySelector('.txp_video_container') || 
                document.querySelector('.tenvideo_player') ||
                document.querySelector('#player-container');
  const subsToggleElement = document.querySelector('.txp_icon_subtitle') || 
                           document.querySelector('[data-role="subtitle-btn"]');

  if (player) {
    if (!window.isLoaded) {
      window.isLoaded = true;
      window.dispatchEvent(new CustomEvent("esTencentLoaded"));

      if (subsToggleElement && subsToggleElement.classList.contains('txp_icon_subtitle_on')) {
        // 检测到开启了字幕
        window.subtitlesEnabled = true;
      } else {
        window.dispatchEvent(new CustomEvent("esTencentCaptionsChanged", { detail: "" }));
      }
    }
  } else {
    window.isLoaded = false;
  }

  if (subsToggleElement) {
    const isSubtitleOn = subsToggleElement.classList.contains('txp_icon_subtitle_on');
    
    if (window.subtitlesEnabled && !isSubtitleOn) {
      window.subtitlesEnabled = false;
      window.dispatchEvent(new CustomEvent("esTencentCaptionsChanged", { detail: "" }));
    }
  }
}, 500);

// 拦截字幕请求
((open) => {
  XMLHttpRequest.prototype.open = function (method, url) {
    if (url && typeof url === 'string' && url.match(/^http/g) !== null) {
      try {
        const urlObject = new URL(url);
        // 腾讯视频的字幕API通常包含subtitle或caption字样
        if (urlObject.pathname.includes('subtitle') || 
            urlObject.pathname.includes('caption') || 
            urlObject.search.includes('subtitle') || 
            urlObject.search.includes('caption')) {
          window.subtitlesEnabled = true;
          
          // 提取语言信息
          let lang = '';
          try {
            // 尝试从URL获取语言信息
            if (urlObject.searchParams.has('lang')) {
              lang = urlObject.searchParams.get('lang') || '';
            } else if (urlObject.pathname.includes('zh')) {
              lang = 'zh';
            } else if (urlObject.pathname.includes('en')) {
              lang = 'en';
            } else {
              // 默认中文
              lang = 'zh';
            }
          } catch (e) {
            console.error('Error extracting lang from subtitle URL', e);
            lang = 'zh'; // 默认中文
          }

          // 获取视频ID
          let videoId = '';
          try {
            // 从页面获取vid
            const vidScript = document.querySelector('script:contains("vid")');
            if (vidScript) {
              const vidMatch = vidScript.textContent?.match(/vid\s*[:=]\s*["']([^"']+)["']/);
              if (vidMatch && vidMatch[1]) {
                videoId = vidMatch[1];
              }
            }
            
            // 如果从页面获取失败，尝试从URL中提取
            if (!videoId) {
              const vidFromUrl = window.location.href.match(/\/([a-z0-9]+)\.html/);
              if (vidFromUrl && vidFromUrl[1]) {
                videoId = vidFromUrl[1];
              }
            }
          } catch (e) {
            console.error('Error extracting video ID', e);
          }

          if (videoId && lang) {
            window.dispatchEvent(
              new CustomEvent("esTencentCaptionsData", { 
                detail: { 
                  videoId, 
                  lang, 
                  url: urlObject.href 
                } 
              })
            );
            window.dispatchEvent(
              new CustomEvent("esTencentCaptionsChanged", { detail: lang })
            );
          }
        }
      } catch (e) {
        console.error('Error processing URL in XMLHttpRequest interceptor', e);
      }
    }
    open.call(this, method, url, true);
  };
})(XMLHttpRequest.prototype.open);

// 腾讯视频还可能使用fetch API获取字幕，所以我们也要拦截fetch
const originalFetch = window.fetch;
window.fetch = async function(input, init) {
  try {
    if (typeof input === 'string' && input.match(/^http/g) !== null) {
      const url = input;
      const urlObject = new URL(url);
      
      if (urlObject.pathname.includes('subtitle') || 
          urlObject.pathname.includes('caption') || 
          urlObject.search.includes('subtitle') || 
          urlObject.search.includes('caption')) {
        window.subtitlesEnabled = true;
        
        // 提取语言信息
        let lang = '';
        try {
          if (urlObject.searchParams.has('lang')) {
            lang = urlObject.searchParams.get('lang') || '';
          } else if (urlObject.pathname.includes('zh')) {
            lang = 'zh';
          } else if (urlObject.pathname.includes('en')) {
            lang = 'en';
          } else {
            lang = 'zh'; // 默认中文
          }
        } catch (e) {
          console.error('Error extracting lang from subtitle URL in fetch', e);
          lang = 'zh';
        }

        // 获取视频ID
        let videoId = '';
        try {
          const vidScript = document.querySelector('script:contains("vid")');
          if (vidScript) {
            const vidMatch = vidScript.textContent?.match(/vid\s*[:=]\s*["']([^"']+)["']/);
            if (vidMatch && vidMatch[1]) {
              videoId = vidMatch[1];
            }
          }
          
          if (!videoId) {
            const vidFromUrl = window.location.href.match(/\/([a-z0-9]+)\.html/);
            if (vidFromUrl && vidFromUrl[1]) {
              videoId = vidFromUrl[1];
            }
          }
        } catch (e) {
          console.error('Error extracting video ID in fetch', e);
        }

        if (videoId && lang) {
          window.dispatchEvent(
            new CustomEvent("esTencentCaptionsData", { 
              detail: { 
                videoId, 
                lang, 
                url: urlObject.href 
              } 
            })
          );
          window.dispatchEvent(
            new CustomEvent("esTencentCaptionsChanged", { detail: lang })
          );
        }
      }
    }
  } catch (e) {
    console.error('Error processing URL in fetch interceptor', e);
  }
  
  return originalFetch.apply(this, arguments);
}; 