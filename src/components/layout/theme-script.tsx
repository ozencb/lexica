const THEME_INIT_SCRIPT = [
  "(function(){",
  "try{",
  'var t=localStorage.getItem("theme");',
  'if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme:dark)").matches))',
  'document.documentElement.classList.add("dark")',
  "}catch(e){}",
  "})()",
].join("");

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
}
