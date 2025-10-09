import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../utils/socketConfig';

export interface CallData {
  callId: string;
  callerId: string;
  callerName: string;
  receiverId: string;
  receiverName: string;
  type: 'voice' | 'video';
  status: 'ringing' | 'active' | 'ended' | 'declined' | 'missed';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

export interface CallEventHandlers {
  onIncomingCall: (callData: CallData) => void;
  onCallAccepted: (callData: CallData) => void;
  onCallDeclined: (callData: CallData) => void;
  onCallEnded: (callData: CallData) => void;
  onCallError: (error: string) => void;
}

class CallingService {
  private socket: Socket | null = null;
  private currentCall: CallData | null = null;
  private audioRecording: Audio.Recording | null = null;
  private eventHandlers: CallEventHandlers | null = null;

  /**
   * Initialize calling service
   */
  async initialize(userId: string, handlers: CallEventHandlers): Promise<void> {
    try {
      this.eventHandlers = handlers;
      
      // Request audio permissions
      await this.requestAudioPermissions();
      
      // Connect to socket for call signaling
      await this.connectSocket(userId);
      
      console.log('✅ Calling service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize calling service:', error);
      throw error;
    }
  }

  /**
   * Request audio permissions
   */
  private async requestAudioPermissions(): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Audio permission not granted');
        }
        
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      }
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
      throw error;
    }
  }

  /**
   * Connect to socket for call signaling
   */
  private async connectSocket(userId: string): Promise<void> {
    try {
      const socketUrl = getSocketUrl();
      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });

      this.socket.emit('user-online', { userId });

      // Listen for call events
      this.socket.on('incoming-call', (callData: CallData) => {
        console.log('📞 Incoming call:', callData);
        this.currentCall = callData;
        this.eventHandlers?.onIncomingCall(callData);
      });

      this.socket.on('call-accepted', (callData: CallData) => {
        console.log('✅ Call accepted:', callData);
        this.currentCall = { ...callData, status: 'active', startTime: new Date() };
        this.eventHandlers?.onCallAccepted(callData);
      });

      this.socket.on('call-declined', (callData: CallData) => {
        console.log('❌ Call declined:', callData);
        this.currentCall = null;
        this.eventHandlers?.onCallDeclined(callData);
      });

      this.socket.on('call-ended', (callData: CallData) => {
        console.log('📵 Call ended:', callData);
        this.endCall();
        this.eventHandlers?.onCallEnded(callData);
      });

      this.socket.on('call-error', (error: string) => {
        console.error('☎️ Call error:', error);
        this.eventHandlers?.onCallError(error);
      });

      console.log('🔌 Socket connected for calling');
    } catch (error) {
      console.error('Failed to connect socket:', error);
      throw error;
    }
  }

  /**
   * Initiate a voice call
   */
  async makeVoiceCall(receiverId: string, receiverName: string, callerId: string, callerName: string): Promise<void> {
    if (!this.socket) {
      throw new Error('Calling service not initialized');
    }

    const callData: CallData = {
      callId: Math.random().toString(36).substr(2, 9),
      callerId,
      callerName,
      receiverId,
      receiverName,
      type: 'voice',
      status: 'ringing',
    };

    this.currentCall = callData;
    this.socket.emit('initiate-call', callData);
    
    console.log('📞 Initiated voice call to:', receiverName);
  }

  /**
   * Initiate a video call
   */
  async makeVideoCall(receiverId: string, receiverName: string, callerId: string, callerName: string): Promise<void> {
    if (!this.socket) {
      throw new Error('Calling service not initialized');
    }

    const callData: CallData = {
      callId: Math.random().toString(36).substr(2, 9),
      callerId,
      callerName,
      receiverId,
      receiverName,
      type: 'video',
      status: 'ringing',
    };

    this.currentCall = callData;
    this.socket.emit('initiate-call', callData);
    
    console.log('📹 Initiated video call to:', receiverName);
  }

  /**
   * Accept incoming call
   */
  async acceptCall(): Promise<void> {
    if (!this.currentCall || !this.socket) {
      throw new Error('No incoming call to accept');
    }

    this.socket.emit('accept-call', {
      callId: this.currentCall.callId,
      callerId: this.currentCall.callerId,
    });

    this.currentCall.status = 'active';
    this.currentCall.startTime = new Date();
    
    // Start audio recording for voice transmission
    await this.startAudioRecording();
    
    console.log('✅ Call accepted');
  }

  /**
   * Decline incoming call
   */
  declineCall(): void {
    if (!this.currentCall || !this.socket) {
      return;
    }

    this.socket.emit('decline-call', {
      callId: this.currentCall.callId,
      callerId: this.currentCall.callerId,
    });

    this.currentCall = null;
    console.log('❌ Call declined');
  }

  /**
   * End current call
   */
  endCall(): void {
    if (!this.currentCall || !this.socket) {
      return;
    }

    const duration = this.currentCall.startTime 
      ? Date.now() - this.currentCall.startTime.getTime() 
      : 0;

    this.socket.emit('end-call', {
      callId: this.currentCall.callId,
      duration,
    });

    this.stopAudioRecording();
    this.currentCall = null;
    
    console.log('📵 Call ended');
  }

  /**
   * Start audio recording for voice transmission
   */
  private async startAudioRecording(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        console.log('📱 Web audio recording not implemented in this demo');
        return;
      }

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      this.audioRecording = recording;
      console.log('🎤 Audio recording started');
    } catch (error) {
      console.error('Error starting audio recording:', error);
    }
  }

  /**
   * Stop audio recording
   */
  private async stopAudioRecording(): Promise<void> {
    try {
      if (this.audioRecording) {
        await this.audioRecording.stopAndUnloadAsync();
        this.audioRecording = null;
        console.log('🎤 Audio recording stopped');
      }
    } catch (error) {
      console.error('Error stopping audio recording:', error);
    }
  }

  /**
   * Get current call data
   */
  getCurrentCall(): CallData | null {
    return this.currentCall;
  }

  /**
   * Check if currently in a call
   */
  isInCall(): boolean {
    return this.currentCall?.status === 'active';
  }

  /**
   * Toggle mute during call
   */
  async toggleMute(): Promise<boolean> {
    if (!this.isInCall()) {
      return false;
    }

    try {
      if (this.audioRecording) {
        // In a real implementation, you would mute/unmute the audio stream
        console.log('🔇 Toggled mute');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error toggling mute:', error);
      return false;
    }
  }

  /**
   * Toggle speaker during call
   */
  async toggleSpeaker(): Promise<boolean> {
    if (!this.isInCall()) {
      return false;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false, // Toggle this for speaker
      });
      
      console.log('🔊 Toggled speaker');
      return true;
    } catch (error) {
      console.error('Error toggling speaker:', error);
      return false;
    }
  }

  /**
   * Disconnect calling service
   */
  disconnect(): void {
    if (this.currentCall) {
      this.endCall();
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.stopAudioRecording();
    console.log('📵 Calling service disconnected');
  }
}

export const callingService = new CallingService();