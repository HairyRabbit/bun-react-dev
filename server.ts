function create_server() {
  const server = Bun.serve({
    fetch() {
      return new Response("File not found", {
        status: 404,
      })
    }
  })

  return server
}