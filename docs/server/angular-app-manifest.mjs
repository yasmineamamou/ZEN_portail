
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/ZEN_portail/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/ZEN_portail"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 519, hash: '428b9718f331016aec7c71364c76008f4938e8d8858877e1d8a57dfae06e3621', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1032, hash: 'e6d134bdd59d867d365aac92b35803994bc41b360292110336fc5f50d72735eb', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 20849, hash: 'effd378b2367e8934a23633b685f850862070ccb290316feddc5bb1111086d01', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-5INURTSO.css': {size: 0, hash: 'menYUTfbRu8', text: () => import('./assets-chunks/styles-5INURTSO_css.mjs').then(m => m.default)}
  },
};
