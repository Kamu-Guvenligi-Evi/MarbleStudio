import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
// Font-independent zodiac marks remain legible on small, circular marbles.
const signs=[
  ['Aries','Koç','#f96854','M128 181V103C128 52 65 58 72 101C75 118 91 120 97 109 M128 103C128 52 191 58 184 101C181 118 165 120 159 109'],
  ['Taurus','Boğa','#79c882','M80 67C80 110 176 110 176 67 M128 103A39 39 0 1 0 128 181A39 39 0 1 0 128 103'],
  ['Gemini','İkizler','#ffd05d','M78 73Q128 94 178 73 M78 183Q128 162 178 183 M103 83V174 M153 83V174'],
  ['Cancer','Yengeç','#6fd8e7','M177 95C141 62 88 72 81 102 M79 103A20 20 0 1 0 119 103A20 20 0 1 0 79 103 M79 161C115 194 168 184 175 154 M137 153A20 20 0 1 0 177 153A20 20 0 1 0 137 153'],
  ['Leo','Aslan','#ffad42','M94 133A23 23 0 1 0 94 179A23 23 0 1 0 94 133 M113 143C144 126 94 94 121 74C153 50 183 82 167 117L148 157C133 190 167 197 184 174'],
  ['Virgo','Başak','#aad176','M65 91Q90 72 90 106V173 M90 106Q113 72 116 106V173 M116 106Q139 72 142 106V150C142 179 179 182 188 160 M142 113C180 71 200 130 148 170'],
  ['Libra','Terazi','#f69eb9','M73 175H183 M73 146H105C65 104 114 66 143 85C165 99 165 125 151 146H183'],
  ['Scorpio','Akrep','#c18aff','M65 91Q90 72 90 106V173 M90 106Q114 72 117 106V173 M117 106Q142 72 144 106V151Q144 177 184 165 M170 153L188 164L175 180'],
  ['Sagittarius','Yay','#ee82c9','M78 178L180 76 M137 76H180V119 M81 121L135 175'],
  ['Capricorn','Oğlak','#65c3b3','M65 101Q83 76 96 99L117 157L141 90 M141 90C130 127 120 185 162 184C199 184 198 136 171 137C149 137 146 164 140 174'],
  ['Aquarius','Kova','#69acff','M67 111L91 89L115 111L139 89L163 111L187 89 M67 164L91 142L115 164L139 142L163 164L187 142'],
  ['Pisces','Balık','#b39bff','M84 74C124 104 124 152 84 182 M172 74C132 104 132 152 172 182 M75 128H181'],
];
const items=signs.map(([name,localName,color,path])=>{
  const id='zodiac-'+createHash('sha1').update(name).digest('hex').slice(0,10),src=`/catalog/${id}.svg`;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><defs><radialGradient id="bg" cx="35%" cy="25%" r="90%"><stop stop-color="${color}"/><stop offset=".6" stop-color="${color}"/><stop offset="1" stop-color="#18263f"/></radialGradient></defs><path fill="url(#bg)" d="M0 0H256V256H0Z"/><circle cx="128" cy="128" r="115" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="2"/><g fill="#fff" opacity=".55"><circle cx="51" cy="70" r="2"/><circle cx="195" cy="58" r="3"/><circle cx="204" cy="184" r="2"/><circle cx="64" cy="197" r="3"/></g><path d="${path}" transform="translate(0 2)" fill="none" stroke="#0b1534" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="#fff9ed" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  fs.writeFileSync(root+`public${src}`,svg);
  const item={id,category:'zodiac',name,localName,src,source:src,fit:'cover',credit:'Marble Studio',license:'Original vector artwork',generated:true};
  fs.writeFileSync(root+`public/catalog/${id}.json`,JSON.stringify(item,null,2));return item;
});
const manifestPath=root+'public/catalog/manifest.json',catalog=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
catalog.categories=catalog.categories.filter(g=>g.id!=='zodiac');catalog.categories.push({id:'zodiac',name:'Burçlar'});
catalog.items=catalog.items.filter(i=>i.category!=='zodiac').concat(items);
fs.writeFileSync(manifestPath,JSON.stringify(catalog,null,2));
const seedPath=root+'scripts/catalog-seed.json',seed=JSON.parse(fs.readFileSync(seedPath,'utf8').replace(/^\uFEFF/,''));
fs.writeFileSync(seedPath,JSON.stringify([...seed.filter(g=>g.id!=='zodiac'),{id:'zodiac',name:'Burçlar',items:signs.map(([name])=>[name,name])}],null,2));
console.log('Added 12 local zodiac emblems and the Burçlar category.');
