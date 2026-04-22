// src/hooks/useMediaStream.ts
import { useState, useEffect, useRef, useCallback } from 'react';

interface UseMediaStreamReturn {
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  hasVideo: boolean;
  hasAudio: boolean;
  error: string | null;
  isLoading: boolean;
  requestPermissions: () => Promise<void>;
  stopStream: () => void;
}

export function useMediaStream(autoStart = false): UseMediaStreamReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const requestPermissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });

      setStream(mediaStream);
      setHasVideo(mediaStream.getVideoTracks().length > 0);
      setHasAudio(mediaStream.getAudioTracks().length > 0);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Camera/microphone access denied. Please allow permissions and refresh.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera or microphone found. Please connect a device and try again.');
      } else {
        setError('Could not access media devices: ' + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopStream = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setHasVideo(false);
    setHasAudio(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  }, [stream]);

  useEffect(() => {
    if (autoStart) requestPermissions();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [autoStart]);

  return { stream, videoRef, hasVideo, hasAudio, error, isLoading, requestPermissions, stopStream };
}
