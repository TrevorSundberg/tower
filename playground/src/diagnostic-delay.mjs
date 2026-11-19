// Delay presentation, not analysis or execution. A successful result can clear
// an old error immediately; only errors for the current edit may be released.
export class DiagnosticDelay {
  constructor(publish, {delayMs=10000, setTimer=(fn,ms)=>setTimeout(fn,ms), clearTimer=id=>clearTimeout(id)}={}) {
    Object.assign(this,{publish,delayMs,setTimer,clearTimer});
    this.revision=0; this.pending=new Map(); this.holding=false; this.timer=null;
  }
  reset(revision) {
    this.clearTimer(this.timer); this.timer=null;
    this.revision=revision; this.holding=false; this.pending.clear();
  }
  edit(revision) {
    this.reset(revision); this.holding=true;
    this.timer=this.setTimer(()=>this.reveal(),this.delayMs);
  }
  update(channel, value, revision) {
    if(revision!==this.revision)return;
    if(value!==null && this.holding)this.pending.set(channel,value);
    else {this.pending.delete(channel);this.publish(channel,value);}
  }
  reveal() {
    this.clearTimer(this.timer); this.timer=null; this.holding=false;
    const pending=[...this.pending]; this.pending.clear();
    for(const [channel,value] of pending)this.publish(channel,value);
  }
}
