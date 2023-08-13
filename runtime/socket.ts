import { info } from './logger'

const msg_queue: string[] = []

export function create_socket(url: URL) {
  const socket = new WebSocket(url)

  socket.addEventListener('open', () => {
    info('react-dev', 'socket connected')
    let data; while(( data = msg_queue.shift() )) socket.send(data);
  })

  // function send(data: unknown) {
  //   const send_data = JSON.stringify(data)
  //   if(socket.readyState !== socket.OPEN) {
  //     msg_queue.push(send_data)
  //   }
  //   else {
  //     socket.send(send_data)
  //   }
  // }

  return socket
}



// socket.addEventListener('message', evt => {
//   const data = evt.data.toString();
//   console.log("message", data);
//   const update_id = Date.now()
//   import(data + `?t=${update_id}`).then(console.log)
// });

