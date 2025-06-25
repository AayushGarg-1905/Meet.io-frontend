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
    }

    async init(isOfferer: boolean): Promise<void> {
        this.localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });

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

    async toggleLocalVideo(){
        if(!this.localStream){
            return;
        }
        const videoTrack = this.localStream.getVideoTracks()[0];
        videoTrack.enabled = !videoTrack.enabled
        this.socket.emit('update-video-toggle-on-peer',{roomId:this.roomId, isVideoEnabled:videoTrack.enabled});
    }

    async toggleRemoteVideo(isVideoEnabled:boolean){
        if(!this.remoteStream){
            return;
        }
        const videoTrack = this.remoteStream.getVideoTracks()[0];
        videoTrack.enabled = isVideoEnabled
    }

    async toggleLocalAudio(){
        if(!this.localStream){
            return;
        }
        const audioTrack = this.localStream.getAudioTracks()[0];
        audioTrack.enabled = !audioTrack.enabled
        this.socket.emit('update-audio-toggle-on-peer',{roomId:this.roomId, isAudioEnabled:audioTrack.enabled});
    }

    async toggleRemoteAudio(isAudioEnabled:boolean){
        if(!this.remoteStream){
            return;
        }
        const audioTrack = this.remoteStream.getAudioTracks()[0];
        audioTrack.enabled = isAudioEnabled
    }

}
