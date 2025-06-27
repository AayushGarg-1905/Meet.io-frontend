import { useSocket } from '@/context/SocketProvider';
import React, { useEffect, useRef, useState } from 'react';


type ChatMsg = {
  senderId: string,
  receiverId?: string,
  msg: string
}

const ChatBox = ({ roomId }: { roomId: string }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const socket = useSocket();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    socket.emit('get-chat-box-history', { roomId }, (chatHistory: ChatMsg[]) => {
      setMessages(chatHistory || []);
    });

    const handleNewMessage = (newMsg: ChatMsg) => {
      setMessages(prev => [...prev, newMsg]);
    };

    socket.on('update-chat-box-with-new-msg', handleNewMessage);

    return () => {
      socket.off('update-chat-box-with-new-msg', handleNewMessage);
    };
  }, [socket, roomId]);


  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (message.trim() === '') return;
    socket.emit('send-chat-msg', { roomId, msg: message });
    setMessage('');
  };

  return (
    <div className="h-full w-full bg-white flex flex-col border-l border-gray-300 p-2">
      <p className='text-black'>Chat Box</p>
      <div className="flex-1 overflow-y-auto mb-2 space-y-2 pr-1">
        {messages.map((msg, idx) => (
          <div key={idx} className="bg-gray-200 rounded-lg p-2 text-sm text-black">
            {msg.senderId === socket.id ? 'You' : 'Other'}: {msg.msg}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Enter message..."
          className="flex-1 border border-gray-400 rounded-2xl px-3 py-1 text-black"
        />
        <button
          onClick={handleSend}
          className="px-4 py-1 bg-blue-500 text-white rounded-2xl"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
