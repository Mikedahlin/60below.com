export const github = 'https://github.com/Mikedahlin/60below.com';
export const brand = '60BELOW';
export const slogan = 'Sub-Zero 3D Iridescent Spine';

export const studies = [
  ['Dispersion', 'dispersion', '70f3ff', '3D, WebGL, Shader', 'Interactive real-time sub-zero dispersion through iridescent optical crystal.'],
  ['Star Ring', 'star-ring', '88a9d1', '3D, Motion, Geometry', 'Circular spatial orbital path along iridescent crystalline structures.'],
  ['Gallery', 'gallery', 'd3c7b8', 'Shader, Optic, Realtime', 'Dynamic reflections and refractive caustics in real-time WebGL.'],
  ['Orbit', 'orbit', 'a3c4b1', 'Motion, Space, 3D', 'Smooth spiral camera choreography tracing the 3D iridescent spine.'],
  ['Slingshot', 'slingshot', 'e5ab92', 'Physics, Shader, Motion', 'Sub-zero momentum and crystalline particle dynamics.'],
  ['Genesis', 'genesis', 'b4b5bc', 'Light, WebGL, Volumetric', 'Volumetric lighting core illuminating the iridescent spine chamber.']
].map(([name, cover, uiColor, tags, description], index) => ({
  id: `study-${index + 1}`,
  name, slug: name.toLowerCase().replaceAll(' ', '-'), description,
  clientName: '60BELOW / 3D Experience',
  completionDate: '2026-11-05T00:00:00.000Z', uiColor, tags,
  priority: index + 1, projectURL: github,
  projectLogo: { url: '/assets/daily/wordmark.png', width: 400, height: 200 },
  video: { url: `/assets/daily/study-${name.toLowerCase().replaceAll(' ', '-')}.jpg`, thumbnail: `/assets/daily/cover-${cover}.jpg` }
}));
