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
 const h=55,w=h*sw/sh;
 g.save();g.translate(x-w/2,y-20);
 g.beginPath();a.outline.forEach(([u,v],i)=>i?g.lineTo(u*w,v*h):g.moveTo(u*w,v*h));g.closePath();g.clip();
 g.drawImage(poster,sx,sy,sw,sh,0,0,w,h);g.restore();
}
