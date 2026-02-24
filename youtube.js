// youtube.js — YouTube IFrame Audio Engine
// Hidden 1x1 player. Audio only, no video visible.

const YTAudio = (() => {
  let player    = null;
  let ready     = false;
  let pending   = null;
  let currentId = null;
  let playing   = false;
  let onChange  = null;

  function init() {
    // Build hidden container
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;bottom:0;right:0;width:1px;height:1px;overflow:hidden;opacity:0.001;pointer-events:none;z-index:-999;';
    const div = document.createElement('div');
    div.id = 'yt-player';
    wrap.appendChild(div);
    document.body.appendChild(wrap);

    // Inject YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }

  // YouTube calls this when API is ready
  window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player('yt-player', {
      width:  '1',
      height: '1',
      playerVars: {
        autoplay:        1,
        controls:        0,
        disablekb:       1,
        fs:              0,
        iv_load_policy:  3,
        modestbranding:  1,
        rel:             0,
        playsinline:     1,
        // CRITICAL: origin must match your GitHub Pages URL
        // This fixes the postMessage error
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
          // Error 150 = embedding disabled for this video
          // Error 100 = video not found
          // Error 101 = owner does not allow embedding
          console.warn('[YTAudio] YouTube error code:', e.data,
            e.data === 150 || e.data === 101
              ? '— this video does not allow embedding, skipping'
              : ''
          );
          playing = false;
          currentId = null;
          _fire();
        },
      },
    });
  };

  function _load(id) {
    currentId = id;
    player.loadVideoById({ videoId: id, suggestedQuality: 'small' });
  }

  function _fire() {
    if (onChange) onChange({ playing, id: currentId });
  }

  function play(id) {
    if (!id) return;
    if (!player || !ready) { pending = id; return; }
    _load(id);
  }

  function pause()  { if (player && ready) player.pauseVideo(); }
  function resume() { if (player && ready) player.playVideo();  }
  function stop()   {
    if (player && ready) player.stopVideo();
    playing = false; currentId = null; _fire();
  }

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
