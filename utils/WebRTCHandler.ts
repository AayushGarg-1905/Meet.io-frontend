import { Socket } from 'socket.io-client'
const peerConfiguration: RTCConfiguration = {
    iceServers: [
        {
            urls: [
                'stun:stun.l.google.com:19302',
                'stun:stun1.l.google.com:19302',
            ],
        },
    ],
};

interface ICECandidatePayload {
    roomId: string;
    role: 'offerer' | 'answerer';
    candidate: RTCIceCandidate;
}

interface OfferPayload {
    roomId: string;
    offer: RTCSessionDescriptionInit;
}

interface AnswerPayload {
    roomId: string;
    answer: RTCSessionDescriptionInit;
}

export default class WebRTCHandler {
    private localVideoRef: React.RefObject<HTMLVideoElement> | null;
    private remoteVideoRef: React.RefObject<HTMLVideoElement> | null;
    private socket: Socket;
    private roomId: string;
    private peerConnection: RTCPeerConnection | null;
    private localStream: MediaStream | null;
    private remoteStream: MediaStream | null;
    private videoSender: RTCRtpSender | null;
    private isScreenSharing: boolean;
    private screenTrack: MediaStreamTrack | null
    private camStream: MediaStream | null;

    constructor(
        localVideoRef: React.RefObject<HTMLVideoElement>,
        remoteVideoRef: React.RefObject<HTMLVideoElement>,
        socket: any,
        roomId: string
    ) {
        this.localVideoRef = localVideoRef;
        this.remoteVideoRef = remoteVideoRef;
        this.socket = socket;
        this.roomId = roomId;
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
        this.videoSender = null;
        this.isScreenSharing = false;
        this.screenTrack = null;
        this.camStream = null;
    }

