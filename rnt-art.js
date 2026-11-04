// Original face pixels only; bodies are animated canvas geometry.
const figures = {
 rnt:{name:'RNT',color:'#ef3333',skin:'#b77750',gi:'#eee5d5',head:[119,0,119,166],outline:[[.12,0],[.79,0],[.94,.13],[1,.5],[.85,.85],[.6,1],[.25,.92],[0,.6],[0,.2]]},
 tristan:{name:'Tristan',color:'#2788ff',skin:'#8f5c3d',gi:'#2466bb',head:[333,43,120,186],outline:[[.2,0],[.7,0],[.94,.1],[1,.4],[.9,.75],[.65,1],[.28,.96],[.02,.65],[0,.25]]},
 andre:{name:'Andre',color:'#ff7924',skin:'#bd815a',gi:'#c9471d',head:[565,51,207,179],outline:[[.18,.06],[.48,0],[.8,.07],[.97,.3],[1,.55],[.81,.72],[.66,.95],[.4,1],[.23,.8],[.06,.65],[0,.34]]},
 marcel:{name:'Marcel',color:'#27dc79',skin:'#e2b693',gi:'#e4e9dc',head:[840,54,107,150],outline:[[.28,.03],[.66,0],[.94,.15],[1,.55],[.83,.8],[.65,1],[.33,.98],[.06,.76],[0,.3]]},
 blaise:{name:'Blaise',color:'#b53cff',skin:'#c78e69',gi:'#372648',head:[1083,28,132,162],outline:[[.21,.06],[.56,0],[.83,.12],[.99,.3],[.94,.67],[.72,.94],[.43,1],[.16,.82],[0,.49],[.02,.22]]}
};
const poster=new Image();poster.src='rnt-roster-original.jpg';
const bodies=new Image();bodies.src='detailed-bodies-v1.png';
const bodyTiles=[];
export const artReady=async()=>{await Promise.all([poster.decode(),bodies.decode()]);
 for(let i=0;i<5;i++){const c=document.createElement('canvas');c.width=434;c.height=620;
 c.getContext('2d').drawImage(bodies,i*434,94,434,620,0,0,434,620);bodyTiles.push(c);}
};
export function fighterArt(id){return figures[id]||figures.rnt;}
export function drawRosterHead(g,id,x,y){
 const a=fighterArt(id),[sx,sy,sw,sh]=a.head;
 const h=72,w=h*sw/sh;
 g.save();g.translate(x-w/2,y-39);
 g.beginPath();a.outline.forEach(([u,v],i)=>i?g.lineTo(u*w,v*h):g.moveTo(u*w,v*h));g.closePath();g.clip();
 g.drawImage(poster,sx,sy,sw,sh,0,0,w,h);g.restore();
}

// Continuous textured mesh follows the existing combat poses; original heads remain separate.
const ids=['rnt','tristan','andre','marcel','blaise'];
function triangle(g,img,s,d){
 const [a,b,c]=s,[p,q,r]=d,ux=b[0]-a[0],uy=b[1]-a[1],vx=c[0]-a[0],vy=c[1]-a[1],det=ux*vy-uy*vx;
 const A=((q[0]-p[0])*vy-(r[0]-p[0])*uy)/det,B=((q[1]-p[1])*vy-(r[1]-p[1])*uy)/det;
 const C=((r[0]-p[0])*ux-(q[0]-p[0])*vx)/det,D=((r[1]-p[1])*ux-(q[1]-p[1])*vx)/det;
 g.save();g.beginPath();
 // A small overlap avoids hairline cracks between adjacent textured triangles.
 const cx=(p[0]+q[0]+r[0])/3,cy=(p[1]+q[1]+r[1])/3;
 for(let i=0;i<3;i++){const x=d[i][0],y=d[i][1],l=Math.hypot(x-cx,y-cy)||1;
 const xx=x+(x-cx)/l*.35,yy=y+(y-cy)/l*.35;i?g.lineTo(xx,yy):g.moveTo(xx,yy);}
 g.closePath();g.clip();g.transform(A,B,C,D,p[0]-A*a[0]-C*a[1],p[1]-B*a[0]-D*a[1]);g.drawImage(img,0,0);g.restore();
}
export function drawRosterBody(g,id,S){
 const img=bodyTiles[Math.max(0,ids.indexOf(id))];if(!img)return;
 const cols=10,rows=14,points=[],source=[];
 const top=S.hy+25+S.crouch*.15,hip=-58+S.crouch*.35;
 for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
  const u=i/cols,v=j/rows;let x=(u-.5)*108+S.lean*.5*(1-v),y=v<.37?top+(hip-top)*v/.37:hip+(0-hip)*(v-.37)/.63;
  const leg=Math.max(0,(v-.4)/.6),right=Math.min(1,Math.max(0,(u-.35)/.3));
  x+=leg*((1-right)*(S.lb[0]+18)+right*(S.lf[0]-16));
  y+=leg*((1-right)*(S.lb[1]+8)+right*(S.lf[1]+10));
  const upper=Math.exp(-Math.pow((v-.23)/.18,2));
  const leftArm=Math.max(0,(.38-u)/.38)*upper,rightArm=Math.max(0,(u-.62)/.38)*upper;
  x+=leftArm*(S.ba[2]+30)+rightArm*(S.fa[2]-30);
  y+=leftArm*(S.ba[3]+92-S.crouch*.5)+rightArm*(S.fa[3]+96-S.crouch*.5);
  source.push([u*434,v*620]);points.push([x,y]);
 }
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const a=j*(cols+1)+i,b=a+1,c=a+cols+1,d=c+1;
  triangle(g,img,[source[a],source[b],source[c]],[points[a],points[b],points[c]]);
  triangle(g,img,[source[b],source[d],source[c]],[points[b],points[d],points[c]]);
 }
}
export function drawRosterPoseHead(g,id,S){
 const hy=S.hy+S.crouch*.35,lean=S.lean*.5;
 drawRosterHead(g,id,lean,hy+10);
}
