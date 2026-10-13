import {RECORDED_SOUNDS} from './recorded-sounds.js';
import {MEME_SOUNDS} from './meme-catalog.js';
import {SOFT_SOUNDS} from './soft-audio.js';

export const COLLISION_SOUNDS={classic:'Klasik',meow:'Miyav',woof:'Havlama',squeak:'Lastik oyuncak',pop:'Baloncuk',laser:'Lazer',bell:'Zil',wood:'Tahta tıkırtısı',...SOFT_SOUNDS,...MEME_SOUNDS,...Object.fromEntries(Object.entries(RECORDED_SOUNDS).map(([id,clip])=>[id,clip.name]))};
export const normalizeCollisionSound=value=>Object.hasOwn(COLLISION_SOUNDS,value)?value:'classic';
