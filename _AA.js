(() => {
const MEDIA_URL = "https://raw.githubusercontent.com/umaimann/Bad_Apple_mp4/refs/heads/main/%E3%80%90%E6%9D%B1%E6%96%B9%E3%80%91Bad%20Apple!!%20%EF%BC%B0%EF%BC%B6%E3%80%90%E5%BD%B1%E7%B5%B5%E3%80%91%20-%20kasidid2%20(360p,%20h264).mp4";

const W = 480, H = 270;
const ASCII = "▒░@%#*+=-:;,.`'`^~·•";
const LUM = (r,g,b) => .2126*r + .7152*g + .0722*b;

let state = "start", raf = null;
let lastT = 0;
const FPS = 60;
const INTERVAL = 100 / FPS;

const pre = Object.assign(document.createElement("pre"), {
  style: [
    "position:fixed !important",
    "top:50% !important",
    "left:50% !important",
    "transform:translate(-50%,-50%) !important",
    "background:#fff !important",
    "color:#000 !important",
    "font-family:monospace !important",
    "font-size:2px !important",
    "line-height:0.5em !important",
    "padding:0 !important",
    "margin:0 !important",
    "user-select:none !important",
    "cursor:pointer !important",
    "z-index:2147483647 !important",
    "white-space:pre !important",
    "overflow:hidden !important"
  ].join(";")
});
document.body.append(pre);

const mid = H>>1, w8 = " ".repeat(W);
function label(t){
  let o="",p=(W-t.length)>>1, r=W-p-t.length;
  for(let y=H;~y;y--)o+=y===mid?" ".repeat(p)+t+" ".repeat(r)+"\n":w8+"\n";
  pre.textContent=o;
}
label("###  START  ###");

let ctx = null;
function getCtx(){
  return ctx || (ctx = new AudioContext());
}
function loadBlob(url){
  return new Promise((resolve, reject) => {
    if(typeof GM_xmlhttpRequest === "function"){
      GM_xmlhttpRequest({
        method: "GET",
        url,
        responseType: "blob",
        onload: r => (r.status >= 200 && r.status < 300)
          ? resolve(r.response)
          : reject(new Error("HTTP " + r.status)),
        onerror: reject,
        ontimeout: reject
      });
    }else{
      fetch(url).then(r => {
        if(!r.ok) throw new Error("HTTP " + r.status);
        return r.blob();
      }).then(resolve, reject);
    }
  });
}

function startAudio(f){
  const a = new Audio(URL.createObjectURL(f));
  a.volume = 1;

  const ac = getCtx();
  const an = ac.createAnalyser();

  an.fftSize = 1024;
  an.smoothingTimeConstant = 0.75;

  const fr = new Uint8Array(an.frequencyBinCount);

  const src = ac.createMediaElementSource(a);
  src.connect(an);
  an.connect(ac.destination);

  a.play();

  function loop(t){
    if(t - lastT < INTERVAL){
      raf = requestAnimationFrame(loop);
      return;
    }

    lastT = t;

    an.getByteFrequencyData(fr);

    let o = "";
    const chars = "@%#*+=-:. ";

    for(let y = 0; y < H; y++){
      for(let x = 0; x < W; x++){
        const v = fr[Math.floor(x / W * fr.length)] / 255;
        const level = v * H;
        if(H - y < level){
          const c = chars[Math.floor(v * (chars.length-1))];
          o += c;
        }else{
          o += " ";
        }
      }
      o += "\n";
    }

    pre.textContent=o;
    raf=requestAnimationFrame(loop);
  }

  raf=requestAnimationFrame(loop);
}

function startVideo(f){
  const v = Object.assign(document.createElement("video"), {src:URL.createObjectURL(f), volume:1, playsInline:true, style:"display:none"});
  document.body.append(v);
  const ca = document.createElement("canvas"), cx = ca.getContext("2d");
  const A = ASCII, Al = A.length - 1;
  v.onplay=function loop(t){
    if(v.paused||v.ended)return;
    if(!v.videoWidth)return raf=requestAnimationFrame(loop);
    if(t - lastT < INTERVAL){ raf=requestAnimationFrame(loop); return; }
    lastT = t;
    const s = v.videoWidth / W, h = (v.videoHeight / s) | 0;
    ca.width = W; ca.height = h;
    cx.drawImage(v, 0, 0, W, h);
    const d = cx.getImageData(0, 0, W, h).data;
    const arr = new Array(h * (W + 1));
    let idx = 0, i = 0;
    for(let y = 0; y < h; y++){
      for(let x = 0; x < W; x++, i += 4){
        arr[idx++] = A[(LUM(d[i], d[i+1], d[i+2]) / 255 * Al) | 0];
      }
      arr[idx++] = "\n";
    }
    pre.textContent = arr.join("");
    raf = requestAnimationFrame(loop);
  };
  v.play();
}

pre.onclick = async ()=>{
  if(state !== "start") return;
  state = "loading";
  label("###  LOADING...  ###");
  try{
    const ac = getCtx();
    await ac.resume();
    const blob = await loadBlob(MEDIA_URL);
    const isAudio = (blob.type || "").startsWith("audio/")
      || /\.(mp3|wav|ogg|m4a|aac|flac|opus)(\?|#|$)/i.test(MEDIA_URL);
    state = "play"; pre.style.cursor = "default";
    isAudio ? startAudio(blob) : startVideo(blob);
  }catch(e){
    console.error(e);
    state = "start";
    label("###  ERROR (click to retry)  ###");
  }
};
console.log("AA START → PLAY ready.");
})();
