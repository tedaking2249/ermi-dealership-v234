import { useLocation } from 'react-router-dom';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import ScrollToHash from './components/layout/ScrollToHash';
import AppRoutes from './routes/AppRoutes';
import { FavoritesProvider } from './context/FavoritesContext';
import './styles/theme.css';

function App() {
  const location = useLocation();

  // Everything under /dealer gets the dealer portal layout, everything else the public site layout
  const isDealerRoute = location.pathname.startsWith('/dealer');
  const ActiveLayout = isDealerRoute ? AdminLayout : Layout;

  return (
    <FavoritesProvider>
      <ScrollToHash />
      <ActiveLayout>
        <AppRoutes />
      </ActiveLayout>
    </FavoritesProvider>
  );
}

export default App;