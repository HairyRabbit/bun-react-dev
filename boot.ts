const code = /*ts*/`\
import 'bun-react-dev/runtime'
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"

function main() {
  const root = createRoot(document.getElementById("root")!);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}

globalThis.addEventListener("DOMContentLoaded", main)
`