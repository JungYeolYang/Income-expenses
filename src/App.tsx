import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { MonthlyPage } from './pages/MonthlyPage';
import { BudgetPage } from './pages/BudgetPage';
import { StatsPage } from './pages/StatsPage';
import { AccountsPage } from './pages/AccountsPage';
import { BackupPage } from './pages/BackupPage';
import { LoginPage } from './pages/LoginPage';

function Router() {
  const { page } = useApp();
  switch (page) {
    case 'monthly':
      return <MonthlyPage />;
    case 'budget':
      return <BudgetPage />;
    case 'stats':
      return <StatsPage />;
    case 'accounts':
      return <AccountsPage />;
    case 'backup':
      return <BackupPage />;
    default:
      return <MonthlyPage />;
  }
}

function AuthenticatedApp() {
  const { authenticated, checking } = useAuth();

  if (checking) {
    return <p className="loading-msg login-loading">확인 중…</p>;
  }
  if (!authenticated) {
    return <LoginPage />;
  }

  return (
    <AppProvider>
      <Layout>
        <Router />
      </Layout>
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}
