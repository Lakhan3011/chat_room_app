import { useEffect, useRef, useState } from "react";

function App() {
  const [messages, setMessages] = useState(['hi Boss  ', 'hi lakhan']);
  const [inpValue, setInpValue] = useState("");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");
    ws.onmessage = (event) => {
      setMessages(m => [...m, event.data]);
    }

    wsRef.current = ws;
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'join',
          payload: {
            roomId: 'red'
          }
        })
      )
    }

    return () => {
      ws.close();
    };
  }, [])

  return (
    <div className="h-screen bg-black">
      <div className="h-[92vh] p-8">
        {messages.map((message) =>
          <div className="mt-8">
            <span className="bg-white text-black p-2 rounded "> {message}</span>
          </div>
        )}
      </div>
      <div className="w-full bg-white flex ">
        <input
          value={inpValue}
          onChange={(e) => setInpValue(e.target.value)}
          className="flex-1 p-4 outline-none" type="text" placeholder="Send Message.." />
        <button
          onClick={() => {
            wsRef.current?.send(JSON.stringify({
              type: "chat",
              payload: {
                message: inpValue
              }
            }))
            setInpValue("");
          }}
          className="bg-purple-600 text-white p-4 font-light">Send</button>
      </div>
    </div>
  )
}

export default App
