import { AppRouter } from './router';
import { AuthBootstrap } from './features/shared/auth/AuthBootstrap';
import './styles/globals.css';

function App() {
  return (
    <AuthBootstrap>
      <AppRouter />
    </AuthBootstrap>
  );
}

export default App;
