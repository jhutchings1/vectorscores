# TODO: use paths for each piece

require 'em-websocket'
require 'json'

# Handle user input while server is running
module KeyboardHandler
  include EM::Protocols::LineText2

  def initialize(c)
    @clients = c
  end

  def receive_line(data)
    return unless data =~ /reload/i

    msg = ['', 'ws', 'reload'].to_json

    @clients.each do |socket|
      socket.send msg
    end
  end
end

EM.run do
  @clients = []

  # Update all clients with number of total connections
  def send_n_connections(cid = nil)
    puts "#{@clients.length} connections open"

    msg = [cid, 'ws', 'n', @clients.length].to_json

    @clients.each do |socket|
      socket.send msg
    end
  end

  EM::WebSocket.start(host: '0.0.0.0', port: '4001') do |ws|
    ws.onopen do |handshake|
      puts 'WebSocket connection open'
      cid = rand(36**8).to_s(36) # generate client id
      puts "#{cid} connected to #{handshake.path}."

      @clients << ws

      ws.send [cid, 'ws', 'connected'].to_json

      send_n_connections(cid)
    end

    ws.onclose do
      puts 'Closed.'
      ws.send ['', 'ws', 'closed'].to_json
      @clients.delete ws
      send_n_connections
    end

    ws.onmessage do |msg|
      puts "Received: #{msg}"
      @clients.each do |socket|
        socket.send msg
      end
    end
  end

  EM.open_keyboard(KeyboardHandler, @clients)

  puts 'WebSocket server running... press ctrl-c to stop.'
end
