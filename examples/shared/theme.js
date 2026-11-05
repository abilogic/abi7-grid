// Synchronizing the light/dark theme of the sample page with the documentation site
// (via ?theme=dark in address and postMessage). Does not apply to the library.
const params = new URLSearchParams(location.search);
const apply = (t) => (document.documentElement.dataset.theme = t === 'dark' ? 'dark' : 'light');
apply(params.get('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
addEventListener('message', (e) => {
  if (e.data && e.data.abi7Theme) apply(e.data.abi7Theme);
});
