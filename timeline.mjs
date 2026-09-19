// Presentation time is independent of the algorithm's discrete iteration count.
export function createTimeline({duration=12000, steps=6, render, request=requestAnimationFrame, cancel=cancelAnimationFrame}) {
  if (!(duration>0) || !Number.isInteger(steps) || steps<1 || typeof render!=='function') throw new TypeError('Invalid timeline configuration');
  let progress=0, speed=1, playing=false, frame=null, last=null, destroyed=false;
  const emit=()=>render(progress,{playing,speed});
  function pause(){playing=false;if(frame!==null)cancel(frame);frame=null;last=null;if(!destroyed)emit();}
  function tick(now){
    frame=null;if(!playing||destroyed)return;
    if(last!==null)progress=Math.min(1,progress+Math.min(100,Math.max(0,now-last))*speed/duration);
    last=now;
    if(progress>=1){playing=false;last=null;}
    emit();if(playing&&!destroyed)frame=request(tick);
  }
  function seek(value){if(destroyed)return;if(!Number.isFinite(value))throw new TypeError('Progress must be finite');pause();progress=Math.max(0,Math.min(1,value));emit();}
  const api={
    play(){if(destroyed||playing)return;if(progress>=1)progress=0;playing=true;last=null;emit();frame=request(tick);},
    pause,
    seek,
    step(direction=1){const position=progress*steps;seek((direction>0?Math.floor(position+1e-8)+1:Math.ceil(position-1e-8)-1)/steps);},
    reset(){seek(0);},
    setSpeed(value){if(!Number.isFinite(value)||value<=0)throw new RangeError('Speed must be positive');speed=value;emit();},
    destroy(){pause();destroyed=true;},
    get state(){return {progress,playing,speed};}
  };
  emit();return api;
}
