// Let Vite resolve one shared image cache for both physics and image loading,
// including when the development server has active hot-update URLs.
export {Race,COLORS} from '../src/physics.js';
export {loadBallImage,ballImageColor} from '../src/ball-images.js';
export {prepareCatalogImage} from '../src/image-catalog.js';
