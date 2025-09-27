import { useEffect, useRef, useState } from "react";

function App() {
  const [messages, setMessages] = useState<{ user: string; message: string }[]>([]);
  const [inpValue, setInpValue] = useState("");
  const usernameRef = useRef<string | null>(null);
  const roomRef = useRef<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [status, setStatus] = useState("Disconnected ❌")
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!joined) return;

    const ws = new WebSocket("ws://localhost:8080");

    ws.onopen = () => {
      setStatus("Connected ✅")

      ws.send(
        JSON.stringify({
          type: 'join',
          payload: {
            roomId: roomRef.current,
            username: usernameRef.current
          },
        })
      );
    };

    ws.onmessage = (event) => {
      const parsedMsg = JSON.parse(event.data);
      setMessages(m => [...m, parsedMsg]);
    }

    ws.onclose = () => setStatus("Disconnected ❌");
    ws.onerror = () => setStatus("Error 💀")

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [joined]);

  // auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages])

  function sendMessage() {
    if (!inpValue.trim()) return;
    wsRef.current?.send(JSON.stringify({
      type: "chat",
      payload: {
        message: inpValue
      }
    })
    );
    setInpValue("");
  };

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-purple-700 p-4 text-white font-extralight flex justify-between">
        <span>ChatRoom App</span>
        <span>{status}</span>
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-4 flex justify-between text-black">
        <div className="flex gap-6">
          <input
            type="text"
            className="p-2 rounded outline-none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter Username"
          //disabled={joined}
          />

          <input
            type="text"
            className="p-2 rounded outline-none"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter Room ID"
          //disabled={joined}
          />
        </div>
        <div>
          <button
            onClick={() => {
              const name = username.trim();
              const room = roomId.trim();
              if (!name || !room) return;

              // set refs
              usernameRef.current = name;
              roomRef.current = room;
              setJoined(true);

              // clear only the form inputs
              setUsername('');
              setRoomId('');
            }
            }
            className="bg-purple-600 text-white p-2 rounded"
          >
            Join Room
          </button>
        </div>
      </div>

      {/* Message */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, i) =>
          <div
            key={i}
            className={`flex ${msg.user === usernameRef.current ? "justify-end" : 'justify-start'}`}
          >
            <div
              className=
              {`p-2 rounded-lg max-w-[60%] break-words shadow-md
                ${msg.user === usernameRef.current ? 'bg-purple-600 text-white' : 'bg-gray-200 text-black'}`
              }
            >
              <b>{msg.user}:</b> {msg.message}
            </div>
          </div>
        )}
        <div ref={bottomRef}></div>
      </div>

      {/* Input */}
      <div className="w-full bg-white flex ">
        <input
          value={inpValue}
          onChange={(e) => setInpValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 p-4 outline-none"
          type="text"
          placeholder="Send Message.." />
        <button
          onClick={sendMessage}
          className="bg-purple-600 text-white p-4 font-light"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
