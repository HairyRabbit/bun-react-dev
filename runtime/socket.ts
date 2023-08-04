/// <reference types="web" />

export const socket = new WebSocket('ws://localhost:3000/__DEV__')

const msg_queue: string[] = []

socket.addEventListener('open', () => {
  let data; while(( data = msg_queue.shift() )) socket.send(data);
});

// socket.addEventListener('message', evt => {
//   const data = evt.data.toString();
//   console.log("message", data);
//   const update_id = Date.now()
//   import(data + `?t=${update_id}`).then(console.log)
// });

export function send(data: unknown) {
  const send_data = JSON.stringify(data)
  if(socket.readyState !== socket.OPEN) {
    msg_queue.push(send_data)
  }
  else {
    socket.send(send_data)
  }
}

globalThis.__DEV_SOCKET__ = socket