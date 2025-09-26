import { WebSocketServer, WebSocket } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

interface User {
    socket: WebSocket;
    room: string | null;
    username: string | null;
}

let allSockets: User[] = [];

function broadcastToRoom(room: string, message: any) {
    for (const user of allSockets) {
        if (user.room === room && user.socket.readyState === WebSocket.OPEN) {
            user.socket.send(JSON.stringify(message));
        }
    }
}

function getUserCount(room: string) {
    return allSockets.filter((x) => x.room === room).length;
}

wss.on('connection', (socket) => {

    let currentUserRoom: string = "";
    let username: string | null = null;

    socket.on('message', (message) => {
        try {
            const parsedMessage = JSON.parse(message.toString());

            if (parsedMessage.type === 'join') {
                currentUserRoom = parsedMessage.payload.roomId;
                username = parsedMessage.payload.username || "Anonymous";

                // Remove duplicates socket
                allSockets = allSockets.filter((x) => x.socket !== socket);

                allSockets.push({
                    socket,
                    room: currentUserRoom,
                    username
                });

                socket.send(
                    JSON.stringify({
                        type: "system",
                        message: `✅ Welcome ${username}, you joined room ${currentUserRoom}`,
                        users: getUserCount(currentUserRoom)
                    })
                );

                // notify others
                broadcastToRoom(currentUserRoom, {
                    type: "system",
                    message: `😎 ${username} joined the room `,
                    users: getUserCount(currentUserRoom)
                });
            }

            if (parsedMessage.type === 'chat' && currentUserRoom && username) {
                // const currentUserRoom = allSockets.find(x => x.socket === socket)?.room;
                const msg = {
                    type: "chat",
                    room: currentUserRoom,
                    user: username,
                    message: parsedMessage.payload.message,
                    timestamp: Date.now().toString()
                };

                broadcastToRoom(currentUserRoom, msg);
            }
        }
        catch (error) {
            console.error(`❌ Invalid message:`, error)
        }
    });

    socket.on('close', () => {

        if (currentUserRoom && username) {
            allSockets = allSockets.filter((x) => x.socket !== socket);

            broadcastToRoom(currentUserRoom, {
                type: "system",
                message: `🚪 ${username} has left the room`,
                users: getUserCount(currentUserRoom)
            })

            console.log(`User ${username} left room ${currentUserRoom}`);
        }
    });
});

console.log("💬 WebSocket chat server running on ws://localhost:8080");