// Run with a local Natural Earth 1:110m country GeoJSON; never downloads data.
import {readFile,writeFile} from 'node:fs/promises';
const source=JSON.parse(await readFile(process.argv[2]??'artifacts/natural-earth-countries.geojson','utf8'));
const countries={TUR:['turkey','Türkiye'],DEU:['germany','Almanya'],FRA:['france','Fransa'],ITA:['italy','İtalya'],ESP:['spain','İspanya'],BRA:['brazil','Brezilya']};
const area=ring=>Math.abs(ring.reduce((sum,p,i)=>{const q=ring[(i+1)%ring.length];return sum+p[0]*q[1]-q[0]*p[1];},0));
const maps={};
for(const [code,[id,name]] of Object.entries(countries)){
  const feature=source.features.find(f=>f.properties.ADM0_A3===code);
  if(!feature)throw new Error('Missing country: '+code);
  const polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates;
  // A connected battlefield uses the largest landmass (no separate islands).
  const ring=polygons.map(p=>p[0]).sort((a,b)=>area(b)-area(a))[0];
  const latitude=ring.reduce((sum,p)=>sum+p[1],0)/ring.length;
  const points=ring.map(([lon,lat])=>[lon*Math.cos(latitude*Math.PI/180),-lat]);
  const minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0]));
  const minY=Math.min(...points.map(p=>p[1])),maxY=Math.max(...points.map(p=>p[1]));
  const scale=444/Math.max(maxX-minX,maxY-minY);
  maps[id]={name,outline:points.map(([x,y])=>({x:+(270+(x-(minX+maxX)/2)*scale).toFixed(2),y:+(510+(y-(minY+maxY)/2)*scale).toFixed(2)}))};
}
await writeFile('src/territory-maps.js','// Natural Earth 1:110m, public domain. Largest landmass; local equirectangular projection.\n// Source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson\nexport const COUNTRY_MAPS='+JSON.stringify(maps)+';\n');
console.log('Generated '+Object.keys(maps).length+' country outlines.');
