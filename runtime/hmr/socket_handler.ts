import { reload } from "./reload";
import { update } from "./updater";

const debug = console.log

const enum Action {
  Reload = 'reload',
  Update = 'update',
}

type MessageData =
  | { type: Action.Reload, payload: {} } 
  | { type: Action.Update, payload: { url: string } }


let mounted = false

export function mount_hmr_socket_handler(socket: WebSocket) {
  if(mounted) return

  socket.addEventListener("message", async (evt) => {
    const json = parse_message_data(evt.data.toString())
    debug("message", json)
    if(null === json) return
  
    switch(json.type) {
      case Action.Reload: {
        reload()
        return
      }
      case Action.Update: {
        try {
          const result = await update(json.payload.url)
          if(false === result) reload()
        }
        catch(error) {
          console.error(error)
          reload()
        }
  
        return
      }
    }
  })

  mounted = true
}


function parse_message_data(data: string) {
  try {
    const json = JSON.parse(data)
    return json as MessageData
  }
  catch (error: unknown) {
    return null
  }
}