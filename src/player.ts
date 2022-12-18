import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import AudioPlayer from "osmd-audio-player";


export const renderMusic = async (scoreXml: string) => {
  // Render only
  if (!document) {
    return;
  }
  if (!scoreXml) {
    return;
  }
  (window as any).scoreXML = scoreXml;
  let el = document.getElementById("score");
  if (!el) {
    return;
  }
  el.innerHTML = "";
  if (!(window as any).renderOSMD) {
    (window as any).renderOSMD = new OpenSheetMusicDisplay(el);
  }
  const osmd = (window as any).renderOSMD
  await osmd.load(scoreXml);
  osmd.render();
  registedInitButton();
}


const registedInitButton = () => {
  let el = document.getElementById("btn-play");
  if (el) {
    el.addEventListener("click", () => {
        loadPlayer((window as any).scoreXML, true);
    });
  }
}


const loadPlayer = async (scoreXml: string, autoplay: boolean) => {
  // Play only
  if (!document) {
    return;
  }
  let el = document.getElementById("score");
  if (!el) {
    return;
  }
  el.innerHTML = "";
  if (!(window as any).renderOSMD) {
    (window as any).renderOSMD = new OpenSheetMusicDisplay(el);
  }
  const osmd = (window as any).renderOSMD
  if (!(window as any).audioPlayer) {
    (window as any).audioPlayer = new AudioPlayer();
  }
  const audioPlayer = (window as any).audioPlayer;
  audioPlayer.playbackSettings.masterVolume = 40;

  await osmd.load(scoreXml);
  await osmd.render();
  await audioPlayer.loadScore(osmd as any);
  audioPlayer.stop();

  registerButtonEvents(audioPlayer);
  setTimeout(() => {
    if (audioPlayer.state === "STOPPED" && autoplay) {
      audioPlayer.play();
    }
  }, 500)

  return audioPlayer;
}

function registerButtonEvents(audioPlayer: AudioPlayer) {
  if (!document) {
    return;
  }
  let el = document.getElementById("btn-pause");
  if (el) {
    el.addEventListener("click", () => {
      if (audioPlayer.state === "PLAYING") {
        audioPlayer.pause();
      }
    });
  }
  el = document.getElementById("btn-stop");
  if (el) {
    el.addEventListener("click", () => {
      if (audioPlayer.state === "PLAYING" || audioPlayer.state === "PAUSED") {
        audioPlayer.stop();
      }
    });
  }
}

export { loadPlayer };