    async init(isOfferer: boolean): Promise<void> {

        this.camStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });

        this.localStream = this.camStream

        if (this.localVideoRef && this.localVideoRef.current) {
            this.localVideoRef.current.srcObject = this.localStream;
        }

        this.peerConnection = new RTCPeerConnection(peerConfiguration);

        this.remoteStream = new MediaStream();
        if (this.remoteVideoRef && this.remoteVideoRef.current) {
            this.remoteVideoRef.current.srcObject = this.remoteStream;
        }

        this.localStream.getTracks().forEach((track) => {
            console.log('adding local track:', track);
            this.peerConnection?.addTrack(track, this.localStream as MediaStream);
        });

        this.peerConnection.ontrack = (event: RTCTrackEvent) => {
            console.log('ontrack event:', event);
            event.streams[0].getTracks().forEach((track) => {
                this.remoteStream?.addTrack(track);
            });
        };

        this.peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
            console.log('ice candidate found', event);
            if (event.candidate) {
                const role = isOfferer ? 'offerer' : 'answerer';
                const payload: ICECandidatePayload = {
                    roomId: this.roomId,
                    role,
                    candidate: event.candidate,
                };
                this.socket.emit('send-ice-candidate', payload);
            }
        };

        if (isOfferer) {
            console.log('creating offer');
            const offer = await this.peerConnection.createOffer();
            console.log('offer is', offer);
            await this.peerConnection.setLocalDescription(offer);
            const payload: OfferPayload = {
                roomId: this.roomId,
                offer,
            };
            this.socket.emit('send-offer', payload);
        }
    }

    async createAnswerForOffer(offer: RTCSessionDescriptionInit): Promise<void> {
        if (!this.peerConnection) return;
        await this.peerConnection.setRemoteDescription(offer);
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        const payload: AnswerPayload = {
            roomId: this.roomId,
            answer,
        };
        this.socket.emit('send-answer', payload);
    }

    async setRemoteAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
        if (!this.peerConnection) return;
        await this.peerConnection.setRemoteDescription(answer);
    }

    async addIceCandidate(candidate: RTCIceCandidate): Promise<void> {
        if (!this.peerConnection) return;
        try {
            await this.peerConnection.addIceCandidate(candidate);
        } catch (err) {
            console.error('ICE add error:', err);
        }
    }

    async handlePeerLeaveRoom(): Promise<void> {
        if (this.peerConnection) {
            this.peerConnection.onicecandidate = null;
            this.peerConnection.ontrack = null;
            this.peerConnection.close();
            this.peerConnection = null;
        }

        if (this.remoteStream) {
            this.remoteStream.getTracks().forEach((track) => track.stop());
            this.remoteStream = null;
        }

        if (this.remoteVideoRef?.current) {
            this.remoteVideoRef.current.srcObject = null;
        }

        console.log("Peer resources cleaned");
    }

    async endCall(): Promise<void> {
        this.socket.emit('leave-room', { roomId: this.roomId })
        if (this.localStream) {
            this.localStream.getTracks().forEach((track) => track.stop());
            this.localStream = null;
        }

        if (this.camStream) {
            this.camStream.getTracks().forEach((track) => track.stop());
            this.camStream = null;
        }

        if (this.peerConnection) {
            this.peerConnection.onicecandidate = null;
            this.peerConnection.ontrack = null;
            this.peerConnection.close();
            this.peerConnection = null;
        }

        if (this.remoteStream) {
            this.remoteStream.getTracks().forEach((track) => track.stop());
            this.remoteStream = null;
        }

        if (this.localVideoRef?.current) {
            this.localVideoRef.current.srcObject = null;
        }

        if (this.remoteVideoRef?.current) {
            this.remoteVideoRef.current.srcObject = null;
        }

        console.log("Call ended and resources cleaned up.");
    }

    async toggleLocalVideo() {
        if (!this.localStream) {
            return;
        }
        const videoTrack = this.localStream.getVideoTracks()[0];
        videoTrack.enabled = !videoTrack.enabled
        this.socket.emit('update-video-toggle-on-peer', { roomId: this.roomId, isVideoEnabled: videoTrack.enabled });
    }

    async toggleRemoteVideo(isVideoEnabled: boolean) {
        if (!this.remoteStream) {
            return;
        }
        const videoTrack = this.remoteStream.getVideoTracks()[0];
        videoTrack.enabled = isVideoEnabled
    }

    async toggleLocalAudio() {
        if (!this.localStream) {
            return;
        }
        const audioTrack = this.localStream.getAudioTracks()[0];
        audioTrack.enabled = !audioTrack.enabled
        this.socket.emit('update-audio-toggle-on-peer', { roomId: this.roomId, isAudioEnabled: audioTrack.enabled });
    }

    async toggleRemoteAudio(isAudioEnabled: boolean) {
        if (!this.remoteStream) {
            return;
        }
        const audioTrack = this.remoteStream.getAudioTracks()[0];
        audioTrack.enabled = isAudioEnabled
    }

    private async restoreCamera(): Promise<void> {
        if (!this.peerConnection) {
            return;
        };
        if (!this.camStream) {
            return;
        }

        try {
            // const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            const cameraTrack = this.camStream.getVideoTracks()[0];

            if (this.videoSender) {
                await this.videoSender.replaceTrack(cameraTrack);
            }

            this.localStream = this.camStream;
            if (this.localVideoRef?.current) {
                this.localVideoRef.current.srcObject = this.camStream;
            }

            this.isScreenSharing = false;
        } catch (err) {
            console.error("Failed to restore webcam", err);
        }
    }


    async toggleScreenShare(): Promise<void> {
        if (!this.peerConnection) return;

        if (!this.isScreenSharing) {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const screenTrack = screenStream.getVideoTracks()[0];
                this.screenTrack = screenTrack

                if (!this.videoSender) {
                    this.videoSender = this.peerConnection.getSenders().find(s => s.track?.kind === 'video') || null;
                }

                if (this.videoSender) {
                    await this.videoSender.replaceTrack(screenTrack);
                }

                this.localStream = screenStream;
                if (this.localVideoRef?.current) {
                    this.localVideoRef.current.srcObject = screenStream;
                }

                screenTrack.onended = async () => {
                    await this.restoreCamera();
                };

                this.isScreenSharing = true;
            } catch (err) {
                console.error("Screen share failed", err);
            }
        } else {

            if (this.screenTrack) {
                this.screenTrack.stop();
                this.screenTrack = null;
            }

            await this.restoreCamera();
            this.isScreenSharing = false
        }
    }


}
