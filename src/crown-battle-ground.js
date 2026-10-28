// Baked once per map/resize. All marks use screen proportions, not stretched sprites.
const palettes = {
  classic: ['#73805a', '#b6ad7b', '#455d42', '#a38c64'],
  steppe: ['#999266', '#c7b884', '#677447', '#b49b6c'],
  desert: ['#bba076', '#e1c69b', '#97774d', '#d4b185'],
  snow: ['#c5d1cd', '#f0efe2', '#8caaa4', '#a4b5ae'],
  autumn: ['#8a8261', '#c0a477', '#596343', '#b1966d'],
  stone: ['#8c9186', '#b1b09b', '#626e63', '#9d9b85'],
};

export function makeGround(seed, id, width, height, pixelRatio = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.min(2560, Math.max(1, Math.round(width * pixelRatio)));
  canvas.height = Math.min(1600, Math.max(1, Math.round(height * pixelRatio)));
  const g = canvas.getContext('2d');
  g.scale(canvas.width / width, canvas.height / height);
  const colors = palettes[id] || palettes.classic;
  let state = (Number(seed) || 1) >>> 0;
  const random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296);
  const ellipse = (x, y, rx, ry, color) => {
    g.fillStyle = color; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill();
  };
  g.fillStyle = colors[0]; g.fillRect(0, 0, width, height);

  // Seeded, multiscale pigment gives the ground irregular detail instead of
  // overlapping blurred circles. This small raster is baked once, never per frame.
  const pigment = document.createElement('canvas');
  pigment.width = Math.min(640, Math.max(1, Math.ceil(width / 2)));
  pigment.height = Math.min(400, Math.max(1, Math.ceil(height / 2)));
  const paint = pigment.getContext('2d'), pixels = paint.createImageData(pigment.width, pigment.height);
  const fields = [5, 13, 37, 89].map(columns => {
    const rows = Math.max(2, Math.round(columns * height / width));
    return { columns, rows, values: Float32Array.from({length:(columns+1)*(rows+1)}, random) };
  });
  const sample = (field, x, y) => {
    const px=x*field.columns, py=y*field.rows, ix=Math.floor(px), iy=Math.floor(py);
    let fx=px-ix, fy=py-iy; fx=fx*fx*(3-2*fx); fy=fy*fy*(3-2*fy);
    const i=iy*(field.columns+1)+ix, a=field.values;
    return (a[i]*(1-fx)+a[i+1]*fx)*(1-fy)+(a[i+field.columns+1]*(1-fx)+a[i+field.columns+2]*fx)*fy;
  };
  const rgb = hex => [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  const base=rgb(colors[0]), bright=rgb(colors[1]), dark=rgb(colors[2]);
  for (let y=0;y<pigment.height;y++) for (let x=0;x<pigment.width;x++) {
    const nx=x/pigment.width, ny=y/pigment.height;
    const value=sample(fields[0],nx,ny)*.42+sample(fields[1],nx,ny)*.3+sample(fields[2],nx,ny)*.18+sample(fields[3],nx,ny)*.1;
    const amount=Math.min(1,Math.abs(value-.5)*2.8), tint=value>.5?bright:dark;
    const grain=(random()-.5)*6, index=(y*pigment.width+x)*4;
    for(let c=0;c<3;c++)pixels.data[index+c]=base[c]+(tint[c]-base[c])*amount+grain;
    pixels.data[index+3]=255;
  }
  paint.putImageData(pixels,0,0); g.drawImage(pigment,0,0,width,height);

  if (id === 'stone') {
    const size = 30;
    for (let row = 0; row < height / size; row++) for (let col = -1; col < width / (size * 1.8); col++) {
      const x = (col + row % 2 * .5) * size * 1.8, y = row * size;
      g.fillStyle = colors[random() > .5 ? 1 : 2] + '25';
      g.fillRect(x + 1, y + 1, size * 1.8 - 2, size - 2);
      g.strokeStyle = '#24362d30'; g.lineWidth = 1; g.strokeRect(x, y, size * 1.8, size);
      g.strokeStyle = '#e7dec528'; g.beginPath(); g.moveTo(x + 2, y + size - 2); g.lineTo(x + size * 1.8 - 2, y + size - 2); g.stroke();
      if (random() < .2) {
        g.strokeStyle = '#34413835'; g.beginPath(); g.moveTo(x + 9, y);
        g.lineTo(x + 19, y + 12); g.lineTo(x + 15, y + 23); g.stroke();
      }
    }
  } else if (id === 'desert') {
    for (let i = -2; i < height / 26; i++) {
      const y = i * 26;
      g.beginPath(); g.moveTo(-30, y); g.bezierCurveTo(width * .3, y - 50, width * .6, y + 85, width + 30, y + 15);
      g.strokeStyle = '#805d3420'; g.lineWidth = 9; g.stroke();
      g.strokeStyle = '#ffe3b850'; g.lineWidth = 1; g.stroke();
    }
  } else {
    // An old, winding track sits within the ground, leaving the combat centre open.
    g.beginPath(); g.moveTo(width * .72, -height * .1);
    g.bezierCurveTo(width * .44,height * .28,width * .96,height * .57,width * .66,height * 1.1);
    for (let band=7;band>0;band--) {
      g.strokeStyle=colors[3]+(id==='snow'?'08':'0b');
      g.lineWidth=8+band*Math.min(width,height)*.009; g.stroke();
    }
    g.strokeStyle=colors[1]+'16'; g.lineWidth=1.2; g.stroke();
  }

  const grains = Math.min(18000, Math.round(width * height / 55));
  for (let i = 0; i < grains; i++) {
    const x = random() * width, y = random() * height;
    g.fillStyle = colors[1 + i % 2] + (i % 3 ? '35' : '60');
    g.fillRect(x, y, .6 + random() * 1.8, .45 + random() * .7);
  }
  if (id !== 'stone' && id !== 'desert') {
    const clusters = Math.min(1800, Math.round(width * height / 420));
    for (let i = 0; i < clusters; i++) {
      const x = random() * width, y = random() * height, s = .7 + random() * 1.2;
      g.lineWidth = .7; g.strokeStyle = colors[2] + (id === 'snow' ? '25' : '88');
      g.beginPath();
      for (let blade = 0; blade < 3; blade++) {
        const bx = x + blade * 2;
        g.moveTo(bx, y); g.lineTo(bx + (blade - 1) * s, y - (2 + random() * 3) * s);
      }
      g.stroke(); g.strokeStyle = colors[1] + 'b0';
      g.beginPath(); g.moveTo(x + 3, y); g.lineTo(x + 4, y - 3 * s); g.stroke();
    }
  }
  // Low tufts, fallen leaves and grit have a lit edge and a tiny contact shade.
  // They are ground markings, with no collision objects or extra render passes.
  for (let i=0;i<Math.min(1100,width*height/850);i++) {
    const x=random()*width,y=random()*height,s=.6+random()*1.8;
    if(id==='autumn') {
      ellipse(x+1,y+1,s*1.7,s*.65,'#342c2235');
      ellipse(x,y,s*1.5,s*.5,i%3?'#bc8b4f88':'#81523599');
    } else {
      ellipse(x+1,y+1,s*1.5,s*.6,'#20302722');
      ellipse(x,y,s,s*.45,colors[2]+'70');
      g.fillStyle=colors[1]+'95';g.fillRect(x-s*.6,y-s*.35,s,.5);
    }
  }
  // Small edge scrub/pebbles frame the arena without suggesting obstacles.
  for (let i = 0; i < 180; i++) {
    const side = i % 4, along = random(), inset = random() ** 2 * 28;
    const x = side < 2 ? (side ? width - inset : inset) : along * width;
    const y = side >= 2 ? (side === 3 ? height - inset : inset) : along * height;
    const s = 1.5 + random() * 4;
    ellipse(x + 2, y + 2, s * 1.6, s * .6, '#1b302b30');
    ellipse(x, y, s, s * .55, colors[2] + 'c0');
    ellipse(x - s * .25, y - s * .2, s * .65, s * .3, colors[1] + 'b0');
  }
  const light = g.createLinearGradient(0, 0, width, height);
  light.addColorStop(0, '#ffe3a32a'); light.addColorStop(.48, '#ffffff00'); light.addColorStop(1, '#152e3438');
  g.fillStyle = light; g.fillRect(0, 0, width, height);
  const vignette=g.createRadialGradient(width*.48,height*.45,Math.min(width,height)*.15,width*.5,height*.5,Math.max(width,height)*.65);
  vignette.addColorStop(0,'#13251d00');vignette.addColorStop(1,'#13251d44');
  g.fillStyle=vignette;g.fillRect(0,0,width,height);
  return canvas;
}
