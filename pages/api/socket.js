import { Server } from 'socket.io';

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    console.log('Socket already running');
  } else {
    console.log('Initializing Socket.io');
    const io = new Server(res.socket.server);
    res.socket.server.io = io;
    
    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);
      
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
      
      socket.on('ping', (data) => {
        socket.emit('pong', { timestamp: new Date().toISOString() });
      });
    });
  }
  res.end();
};

export default SocketHandler;