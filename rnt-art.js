// Original face pixels only; bodies are animated canvas geometry.
const figures = {
 rnt:{name:'RNT',color:'#ef3333',skin:'#b77750',gi:'#eee5d5',head:[119,0,119,166],outline:[[.12,0],[.79,0],[.94,.13],[1,.5],[.85,.85],[.6,1],[.25,.92],[0,.6],[0,.2]]},
 tristan:{name:'Tristan',color:'#2788ff',skin:'#8f5c3d',gi:'#2466bb',head:[333,43,120,186],outline:[[.2,0],[.7,0],[.94,.1],[1,.4],[.9,.75],[.65,1],[.28,.96],[.02,.65],[0,.25]]},
 andre:{name:'Andre',color:'#ff7924',skin:'#bd815a',gi:'#c9471d',head:[565,51,207,179],outline:[[.18,.06],[.48,0],[.8,.07],[.97,.3],[1,.55],[.81,.72],[.66,.95],[.4,1],[.23,.8],[.06,.65],[0,.34]]},
 marcel:{name:'Marcel',color:'#27dc79',skin:'#e2b693',gi:'#e4e9dc',head:[840,54,107,150],outline:[[.28,.03],[.66,0],[.94,.15],[1,.55],[.83,.8],[.65,1],[.33,.98],[.06,.76],[0,.3]]},
 blaise:{name:'Blaise',color:'#b53cff',skin:'#c78e69',gi:'#372648',head:[1083,28,132,162],outline:[[.21,.06],[.56,0],[.83,.12],[.99,.3],[.94,.67],[.72,.94],[.43,1],[.16,.82],[0,.49],[.02,.22]]}
};
const poster=new Image();poster.src='rnt-roster-original.jpg';
export const artReady=()=>poster.decode();
export function fighterArt(id){return figures[id]||figures.rnt;}
export function drawRosterHead(g,id,x,y){
 const a=fighterArt(id),[sx,sy,sw,sh]=a.head;
 const h=72,w=h*sw/sh;
 g.save();g.translate(x-w/2,y-39);
 g.beginPath();a.outline.forEach(([u,v],i)=>i?g.lineTo(u*w,v*h):g.moveTo(u*w,v*h));g.closePath();g.clip();
 g.drawImage(poster,sx,sy,sw,sh,0,0,w,h);g.restore();
}

// Outfit and muscle details are sampled from the supplied poster, never generated.
const costume={
 rnt:{torso:[126,162,120,177],arm:[7,158,51,107],pants:[57,355,107,52],glove:[56,185,104,85]},
 tristan:{torso:[344,217,102,151],arm:[450,230,49,68],pants:[343,382,99,33],glove:[383,316,94,61]},
 andre:{torso:[620,224,109,131],arm:[744,280,25,71],pants:[577,379,115,35],glove:[710,233,53,61]},
 marcel:{torso:[854,212,102,149],arm:[962,212,40,63],pants:[827,379,83,35],glove:[926,337,62,57]},
 blaise:{torso:[1112,194,110,152],arm:[1047,273,48,69],pants:[1122,374,116,37],glove:[1043,198,65,70]}
};
function imagePatch(g,rect,x,y,w,h){g.drawImage(poster,...rect,x,y,w,h);}
function texturedLimb(g,rect,from,to,width,shade=0){
 const dx=to[0]-from[0],dy=to[1]-from[1],len=Math.hypot(dx,dy);
 g.save();g.translate(...from);g.rotate(Math.atan2(dy,dx)-Math.PI/2);
 g.beginPath();g.roundRect(-width/2,-width*.35,width,len+width*.7,width*.42);
 g.fillStyle='#211620';g.fill();g.strokeStyle='#211620';g.lineWidth=2;g.stroke();g.clip();
 imagePatch(g,rect,-width/2,-width*.35,width,len+width*.7);
 const light=g.createLinearGradient(-width/2,0,width/2,0);light.addColorStop(0,'#0007');light.addColorStop(.35,'#fff1');light.addColorStop(1,'#0005');g.fillStyle=light;g.fillRect(-width/2,-width,width,len+width*2);
 if(shade){g.fillStyle=`rgba(0,0,0,${shade})`;g.fillRect(-width/2,-width,width,len+width*2);}
 g.restore();
}
function glove(g,a,c,x,y,scale=1){
 g.save();g.translate(x,y);g.beginPath();g.ellipse(0,0,15*scale,12*scale,-.3,0,Math.PI*2);g.fillStyle='#151119';g.fill();g.clip();
 imagePatch(g,c.glove,-16*scale,-13*scale,32*scale,26*scale);g.restore();
}
export function drawRosterBody(g,id,S){
 const a=fighterArt(id),c=costume[id]||costume.rnt;
 const hip=-58+S.crouch*.55,hy=S.hy+S.crouch*.35,lean=S.lean*.5;
 const backKnee=[S.lb[0]*.65,(hip+S.lb[1])/2],frontKnee=[S.lf[0]*.55,(hip+S.lf[1])/2];
 const backFoot=[S.lb[0],S.lb[1]],frontFoot=[S.lf[0],S.lf[1]];
 texturedLimb(g,c.pants,[-10,hip],backKnee,29,.22);texturedLimb(g,c.pants,backKnee,backFoot,24,.22);
 texturedLimb(g,c.arm,[lean-25,hy+43],[S.ba[0],S.ba[1]],26,.18);texturedLimb(g,c.arm,[S.ba[0],S.ba[1]],[S.ba[2],S.ba[3]],23,.18);glove(g,a,c,S.ba[2],S.ba[3]);
 texturedLimb(g,c.pants,[10,hip],frontKnee,31);texturedLimb(g,c.pants,frontKnee,frontFoot,25);
 // Broad shoulders and tapered waist retain the illustrated costume rather than a flat triangle.
 const top=hy+29,bottom=hip+8;
 g.save();g.beginPath();g.moveTo(lean-35,top+9);g.quadraticCurveTo(lean-30,top,lean-15,top);g.lineTo(lean+17,top);g.quadraticCurveTo(lean+34,top,lean+37,top+13);g.lineTo(22,bottom);g.lineTo(-22,bottom);g.closePath();g.fillStyle=a.gi;g.fill();g.strokeStyle='#211621';g.lineWidth=3;g.stroke();g.clip();imagePatch(g,c.torso,lean-37,top,74,bottom-top);g.restore();
 g.fillStyle='#16121b';g.beginPath();g.roundRect(-24,hip-4,48,10,3);g.fill();
 // Boots with a visible sole, not floating round endpoints.
 for(const foot of [backFoot,frontFoot]){g.save();g.translate(...foot);g.rotate(S.foot&&foot===frontFoot?-.3:0);g.fillStyle='#25202a';g.beginPath();g.roundRect(-13,-5,29,13,5);g.fill();g.fillStyle=a.color;g.fillRect(-10,4,23,3);g.restore();}
 texturedLimb(g,c.arm,[lean+26,hy+43],[S.fa[0],S.fa[1]],29);texturedLimb(g,c.arm,[S.fa[0],S.fa[1]],[S.fa[2],S.fa[3]],25);glove(g,a,c,S.fa[2],S.fa[3],S.fist?1.08:1);
}
export function drawRosterPoseHead(g,id,S){
 const hy=S.hy+S.crouch*.35,lean=S.lean*.5;
 drawRosterHead(g,id,lean,hy+10);
}
