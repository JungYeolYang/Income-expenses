import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { MonthlyPage } from './pages/MonthlyPage';
import { BudgetPage } from './pages/BudgetPage';
import { StatsPage } from './pages/StatsPage';
import { AccountsPage } from './pages/AccountsPage';
import { BackupPage } from './pages/BackupPage';

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

export default function App() {
  return (
    <AppProvider>
      <Layout>
        <Router />
      </Layout>
    </AppProvider>
  );
}
