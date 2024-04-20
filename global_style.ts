export function generate_global_style_code() {
  const code = `
  html {
    -moz-text-size-adjust: none;
    -webkit-text-size-adjust: none;
    text-size-adjust: none;
  }

  body {
    margin: 0;
    min-height: 100vh;
  }

  :target {
    scroll-margin-block: 5ex;
  }
  `

  return code
}