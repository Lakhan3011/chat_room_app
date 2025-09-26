import { WebSocketServer, WebSocket } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

interface User {
    socket: WebSocket;
    room: string | null;
}

let allSockets: User[] = [];

wss.on('connection', (socket) => {

    let currentUserRoom: string | null = null;

    socket.on('message', (message) => {
        try {
            const parsedMessage = JSON.parse(message.toString());

            if (parsedMessage.type === 'join') {
                currentUserRoom = parsedMessage.payload.roomId;

                // Remove duplicates socket
                allSockets = allSockets.filter((x) => x.socket !== socket);

                allSockets.push({
                    socket,
                    room: currentUserRoom
                });

                socket.send(
                    JSON.stringify({
                        type: "system",
                        message: `✅ Joined room ${currentUserRoom}`
                    })
                );
            }

            if (parsedMessage.type === 'chat' && currentUserRoom) {
                // const currentUserRoom = allSockets.find(x => x.socket === socket)?.room;
                const msg = {
                    type: "chat",
                    room: currentUserRoom,
                    message: parsedMessage.payload.message,
                    timestamp: Date.now().toString()
                }

                // const totalUsers = allSockets.find((x) => x.room === currentUserRoom);

                for (const user of allSockets) {
                    if (user.room === currentUserRoom && user.socket.readyState === WebSocket.OPEN) {
                        user.socket.send(JSON.stringify(msg));
                    }
                }

                // for (let i = 0; i < allSockets.length; i++) {
                //     if (allSockets[i]?.room === currentUserRoom) {
                //         allSockets[i]?.socket.send(parsedMessage.payload.message);
                //     }
                // }
            }
        }
        catch (error) {
            console.error(`❌ Invalid message:`, error)
        }
    });

    socket.on('close', () => {
        allSockets = allSockets.filter((x) => x.socket !== socket);
        if (currentUserRoom) {
            console.log(`User left room ${currentUserRoom}`);
        }
    });
});

console.log("💬 WebSocket chat server running on ws://localhost:8080");