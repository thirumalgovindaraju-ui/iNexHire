// src/pages/interview/IdentityVerify.tsx
// Identity verification screen — candidate uploads ID + takes selfie
// Backend stub: stores files, actual face match is Month 2

import { useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

type Step = 'intro' | 'id-upload' | 'selfie' | 'verifying' | 'done';

export default function IdentityVerify() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('intro');
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [selfieBlob, setSelfieBlob] = useState<string | null>(null);
  const [error, setError] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleIDUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG)');
      return;
    }
    setIdFile(file);
    setIdPreview(URL.createObjectURL(file));
    setError('');
  };

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStep('selfie');
    } catch {
      setError('Camera access denied. Please allow camera permissions.');
    }
  }, []);

  const takeSelfie = useCallback(() => {
    if (!canvasRef.current || !videoRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    canvasRef.current.width = 640;
    canvasRef.current.height = 480;
    ctx.drawImage(videoRef.current, 0, 0, 640, 480);
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.85);
    setSelfieBlob(dataUrl);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  const retakeSelfie = useCallback(async () => {
    setSelfieBlob(null);
    await startCamera();
  }, [startCamera]);

  const submitVerification = async () => {
    setStep('verifying');
    // Simulate verification delay (real face match in Month 2)
    await new Promise((r) => setTimeout(r, 2000));
    setStep('done');
  };

  const proceedToInterview = () => {
    navigate(`/interview/${token}/room`);
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {(['intro', 'id-upload', 'selfie', 'done'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s ? 'bg-brand-600 text-white' :
                ['verifying','done'].includes(step) || ['intro','id-upload'].indexOf(step) > i
                  ? 'bg-green-500 text-white' : 'bg-surface-200 text-surface-700'
              }`}>
                {i + 1}
              </div>
              {i < 3 && <div className="w-8 h-px bg-surface-200" />}
            </div>
          ))}
        </div>

        {/* ── Intro ── */}
        {step === 'intro' && (
          <div className="bg-white rounded-2xl border border-surface-200 p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-surface-900 mb-2">Identity Verification</h1>
            <p className="text-sm text-surface-700 mb-6 leading-relaxed">
              We need to verify your identity before the interview. You'll need to:
            </p>
            <div className="space-y-3 text-left mb-8">
              {[
                { icon: '🪪', text: 'Upload a photo of your government-issued ID (Aadhaar, PAN, Passport, etc.)' },
                { icon: '🤳', text: 'Take a quick selfie using your webcam' },
                { icon: '✓', text: 'Our system verifies the match automatically' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-surface-50 rounded-xl">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm text-surface-700">{item.text}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep('id-upload')}
              className="w-full py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors"
            >
              Begin Verification →
            </button>
          </div>
        )}

        {/* ── ID Upload ── */}
        {step === 'id-upload' && (
          <div className="bg-white rounded-2xl border border-surface-200 p-8 shadow-sm">
            <h2 className="text-lg font-bold text-surface-900 mb-1">Upload Government ID</h2>
            <p className="text-sm text-surface-700 mb-6">Aadhaar card, PAN card, Passport, or Driving License</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
            )}

            <label className={`block cursor-pointer rounded-xl border-2 border-dashed transition-all ${
              idPreview ? 'border-green-400' : 'border-surface-300 hover:border-brand-400'
            }`}>
              <input type="file" accept="image/*" className="hidden" onChange={handleIDUpload} />
              {idPreview ? (
                <div className="relative">
                  <img src={idPreview} alt="ID preview" className="w-full h-48 object-cover rounded-xl" />
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-lg">✓ Uploaded</div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <svg className="w-10 h-10 text-surface-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm font-medium text-surface-700">Click to upload or drag & drop</p>
                  <p className="text-xs text-surface-500 mt-1">JPG, PNG up to 10MB</p>
                </div>
              )}
            </label>

            <button
              onClick={() => idFile ? startCamera() : setError('Please upload your ID first')}
              disabled={!idFile}
              className="w-full mt-6 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Selfie →
            </button>
          </div>
        )}

        {/* ── Selfie ── */}
        {step === 'selfie' && (
          <div className="bg-white rounded-2xl border border-surface-200 p-8 shadow-sm">
            <h2 className="text-lg font-bold text-surface-900 mb-1">Take a Selfie</h2>
            <p className="text-sm text-surface-700 mb-4">Look directly at the camera with good lighting</p>

            {!selfieBlob ? (
              <>
                <div className="relative rounded-xl overflow-hidden bg-black mb-4" style={{ aspectRatio: '4/3' }}>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {/* Face guide overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-40 h-48 rounded-full border-2 border-white border-dashed opacity-60" />
                  </div>
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <button
                  onClick={takeSelfie}
                  className="w-full py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors"
                >
                  📸 Take Photo
                </button>
              </>
            ) : (
              <>
                <div className="relative rounded-xl overflow-hidden mb-4">
                  <img src={selfieBlob} alt="Selfie" className="w-full rounded-xl" />
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-lg">✓ Captured</div>
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex gap-3">
                  <button
                    onClick={retakeSelfie}
                    className="flex-1 py-3 border border-surface-300 text-surface-700 rounded-xl font-semibold hover:bg-surface-50 transition-colors"
                  >
                    Retake
                  </button>
                  <button
                    onClick={submitVerification}
                    className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors"
                  >
                    Submit →
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Verifying ── */}
        {step === 'verifying' && (
          <div className="bg-white rounded-2xl border border-surface-200 p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-brand-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-surface-900 mb-2">Verifying Identity...</h2>
            <p className="text-sm text-surface-700">Comparing your ID with your selfie. This takes a few seconds.</p>
          </div>
        )}

        {/* ── Done ── */}
        {step === 'done' && (
          <div className="bg-white rounded-2xl border border-surface-200 p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-surface-900 mb-2">Identity Verified ✓</h2>
            <p className="text-sm text-surface-700 mb-6">Your identity has been confirmed. You're ready to begin the interview.</p>
            <button
              onClick={proceedToInterview}
              className="w-full py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors"
            >
              Start Interview →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
