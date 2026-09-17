import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import OverviewPage from './pages/OverviewPage';
import IssuesPage from './pages/IssuesPage';
import IssueDetailPage from './pages/IssueDetailPage';
import RunsPage from './pages/RunsPage';
import RunDetailPage from './pages/RunDetailPage';
import PullRequestsPage from './pages/PullRequestsPage';
import PullRequestDetailPage from './pages/PullRequestDetailPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/issues" element={<IssuesPage />} />
        <Route path="/issues/:issueId" element={<IssueDetailPage />} />
        <Route path="/runs" element={<RunsPage />} />
        <Route path="/runs/:runId" element={<RunDetailPage />} />
        <Route path="/pull-requests" element={<PullRequestsPage />} />
        <Route path="/pull-requests/:prId" element={<PullRequestDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AppShell>
  );
}
