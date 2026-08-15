import { Toaster } from 'react-hot-toast';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { AuthBootstrap } from '@/app/AuthBootstrap';
import { QueryProvider } from '@/app/QueryProvider';
import { store } from '@/app/store';
import { AppRoutes } from '@/routes';

export default function App() {
  return (
    <Provider store={store}>
      <QueryProvider>
        <BrowserRouter>
          <AuthBootstrap>
            <AppRoutes />
          </AuthBootstrap>
        </BrowserRouter>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              border: '1px solid hsl(var(--border))',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: 'hsl(var(--success))', secondary: 'white' } },
            error: { iconTheme: { primary: 'hsl(var(--destructive))', secondary: 'white' }, duration: 5000 },
          }}
        />
      </QueryProvider>
    </Provider>
  );
}