// src/App.tsx — NexHire v3 Complete Enterprise Edition
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';
import CandidateLayout from './layouts/CandidateLayout';
// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
// Core
import Dashboard from './pages/recruiter/Dashboard';
import Openings from './pages/recruiter/Openings';
import CreateOpening from './pages/recruiter/CreateOpening';
import OpeningDetail from './pages/recruiter/OpeningDetail';
import Candidates from './pages/recruiter/Candidates';
import CandidateDetail from './pages/recruiter/CandidateDetail';
import ReportDetail from './pages/recruiter/ReportDetail';
import Analytics from './pages/recruiter/Analytics';
import JobTemplates from './pages/recruiter/JobTemplates';
import EPFOVerification from './pages/recruiter/EPFOVerification';
import ScheduleLiveInterview from './pages/recruiter/ScheduleLiveInterview';
import LiveInterviewRoom from './pages/interview/LiveInterviewRoom';
// Enterprise v2
import Compliance from './pages/recruiter/Compliance';
import OfferLetters from './pages/recruiter/OfferLetters';
import TalentPool from './pages/recruiter/TalentPool';
import Integrations from './pages/recruiter/Integrations';
import PipelineBoard from './pages/recruiter/PipelineBoard';
import AuditLogs from './pages/recruiter/AuditLogs';
// Enterprise v3
import SentimentAnalysis from './pages/recruiter/SentimentAnalysis';
import CultureFit from './pages/recruiter/CultureFit';
import CandidateRanking from './pages/recruiter/CandidateRanking';
import ScorecardBuilder from './pages/recruiter/ScorecardBuilder';
import WhiteLabel from './pages/recruiter/WhiteLabel';
import CollaborativeReview from './pages/recruiter/CollaborativeReview';
import MockMate from './pages/recruiter/MockMate';
import VideoHighlights from './pages/recruiter/VideoHighlights';
import MultiLanguage from './pages/recruiter/MultiLanguage';
import Notifications from './pages/recruiter/Notifications';
// Enterprise v3 continued
import CandidateChatbot from './pages/recruiter/CandidateChatbot';
import PredictiveRetention from './pages/recruiter/PredictiveRetention';
import WhatsAppCenter from './pages/recruiter/WhatsAppCenter';
import GroupDiscussion from './pages/recruiter/GroupDiscussion';
import CompensationBenchmark from './pages/recruiter/CompensationBenchmark';
import GDRoom from './pages/interview/GDRoom';
// Toastmasters Meeting Manager
import ToastmastersMeetingsList from './pages/toastmasters/MeetingsList';
import ToastmastersMembers from './pages/toastmasters/Members';
import ToastmastersNewMeeting from './pages/toastmasters/NewMeeting';
import ToastmastersMeetingDetail from './pages/toastmasters/MeetingDetail';
import ToastmastersRunMeeting from './pages/toastmasters/RunMeeting';
import ToastmastersRoleAssignment from './pages/toastmasters/RoleAssignment';
import ToastmastersAhCounterLive from './pages/toastmasters/AhCounterLive';
import ToastmastersEvaluate from './pages/toastmasters/Evaluate';
import ToastmastersReport from './pages/toastmasters/Report';
// Settings
import TeamRoles from './pages/settings/TeamRoles';
import SSOSettings from './pages/settings/SSOSettings';
// Interview
import WaitingRoom from './pages/interview/WaitingRoom';
import InterviewRoom from './pages/interview/InterviewRoom';
import InterviewComplete from './pages/interview/InterviewComplete';
import IdentityVerify from './pages/interview/IdentityVerify';
import CodeEditorRound from './pages/interview/CodeEditorRound';
import LandingPage from './pages/landing/LandingPage';
import InstallPWA from './components/InstallPWA';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}
function GuestRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <InstallPWA />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        </Route>
        <Route element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          {/* Core */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/openings" element={<Openings />} />
          <Route path="/openings/new" element={<CreateOpening />} />
          <Route path="/openings/:id" element={<OpeningDetail />} />
          <Route path="/templates" element={<JobTemplates />} />
          <Route path="/epfo-verification" element={<EPFOVerification />} />
          <Route path="/live-interviews" element={<ScheduleLiveInterview />} />
          <Route path="/candidates" element={<Candidates />} />
          <Route path="/candidates/:id" element={<CandidateDetail />} />
          <Route path="/reports/:interviewId" element={<ReportDetail />} />
          <Route path="/analytics" element={<Analytics />} />
          {/* Enterprise v2 */}
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/offers" element={<OfferLetters />} />
          <Route path="/talent-pool" element={<TalentPool />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/pipeline" element={<PipelineBoard />} />
          <Route path="/audit" element={<AuditLogs />} />
          {/* Enterprise v3 */}
          <Route path="/sentiment" element={<SentimentAnalysis />} />
          <Route path="/culture-fit" element={<CultureFit />} />
          <Route path="/rankings" element={<CandidateRanking />} />
          <Route path="/scorecards" element={<ScorecardBuilder />} />
          <Route path="/branding" element={<WhiteLabel />} />
          <Route path="/panel-review" element={<CollaborativeReview />} />
          <Route path="/mockmate" element={<MockMate />} />
          <Route path="/video-highlights" element={<VideoHighlights />} />
          <Route path="/languages" element={<MultiLanguage />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/chatbot" element={<CandidateChatbot />} />
          <Route path="/retention" element={<PredictiveRetention />} />
          <Route path="/whatsapp" element={<WhatsAppCenter />} />
          <Route path="/group-discussion" element={<GroupDiscussion />} />
          <Route path="/compensation" element={<CompensationBenchmark />} />
          {/* Toastmasters Meeting Manager */}
          <Route path="/toastmasters" element={<ToastmastersMeetingsList />} />
          <Route path="/toastmasters/members" element={<ToastmastersMembers />} />
          <Route path="/toastmasters/new" element={<ToastmastersNewMeeting />} />
          <Route path="/toastmasters/:id" element={<ToastmastersMeetingDetail />} />
          <Route path="/toastmasters/:id/run" element={<ToastmastersRunMeeting />} />
          <Route path="/toastmasters/:id/roles" element={<ToastmastersRoleAssignment />} />
          <Route path="/toastmasters/:id/ahcounter" element={<ToastmastersAhCounterLive />} />
          <Route path="/toastmasters/:id/evaluate" element={<ToastmastersEvaluate />} />
          <Route path="/toastmasters/:id/report" element={<ToastmastersReport />} />
          {/* Settings */}
          <Route path="/settings/team" element={<TeamRoles />} />
          <Route path="/settings/sso" element={<SSOSettings />} />
        </Route>
        <Route element={<CandidateLayout />}>
          <Route path="/interview/:token" element={<WaitingRoom />} />
          <Route path="/interview/:token/verify" element={<IdentityVerify />} />
          <Route path="/interview/:token/room" element={<InterviewRoom />} />
          <Route path="/interview/:token/code" element={<CodeEditorRound />} />
          <Route path="/interview/:token/done" element={<InterviewComplete />} />
          <Route path="/interview/complete" element={<InterviewComplete />} />
        </Route>
        {/* Live video call — deliberately outside DashboardLayout/CandidateLayout so it can
            own the full viewport (its own header, no app sidebar getting in the way) */}
        <Route path="/interviews/:interviewId/live" element={<PrivateRoute><LiveInterviewRoom /></PrivateRoute>} />
        <Route path="/interview/:token/live" element={<LiveInterviewRoom />} />
        {/* Group discussion candidate room — no login, sessionId+candidateId in the URL are the access boundary */}
        <Route path="/gd/:sessionId/:candidateId" element={<GDRoom />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
