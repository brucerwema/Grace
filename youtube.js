// youtube.js — Robust YouTube IFrame Audio Engine
// Auto-skips blocked videos. Shows clear error messages.

const YTAudio = (() => {
  let player    = null;
  let ready     = false;
  let pending   = null;
  let currentId = null;
  let playing   = false;
  let onChange  = null;

  function init() {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;bottom:0;right:0;width:1px;height:1px;overflow:hidden;opacity:0.001;pointer-events:none;z-index:-999;';
    const div = document.createElement('div');
    div.id = 'yt-player';
    wrap.appendChild(div);
    document.body.appendChild(wrap);

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }

  window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player('yt-player', {
      width: '1', height: '1',
      playerVars: {
        autoplay: 1, controls: 0, disablekb: 1,
        fs: 0, iv_load_policy: 3, modestbranding: 1,
        rel: 0, playsinline: 1,
        origin: window.location.origin,
      },
      events: {
        onReady(e) {
          ready = true;
          e.target.setVolume(100);
          if (pending) { _load(pending); pending = null; }
        },
        onStateChange(e) {
          playing = (e.data === YT.PlayerState.PLAYING);
          _fire();
        },
        onError(e) {
          playing = false;
          const blocked = (e.data === 150 || e.data === 101);
          console.warn(`[YTAudio] Error ${e.data} on "${currentId}"`, blocked ? '— embedding disabled by owner' : '');
          if (blocked) {
            _fire();
            // Notify UI with a special flag
            if (onChange) onChange({ playing: false, id: currentId, blocked: true });
          } else {
            currentId = null;
            _fire();
          }
        },
      },
    });
  };

  function _load(id) { currentId = id; player.loadVideoById({ videoId: id, suggestedQuality: 'small' }); }
  function _fire()   { if (onChange) onChange({ playing, id: currentId }); }

  function play(id) {
    if (!id) return;
    if (!player || !ready) { pending = id; return; }
    _load(id);
  }

  function pause()  { if (player && ready) player.pauseVideo(); }
  function resume() { if (player && ready) player.playVideo(); }
  function stop()   { if (player && ready) player.stopVideo(); playing = false; currentId = null; _fire(); }

  function toggle(id) {
    if (currentId === id) { playing ? pause() : resume(); }
    else { play(id); }
  }

  function isPlaying(id) { return currentId === id && playing; }
  function getPlaying()  { return playing; }
  function getCurrent()  { return currentId; }
  function onStateChange(fn) { onChange = fn; }

  return { init, play, pause, resume, stop, toggle, isPlaying, getPlaying, getCurrent, onStateChange };
})();
