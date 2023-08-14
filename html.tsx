import { FunctionComponent } from "react"

type HTMLProps = {
  
}

export const HTML: FunctionComponent<HTMLProps> = (props) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="Web site created using create-react-app" />
        {/* <link rel="manifest" href="/manifest.json" /> */}
        <title>React App</title>
        <meta name="react-dev" content="" />
      </head>
      <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <div id="root" />
        <script src="/boot" async type="module"></script>
      </body>
    </html>
  )
}