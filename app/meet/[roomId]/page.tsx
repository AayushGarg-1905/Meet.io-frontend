'use client'
import { useSocket } from '@/context/SocketProvider';
import WebRTCHandler from '@/utils/WebRTCHandler';
import { redirect, useParams } from 'next/navigation'
import React, { useEffect, useRef } from 'react'

interface RoomParams {
  roomId: string;
}

const VideoPage = ({ params }: { params: { roomId: string } }) => {
  const { roomId } = params
  const socket = useSocket();

  const localVideoRef = useRef<HTMLVideoElement>(null) as React.RefObject<HTMLVideoElement>;
  const remoteVideoRef = useRef<HTMLVideoElement>(null) as React.RefObject<HTMLVideoElement>;
  const webRTCRef = useRef<WebRTCHandler | null>(null);

  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit("join-room", roomId);

    webRTCRef.current = new WebRTCHandler(
      localVideoRef,
      remoteVideoRef,
      socket,
      roomId
    );

    socket.on("offer-available", async (offer: RTCSessionDescriptionInit) => {
      console.log("offer-available event");
      await webRTCRef.current?.init(false);
      await webRTCRef.current?.createAnswerForOffer(offer);
    });

    socket.on("receive-offer", async (offer: RTCSessionDescriptionInit) => {
      console.log("offer received");
      await webRTCRef.current?.init(false);
      await webRTCRef.current?.createAnswerForOffer(offer);
    });

    socket.on("receive-answer", async (answer: RTCSessionDescriptionInit) => {
      await webRTCRef.current?.setRemoteAnswer(answer);
    });

    socket.on("receive-ice-candidate", ({ candidate }: { candidate: RTCIceCandidate }) => {
      webRTCRef.current?.addIceCandidate(candidate);
    });

    return () => {
      socket.off("offer-available");
      socket.off("receive-offer");
      socket.off("receive-answer");
      socket.off("receive-ice-candidate");
    };
  }, [socket, roomId]);

  const startCall = async () => {
    console.log("starting call");
    await webRTCRef.current?.init(true);
  };

  const endCall = async()=>{
    console.log('ending call');
    await webRTCRef.current?.endCall();
    redirect('/');
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h2 className="text-xl font-bold">Room ID: {roomId}</h2>
      <div className="flex gap-4 w-[100%] border-2 border-blue-400 ">
        <video ref={localVideoRef} autoPlay muted className="w-1/2 h-1/2 bg-black" />
        <video ref={remoteVideoRef} autoPlay className="w-1/2 h-1/2 bg-black" />
      </div>


      <div className='flex gap-1.5'>
        <button
        onClick={startCall}
        className="bg-blue-500 px-4 py-2 rounded text-white"
      >
        Start call
      </button>
      <button
        onClick={endCall}
        className="bg-red-500 px-4 py-2 rounded text-white"
      >
        End Call
      </button> 
      </div>
      
      
    </div>
  );
}

export default VideoPage