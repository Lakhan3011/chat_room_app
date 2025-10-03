import { WebSocketServer, WebSocket } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

interface User {
    socket: WebSocket;
    // room: string | null;
    username: string | null;
}

const rooms = new Map<string, Set<User>>();


function joinRoom(roomId: string, user: User) {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
    }
    rooms.get(roomId)!.add(user);
}

function leaveRoom(roomId: string, user: User) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.delete(user);

    if (room.size === 0) {
        rooms.delete(roomId);
    }
}

function broadcast(roomId: string, message: any) {
    const room = rooms.get(roomId);
    if (!room) return;

    for (const user of room) {
        if (user.socket.readyState === WebSocket.OPEN) {
            user.socket.send(JSON.stringify(message));
        }
    }
}



function getUserCount(roomId: string) {
    return rooms.get(roomId)?.size || 0;
}

wss.on('connection', (socket) => {

    let currentUserRoom: string = "";
    let currentUser: User | null = null;

    socket.on('message', (message) => {
        try {
            const parsedMessage = JSON.parse(message.toString());

            if (parsedMessage.type === 'join') {
                currentUserRoom = parsedMessage.payload.roomId;
                const username = parsedMessage.payload.username || "Anonymous";

                currentUser = { socket, username }

                joinRoom(currentUserRoom, currentUser);

                // Notify to new user
                socket.send(
                    JSON.stringify({
                        type: "system",
                        message: `✅ Welcome ${username}, you joined room ${currentUserRoom}`,
                        users: getUserCount(currentUserRoom)
                    })
                );

                // notify others
                broadcast(currentUserRoom, {
                    type: "system",
                    message: `😎 ${username} joined the room `,
                    users: getUserCount(currentUserRoom)
                });
            }

            if (parsedMessage.type === 'chat' && currentUserRoom && currentUser) {
                const msg = {
                    type: "chat",
                    room: currentUserRoom,
                    user: currentUser.username,
                    message: parsedMessage.payload.message,
                    timestamp: Date.now(),
                };
                broadcast(currentUserRoom, msg);
            }
        }
        catch (error) {
            console.error(`❌ Invalid message:`, error)
        }
    });

    socket.on('close', () => {
        if (currentUserRoom && currentUser) {
            leaveRoom(currentUserRoom, currentUser);

            broadcast(currentUserRoom, {
                type: "system",
                message: `🚪 ${currentUser.username} has left the room`,
                users: getUserCount(currentUserRoom)
            })

            console.log(`User ${currentUser.username} left room ${currentUserRoom}`);
        }
    });
});

console.log("💬 WebSocket chat server running on ws://localhost:8080");