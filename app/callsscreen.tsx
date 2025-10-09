import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from './contexts/AuthContext';
import { CallData, CallEventHandlers, callingService } from './services/callingService';

export default function CallsScreen() {
  const [currentCall, setCurrentCall] = useState<CallData | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  
  // Add better error handling for auth context
  const auth = useAuth();
  const user = auth?.user;
  const isLoading = auth?.isLoading;
  
  console.log('🔧 CallsScreen rendering with user:', user?.uid, 'loading:', isLoading);

  useEffect(() => {
    const initializeCallingService = async () => {
      if (!user || isLoading) return;

      const handlers: CallEventHandlers = {
        onIncomingCall: (callData: CallData) => {
          setCurrentCall(callData);
          setIsIncomingCall(true);
          setIsCallActive(false);
          Alert.alert(
            'Incoming Call',
            `${callData.callerName} is calling you`,
            [
              { text: 'Decline', onPress: () => callingService.declineCall() },
              { text: 'Accept', onPress: () => callingService.acceptCall() }
            ]
          );
        },
        onCallAccepted: (callData: CallData) => {
          setCurrentCall(callData);
          setIsCallActive(true);
          setIsIncomingCall(false);
        },
        onCallDeclined: (callData: CallData) => {
          setCurrentCall(null);
          setIsIncomingCall(false);
          setIsCallActive(false);
          Alert.alert('Call Declined', `${callData.receiverName} declined your call`);
        },
        onCallEnded: (callData: CallData) => {
          setCurrentCall(null);
          setIsCallActive(false);
          setIsIncomingCall(false);
          setCallDuration(0);
        },
        onCallError: (error: string) => {
          Alert.alert('Call Error', error);
          setCurrentCall(null);
          setIsCallActive(false);
          setIsIncomingCall(false);
        }
      };

      try {
        await callingService.initialize(user.uid, handlers);
      } catch (error) {
        console.error('Failed to initialize calling service:', error);
      }
    };

    if (user) {
      initializeCallingService();
    }
    
    // Update call duration every second when call is active
    let interval: any;
    if (isCallActive && currentCall?.startTime) {
      interval = setInterval(() => {
        const duration = Math.floor((Date.now() - currentCall.startTime!.getTime()) / 1000);
        setCallDuration(duration);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCallActive, currentCall, user, isLoading]);

  const resetCallState = () => {
    setCurrentCall(null);
    setIsCallActive(false);
    setIsIncomingCall(false);
    setCallDuration(0);
    setIsMuted(false);
    setIsSpeakerOn(false);
  };

  const acceptCall = async () => {
    try {
      await callingService.acceptCall();
      setIsCallActive(true);
      setIsIncomingCall(false);
    } catch (error) {
      console.error('Error accepting call:', error);
      Alert.alert('Error', 'Failed to accept call');
    }
  };

  const declineCall = () => {
    callingService.declineCall();
    resetCallState();
  };

  const endCall = () => {
    callingService.endCall();
    resetCallState();
  };

  const toggleMute = async () => {
    const success = await callingService.toggleMute();
    if (success) {
      setIsMuted(!isMuted);
    }
  };

  const toggleSpeaker = async () => {
    const success = await callingService.toggleSpeaker();
    if (success) {
      setIsSpeakerOn(!isSpeakerOn);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getContactInitial = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  // Show loading if auth is not ready or still loading
  if (!auth || isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.noCallContainer}>
          <Text style={styles.noCallTitle}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!currentCall) {
    return (
      <View style={styles.container}>
        <View style={styles.noCallContainer}>
          <Ionicons name="call-outline" size={80} color="#BDBDBD" />
          <Text style={styles.noCallTitle}>No Active Calls</Text>
          <Text style={styles.noCallSubtitle}>
            Calls will appear here when you receive or make them
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      { backgroundColor: currentCall.type === 'video' ? '#000' : '#2196F3' }
    ]}>
      {/* Call Info */}
      <View style={styles.callInfo}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getContactInitial(isIncomingCall ? currentCall.callerName : currentCall.receiverName)}
            </Text>
          </View>
        </View>
        
        <Text style={styles.contactName}>
          {isIncomingCall ? currentCall.callerName : currentCall.receiverName}
        </Text>
        
        <Text style={styles.callStatus}>
          {isIncomingCall ? 'Incoming call...' : 
           isCallActive ? formatDuration(callDuration) : 'Calling...'}
        </Text>
        
        <Text style={styles.callType}>
          {currentCall.type === 'video' ? '📹 Video Call' : '📞 Voice Call'}
        </Text>
      </View>

      {/* Video Call Area */}
      {currentCall.type === 'video' && isCallActive && (
        <View style={styles.videoContainer}>
          <View style={styles.remoteVideoPlaceholder}>
            <Ionicons name="videocam-off" size={40} color="#FFF" />
            <Text style={styles.videoPlaceholderText}>Remote Video</Text>
          </View>
          
          <View style={styles.localVideoPlaceholder}>
            <Ionicons name="videocam" size={20} color="#FFF" />
            <Text style={styles.localVideoText}>You</Text>
          </View>
        </View>
      )}

      {/* Call Actions */}
      <View style={styles.actionsContainer}>
        {isIncomingCall ? (
          // Incoming call actions
          <View style={styles.incomingActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={declineCall}
            >
              <Ionicons name="call" size={30} color="#FFF" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={acceptCall}
            >
              <Ionicons name="call" size={30} color="#FFF" />
            </TouchableOpacity>
          </View>
        ) : (
          // Active call actions
          <View style={styles.activeCallActions}>
            <TouchableOpacity
              style={[styles.actionButton, isMuted && styles.actionButtonActive]}
              onPress={toggleMute}
            >
              <Ionicons name={isMuted ? "mic-off" : "mic"} size={24} color="#FFF" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.endCallButton]}
              onPress={endCall}
            >
              <Ionicons name="call" size={30} color="#FFF" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, isSpeakerOn && styles.actionButtonActive]}
              onPress={toggleSpeaker}
            >
              <Ionicons name="volume-high" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Additional Controls for Video Calls */}
      {currentCall.type === 'video' && isCallActive && (
        <View style={styles.videoControls}>
          <TouchableOpacity style={styles.videoControlButton}>
            <Ionicons name="videocam" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.videoControlButton}>
            <Ionicons name="camera-reverse" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.videoControlButton}>
            <Ionicons name="images" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  noCallContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  noCallTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#757575',
    marginTop: 20,
    marginBottom: 8,
  },
  noCallSubtitle: {
    fontSize: 16,
    color: '#9E9E9E',
    textAlign: 'center',
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  callInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  avatarContainer: {
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
  },
  contactName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  callStatus: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  callType: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  remoteVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#424242',
  },
  videoPlaceholderText: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 8,
  },
  localVideoPlaceholder: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 120,
    height: 160,
    backgroundColor: '#616161',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  localVideoText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 4,
  },
  actionsContainer: {
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  incomingActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  activeCallActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  declineButton: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
    transform: [{ rotate: '135deg' }],
  },
  endCallButton: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
    transform: [{ rotate: '135deg' }],
  },
  videoControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 20,
  },
  videoControlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
