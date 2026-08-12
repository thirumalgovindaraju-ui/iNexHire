# How to Wire Proctoring into InterviewRoom.tsx

## Add these lines to InterviewRoom.tsx

### 1. Import the hook (add after existing imports)
```typescript
import { useProctoring } from '../../hooks/useProctoring';
```

### 2. Add hook inside the component (after existing state declarations)
```typescript
const {
  startFaceMonitoring,
  stopFaceMonitoring,
  startAudioMonitoring,
  trackResponseTiming,
} = useProctoring({
  interviewId: session?.interviewId ?? '',
  enabled: !!session?.interviewId,
});
```

### 3. Start face + audio monitoring when stream is ready
Find the existing `useEffect` that sets up the camera stream and add:
```typescript
// After: if (videoRef.current) videoRef.current.srcObject = s;
startFaceMonitoring(videoRef.current!);
startAudioMonitoring(s);
```

### 4. Stop monitoring on cleanup
In the same effect's return:
```typescript
return () => {
  stream?.getTracks().forEach((t) => t.stop());
  stopFaceMonitoring(); // ← ADD THIS
};
```

### 5. Track response timing (detect suspicious pauses)
Find where the recording starts (isRecording = true) and add:
```typescript
const questionStartTime = Date.now();
// ... existing recording start code ...
// When candidate starts speaking, call:
trackResponseTiming(questionStartTime);
```

## Claude Code Prompt for proctoring integration

Paste this into Claude Code:

```
Integrate the proctoring system into NexHire:

1. Copy enterprise/useProctoring.ts to frontend/src/hooks/useProctoring.ts

2. Integrate into frontend/src/pages/interview/InterviewRoom.tsx:
   - Import useProctoring hook
   - Initialize with session.interviewId
   - Call startFaceMonitoring(videoRef.current) after camera stream is ready
   - Call startAudioMonitoring(stream) after stream is ready
   - Call stopFaceMonitoring() in stream cleanup
   - Call trackResponseTiming() when recording starts

3. Copy enterprise/proctoring.routes.ts to backend/src/routes/proctoring.routes.ts
   - Remove the schema comment block (lines 1-40) — those are instructions only
   - Keep only the router code starting from the imports

4. Add to backend/prisma/schema.prisma:
   - Add to enum ProctorEventType: AUDIO_ANOMALY, LOOKING_AWAY, PHONE_DETECTED, 
     READING_FROM_SCREEN, LIP_SYNC_MISMATCH, BACKGROUND_VOICE, SUSPICIOUS_PAUSE, 
     IDENTITY_MISMATCH
   - Add new model ProctoringReport (schema in proctoring.routes.ts comment block)
   - Add back-relation to Interview model: proctoringReport ProctoringReport?

5. Add to backend/src/services/ai.service.ts:
   - Append the analyseProctoringData() function from proctoring.routes.ts Part 2
   - Remove the "PART 2" comment header

6. Register in app.ts:
   import proctoringRoutes from './routes/proctoring.routes';
   app.use('/api/proctoring', proctoringRoutes);

7. Copy enterprise/ProctoringDashboard.tsx to 
   frontend/src/pages/recruiter/ProctoringDashboard.tsx

8. Add route in frontend router:
   { path: '/proctoring', element: <ProctoringDashboard /> }
   And add to sidebar navigation as "Proctoring" with Shield icon

9. Run migration:
   cd backend && set NODE_TLS_REJECT_UNAUTHORIZED=0 && npx prisma migrate dev --name add_proctoring_report

10. Commit:
    git add . && git commit -m "feat: AI proctoring system - real-time malpractice detection with Claude analysis" && git push

Do not touch auth, opening, candidate, or report routes.
```
