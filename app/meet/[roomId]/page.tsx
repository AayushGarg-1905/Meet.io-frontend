'use client'
import { useSocket } from '@/context/SocketProvider';
import WebRTCHandler from '@/utils/WebRTCHandler';
import { redirect, useParams } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import {
  IoMdMic,
  IoMdMicOff,
  IoVideocam,
  IoVideocamOff,
  FcEndCall,
  HiPhoneXMark,
  IoChatboxEllipses,
} from '@/components/Meet/icons'
import ChatBox from '@/components/Meet/ChatBox';

interface RoomParams {
  roomId: string;
}

const VideoPage = ({ params }: { params: { roomId: string } }) => {
  const { roomId } = params
  const socket = useSocket();

  const localVideoRef = useRef<HTMLVideoElement>(null) as React.RefObject<HTMLVideoElement>;
  const remoteVideoRef = useRef<HTMLVideoElement>(null) as React.RefObject<HTMLVideoElement>;
  const webRTCRef = useRef<WebRTCHandler | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isChatBoxOpen, setIsChatBoxOpen] = useState(false);


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

    socket.on('peer-leave-room', () => {
      webRTCRef.current?.handlePeerLeaveRoom();
    })

    socket.on('update-video-toggle-on-peer', async ({ isVideoEnabled }) => {
      await webRTCRef.current?.toggleRemoteVideo(isVideoEnabled);
    })

    socket.on('update-audio-toggle-on-peer', async ({ isAudioEnabled }) => {
      await webRTCRef.current?.toggleRemoteAudio(isAudioEnabled);
    })

    return () => {
      socket.off("offer-available");
      socket.off("receive-offer");
      socket.off("receive-answer");
      socket.off("receive-ice-candidate");
      socket.off('peer-leave-room');
      socket.off('update-video-toggle-on-peer');
      socket.off('update-audio-toggle-on-peer')
    };
  }, [socket, roomId]);

  const startCall = async () => {
    console.log("starting call");
    await webRTCRef.current?.init(true);
  };

  const endCall = async () => {
    console.log('ending call');
    await webRTCRef.current?.endCall();
    redirect('/');
  }

  const toggleVideo = async () => {
    if (!localVideoRef.current) return;
    await webRTCRef.current?.toggleLocalVideo();
    setIsVideoOn((prev) => !prev);

  };

  const toggleAudio = async () => {
    if (!localVideoRef.current) return;
    await webRTCRef.current?.toggleLocalAudio();
    setIsAudioOn((prev) => !prev);
  };

  return (


    <div className="flex flex-col items-center gap-4 p-4">
      <h2 className="text-xl font-bold">Room ID: {roomId}</h2>

      <div className="flex gap-4 h-full w-full border-2 border-blue-400">

        <div className={`${isChatBoxOpen ? 'w-[95%]' : 'w-full'} flex`}>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            className="w-1/2 bg-black"
          />
          {remoteVideoRef.current?.srcObject !== null && (
            <video
              ref={remoteVideoRef}
              autoPlay
              className="w-1/2 bg-black"
            />
          )}
        </div>
        {isChatBoxOpen && (
          <div className="w-[25%] border-l border-gray-300">
            <ChatBox roomId={roomId} />
          </div>
        )}
      </div>


      <div className="flex gap-1.5">
        <button onClick={startCall} className="bg-blue-500 px-4 py-2 rounded text-white">
          Join call
        </button>

            <button onClick={toggleVideo} className="bg-gray-700 px-4 py-2 rounded text-white">
              {isVideoOn ? <IoVideocam /> : <IoVideocamOff />}
            </button>
            <button onClick={toggleAudio} className="bg-gray-700 px-4 py-2 rounded text-white">
              {isAudioOn ? <IoMdMic /> : <IoMdMicOff />}
            </button>
            <button onClick={() => setIsChatBoxOpen(prev => !prev)} className="bg-gray-700 px-4 py-2 rounded text-white">
              <IoChatboxEllipses />
            </button>
        <button onClick={endCall} className="bg-red-500 px-4 py-2 rounded text-white">
          <HiPhoneXMark />
        </button>
      </div>
      
    </div>

  );
}

export default VideoPage