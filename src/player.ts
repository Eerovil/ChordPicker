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
}


const loadPlayer = async (scoreXml: string, autoplay: boolean) => {
  // Play only
  if (!document) {
    return;
  }
  let el = document.getElementById("score-hidden");
  if (!el) {
    return;
  }
  el.innerHTML = "";
  if (!(window as any).playerOSMD) {
    (window as any).playerOSMD = new OpenSheetMusicDisplay(el);
  }
  const osmd = (window as any).playerOSMD
  if ((window as any).audioPlayer) {
    (window as any).audioPlayer.stop();
    delete (window as any).audioPlayer;
  }
  (window as any).audioPlayer = new AudioPlayer();
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
  let el = document.getElementById("btn-play");
  if (el) {
    el.addEventListener("click", () => {
      if (audioPlayer.state === "STOPPED" || audioPlayer.state === "PAUSED") {
        audioPlayer.play();
      }
    });
  }
  el = document.getElementById("btn-pause");
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