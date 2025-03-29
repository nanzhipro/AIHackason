import KinoPub from "@src/streamings/kinopub";
import Youtube from "@src/streamings/youtube";
import Coursera from "@src/streamings/coursera";
import Netflix from "@src/streamings/netflix";
import NetflixOnFlight from "@src/streamings/netflixOnFlight";
import Service from "@src/streamings/service";
import ServiceStub from "@src/streamings/serviceStub";
import Plex from "@src/streamings/plex";
import Udemy from "@src/streamings/udemy";
import Kinopoisk from "@src/streamings/kinopoisk";
import Amazon from "@src/streamings/amazon";
import Inoriginal from "@src/streamings/inoriginal";
import Bilibili from "@src/streamings/bilibili";
import Tencent from "@src/streamings/tencent";

export const getCurrentService = (): Service => {
  try {
    const titleContent = document.querySelector("title")?.textContent || "";
    const hostname = window.location.hostname || window.location.host || "";
    const url = window.location.href || "";
    
    // YouTube
    if (
      titleContent.includes("YouTube") || 
      hostname === "www.youtube.com" || 
      hostname === "youtube.com" ||
      hostname.includes("youtu.be")
    ) {
      document.querySelector("html")?.setAttribute("id", "youtube");
      return new Youtube();
    }
    
    // Bilibili
    if (
      titleContent.includes("哔哩哔哩") || 
      titleContent.includes("bilibili") || 
      hostname === "www.bilibili.com" || 
      hostname === "bilibili.com" ||
      hostname.includes("bilibili")
    ) {
      document.querySelector("html")?.setAttribute("id", "bilibili");
      return new Bilibili();
    }
    
    // 腾讯视频
    if (
      titleContent.includes("腾讯视频") || 
      titleContent.includes("Tencent Video") || 
      hostname === "v.qq.com" || 
      hostname.includes("qq.com") && url.includes("v.qq.com") ||
      hostname.includes("video.qq.com")
    ) {
      document.querySelector("html")?.setAttribute("id", "tencent");
      return new Tencent();
    }
    
    // Netflix
    if (
      titleContent.includes("Netflix") || 
      hostname === "www.netflix.com" || 
      hostname === "netflix.com" ||
      hostname.includes("netflix")
    ) {
      document.querySelector("html")?.setAttribute("id", "netflix");
      if (document.body.classList.contains("es-netflix-on-flight")) {
        return new NetflixOnFlight();
      } else {
        return new Netflix();
      }
    }
    
    // Plex
    if (
      hostname === "app.plex.tv" || 
      hostname.includes("plex") || 
      document.querySelector("body div")?.id === "plex" ||
      titleContent.includes("Plex")
    ) {
      document.querySelector("html")?.setAttribute("id", "plex");
      return new Plex();
    }

    // Udemy
    if (
      hostname === "www.udemy.com" || 
      hostname.includes("udemy") || 
      titleContent.includes("Udemy")
    ) {
      document.querySelector("html")?.setAttribute("id", "udemy");
      return new Udemy();
    }
    
    // Kinopoisk
    if (
      hostname === "hd.kinopoisk.ru" || 
      hostname.includes("kinopoisk")
    ) {
      document.querySelector("html")?.setAttribute("id", "kinopoisk");
      return new Kinopoisk();
    }
    
    // KinoPub
    if (
      titleContent.includes("Кинопаб") ||
      document.querySelector('meta[content="Кинопаб"]') != null ||
      hostname === "moviesjoy.is" ||
      hostname.includes("kinopub") ||
      hostname.includes("kino.pub")
    ) {
      document.querySelector("html")?.setAttribute("id", "kinopub");
      return new KinoPub();
    }
    
    // Coursera
    if (
      titleContent.includes("Coursera") || 
      hostname === "www.coursera.org" ||
      hostname.includes("coursera")
    ) {
      document.querySelector("html")?.setAttribute("id", "coursera");
      return new Coursera();
    }

    // Inoriginal
    if (
      hostname === "inoriginal.online" ||
      hostname.includes("inoriginal")
    ) {
      document.querySelector("html")?.setAttribute("id", "inoriginal");
      return new Inoriginal();
    }
    
    // Amazon Prime Video
    if (
      titleContent.includes("Prime Video") ||
      hostname.includes("amazon") ||
      hostname.includes("primevideo") ||
      hostname.includes("prime.video")
    ) {
      document.querySelector("html")?.setAttribute("id", "amazon");
      return new Amazon();
    }

    console.log("No streaming service detected for:", { 
      title: titleContent, 
      hostname: hostname, 
      url: url 
    });
    
    return new ServiceStub();
  } catch (error) {
    console.error("Error detecting streaming service:", error);
    return new ServiceStub();
  }
};
