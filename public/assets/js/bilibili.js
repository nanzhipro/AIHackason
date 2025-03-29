window.setInterval(() => {
  const player = document.querySelector('.bilibili-player-video-wrap') || 
                 document.querySelector('.bpx-player-video-wrap');
  const subsToggleElement = document.querySelector('.bilibili-player-video-subtitle-btn') || 
                           document.querySelector('.bpx-player-subtitle-btn');

  if (player) {
    if (!window.isLoaded) {
      window.isLoaded = true;
      window.dispatchEvent(new CustomEvent("esBilibiliLoaded"));

      if (subsToggleElement && subsToggleElement.classList.contains('bilibili-player-video-subtitle-btn-on') || 
          subsToggleElement && subsToggleElement.classList.contains('bpx-player-subtitle-btn-on')) {
        // 检测到开启了字幕
        // 在这种情况下，我们通常会尝试切换字幕来触发事件，但这里只记录状态
        window.subtitlesEnabled = true;
      } else {
        window.dispatchEvent(new CustomEvent("esBilibiliCaptionsChanged", { detail: "" }));
      }
    }
  } else {
    window.isLoaded = false;
  }

  if (subsToggleElement) {
    const isSubtitleOn = subsToggleElement.classList.contains('bilibili-player-video-subtitle-btn-on') || 
                          subsToggleElement.classList.contains('bpx-player-subtitle-btn-on');
    
    if (window.subtitlesEnabled && !isSubtitleOn) {
      window.subtitlesEnabled = false;
      window.dispatchEvent(new CustomEvent("esBilibiliCaptionsChanged", { detail: "" }));
    }
  }
}, 500);

// 拦截字幕请求
((open) => {
  XMLHttpRequest.prototype.open = function (method, url) {
    if (url && typeof url === 'string' && url.match(/^http/g) !== null) {
      try {
        const urlObject = new URL(url);
        // Bilibili的字幕API请求路径包含 subtitle
        if (urlObject.pathname.includes('subtitle')) {
          window.subtitlesEnabled = true;
          // 提取语言信息，bilibili的字幕通常在URL中包含lang参数
          let lang = '';
          try {
            const lastSegment = urlObject.pathname.split('/').pop();
            if (lastSegment) {
              const langMatch = lastSegment.match(/(\w{2,})/);
              if (langMatch && langMatch[1]) {
                lang = langMatch[1]; // 例如：zh-CN, en-US等
              }
            }
          } catch (e) {
            console.error('Error extracting lang from subtitle URL', e);
          }

          // 获取视频ID
          let videoId = '';
          try {
            const bvidMatch = window.location.href.match(/\/video\/(BV\w+)/);
            if (bvidMatch && bvidMatch[1]) {
              videoId = bvidMatch[1];
            } else {
              const aidMatch = window.location.href.match(/\/video\/av(\d+)/);
              if (aidMatch && aidMatch[1]) {
                videoId = `av${aidMatch[1]}`;
              }
            }
          } catch (e) {
            console.error('Error extracting video ID', e);
          }

          if (videoId && lang) {
            window.dispatchEvent(
              new CustomEvent("esBilibiliCaptionsData", { 
                detail: { 
                  videoId, 
                  lang, 
                  url: urlObject.href 
                } 
              })
            );
            window.dispatchEvent(
              new CustomEvent("esBilibiliCaptionsChanged", { detail: lang })
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