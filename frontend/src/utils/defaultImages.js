import ptcLogo from '../assets/images/logo-ptc.png';

const createSvgDataUrl = (label, fill = '#f3f4f6', text = '#6b7280') => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' width='800' height='800' viewBox='0 0 800 800'><rect width='100%' height='100%' rx='48' fill='${fill}'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='${text}' font-family='Arial, Helvetica, sans-serif' font-size='34' font-weight='600'>${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const defaultOrgImage = ptcLogo;
export const defaultAvatarImage = createSvgDataUrl('No Profile Picture');
export const defaultGalleryImage = createSvgDataUrl('Image Not Available');