// Face centers and square crop widths, normalized to each source photograph.
// These frames belong to library images, never to user-uploaded photographs.
const faces={
  'Recep Tayyip Erdoğan':[.51,.37,.58], 'Kemal Kılıçdaroğlu':[.49,.34,.64],
  'Özgür Özel':[.51,.34,.62], 'Ekrem İmamoğlu':[.53,.30,.60],
  'Mansur Yavaş':[.51,.36,.62], 'Devlet Bahçeli':[.50,.35,.60],
  'Meral Akşener':[.51,.38,.68], 'Donald Trump':[.53,.43,.70],
  'Joe Biden':[.50,.34,.57], 'Barack Obama':[.48,.23,.50],
  'Vladimir Putin':[.49,.38,.65], 'Volodymyr Zelenskyy':[.50,.32,.61],
  'Emmanuel Macron':[.50,.35,.63], 'Angela Merkel':[.50,.39,.70],
  'Xi Jinping':[.50,.36,.63], 'Narendra Modi':[.50,.35,.60],
  'Luiz Inácio Lula':[.46,.35,.62], 'Javier Milei':[.51,.43,.66],
  'Giorgia Meloni':[.50,.36,.62], 'Kim Jong Un':[.50,.38,.67],
  'Abdullah Öcalan':[.50,.43,.83], 'Selahattin Demirtaş':[.47,.37,.73],
  'Mao Zedong':[.51,.34,.76],
};
export function portraitFrame(item,img) {
  const frame=item.category==='politicians'?faces[item.name]:null;if(!frame)return null;
  const [cx,cy,width]=frame,side=Math.min(img.naturalWidth*width,img.naturalHeight);
  return {side,x:Math.max(0,Math.min(img.naturalWidth-side,img.naturalWidth*cx-side/2)),y:Math.max(0,Math.min(img.naturalHeight-side,img.naturalHeight*cy-side/2))};
}
