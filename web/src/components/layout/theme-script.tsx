/**
 * Theme boot script.
 *
 * Runs before paint (as a blocking inline script in <head>) to set the `.dark`
 * class from the saved preference, or the OS setting when none is saved. This
 * prevents a flash of the wrong theme on first paint. Kept tiny and dependency
 * free because it is inlined and runs on every page load.
 */
export function ThemeScript() {
  const script = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
