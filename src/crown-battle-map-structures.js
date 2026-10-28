// Static scenery in normalized map coordinates. Shallow water and buildings
// are decorative; combat navigation remains the existing open battlefield.
export function drawMapStructures(g, id) {
  const snow = id === 'snow', desert = id === 'desert', stone = id === 'stone';
  const wall = desert ? '#c7a774' : stone ? '#a09c85' : '#a89d7a';
  const roof = snow ? '#dce6dc' : desert ? '#ddbd86' : id === 'autumn' ? '#8c4d37' : '#695c43';
  const poly = (points, color) => {
    g.fillStyle = color; g.beginPath();
    points.forEach(([x,y], i) => i ? g.lineTo(x,y) : g.moveTo(x,y)); g.closePath(); g.fill();
  };
  const line = (points, color, width) => {
    g.strokeStyle = color; g.lineWidth = width; g.beginPath();
    points.forEach(([x,y], i) => i ? g.lineTo(x,y) : g.moveTo(x,y)); g.stroke();
  };
  function house(x,y,w,h,angle=0) {
    g.save(); g.translate(x,y); g.rotate(angle);
    poly([[-w/2+9,-h/2+10],[w/2+13,-h/2+10],[w/2+13,h/2+19],[-w/2+9,h/2+19]],'#26302c45');
    g.fillStyle=wall; g.fillRect(-w/2,-h/2,w,h+9);
    g.fillStyle='#6b6049'; g.fillRect(-w/2,h/2,w,9);
    g.fillStyle='#302e24'; g.fillRect(-5,h/2,10,9);
    for(const sx of [-1,1]) { g.fillStyle='#d6bc78';g.fillRect(sx*w*.3-3,h/2+2,6,4); }
    if (desert) {
      g.fillStyle=roof;g.fillRect(-w/2-3,-h/2-3,w+6,h+4);
      g.strokeStyle='#ad895d';g.lineWidth=3;g.strokeRect(-w/2+3,-h/2+3,w-6,h-8);
      g.fillStyle='#a4855a';g.fillRect(w/2-14,-h/2+5,8,10);
    } else {
      poly([[-w/2-4,-h/2-4],[w/2+4,-h/2-4],[w/2+4,0],[-w/2-4,0]],roof);
      poly([[-w/2-4,0],[w/2+4,0],[w/2+4,h/2+2],[-w/2-4,h/2+2]],snow?'#b3c3bf':'#4e4434');
      for(let yy=-h/2+3;yy<h/2;yy+=7) line([[-w/2,yy],[w/2,yy]],snow?'#ffffff40':'#b4986340',1);
      line([[-w/2-5,0],[w/2+5,0]],snow?'#f4f4e9':'#b1a079',3);
      g.fillStyle='#686451';g.fillRect(w/2-12,-h/2-8,7,12);
    }
    g.restore();
  }
  function yurt(x,y,r) {
    g.save();g.translate(x,y);
    g.fillStyle='#26302c40';g.beginPath();g.ellipse(6,11,r+5,r*.7,0,0,Math.PI*2);g.fill();
    g.fillStyle='#9e8d69';g.beginPath();g.ellipse(0,5,r,r*.7,0,0,Math.PI*2);g.fill();
    g.fillStyle='#d4c7a2';g.beginPath();g.ellipse(0,-3,r,r*.7,0,0,Math.PI*2);g.fill();
    for(let a=0;a<Math.PI*2;a+=Math.PI/4) line([[0,-8],[Math.cos(a)*r,Math.sin(a)*r*.7-3]],'#9c8a604f',1.5);
    g.fillStyle='#544632';g.fillRect(-5,r*.4,10,9);
    g.fillStyle='#79694c';g.beginPath();g.ellipse(0,-6,4,3,0,0,Math.PI*2);g.fill();g.restore();
  }
  function bridge(x,y,angle) {
    g.save();g.translate(x,y);g.rotate(angle);
    const w=stone?66:52,h=96;
    g.fillStyle='#202e2d55';g.fillRect(-w/2+8,-h/2+10,w,h);
    g.fillStyle=stone?'#a49d85':'#957b50';g.fillRect(-w/2,-h/2,w,h);
    for(let yy=-h/2+5;yy<h/2;yy+=8) {
      line([[-w/2,yy],[w/2,yy]],stone?'#756f60':'#51432e',2);
      if(stone)line([[yy%16?0:-14,yy-8],[yy%16?0:-14,yy]],'#756f60',1);
    }
    for(const sx of [-1,1]) {
      line([[sx*w/2,-h/2-5],[sx*w/2,h/2+5]],stone?'#d3c9aa':'#c0a278',5);
      line([[sx*(w/2-4),-h/2],[sx*(w/2-4),h/2]],'#3e3d3055',3);
      for(const yy of [-h/2,0,h/2]) {g.fillStyle=stone?'#b8b198':'#6b5336';g.fillRect(sx*w/2-4,yy-4,8,8);}
    }
    g.restore();
  }
  g.save();g.lineCap='round';g.lineJoin='round';
  // Two edge settlements leave the central deployment and fighting area clear.
  for(const [x,y,angle] of [[220,110,0],[775,880,Math.PI]]) {
    g.save();g.translate(x,y);g.rotate(angle);
    line([[-160,20],[-50,34],[75,30],[160,0]],snow?'#a3b4ab90':desert?'#ac865960':'#b5a07970',20);
    if(id==='steppe') {
      for(const [xx,yy,r] of [[-80,-32,25],[-15,-48,28],[54,-24,23],[-112,38,20]]) yurt(xx,yy,r);
    } else {
      house(-85,-28,58,38,-.08);house(-12,-50,48,38,.05);house(58,-25,62,44,.06);house(-110,42,40,28,-.12);
    }
    // Small cart, barrels and fence establish scale without adding live objects.
    g.fillStyle='#6f5639';g.fillRect(0,54,23,13);
    for(const xx of [2,18]) {g.fillStyle='#343429';g.fillRect(xx,50,4,5);g.fillRect(xx,67,4,5);}
    line([[-142,-55],[-142,4],[-123,6]],'#79694a',3);
    for(let yy=-55;yy<9;yy+=12){g.fillStyle='#b9a680';g.fillRect(-145,yy-3,6,6);}
    g.restore();
  }
  // Streams hug the edge, with broad visible approaches to each crossing.
  for(const [x,y,angle] of [[760,135,.13],[235,865,-.13]]) {
    g.save();g.translate(x,y);g.rotate(angle);
    const creek=[[-245,-35],[-155,-20],[-72,5],[10,0],[105,-14],[190,4],[245,30]];
    line(creek,desert?'#af9162':'#53685d70',48);
    line(creek,snow?'#90b3bd':desert?'#7f9c8a':'#638f8a',35);
    line(creek,snow?'#d0e1dd80':'#a3c7b750',13);
    line([[-155,-26],[-75,-2],[-48,-4]],'#e0e9cc66',2);
    line([[85,0],[132,0],[166,8]],'#e0e9cc66',2);
    line([[0,-100],[0,-46]],snow?'#9eafa890':'#c1aa7d90',38);
    line([[0,46],[5,105]],snow?'#9eafa890':'#c1aa7d90',38);
    bridge(0,0,0);g.restore();
  }
  g.restore();
}
