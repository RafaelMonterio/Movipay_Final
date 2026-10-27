import './globals.css';
import { ProvedorAutenticacao } from '@/contexto/contextoAutenticacao';
import { ProvedorTema } from '@/contexto/contextoTema';
import { ToastProvider } from '@/componentes/interface/Notificacao';

export const metadata = {
  title: 'MoviPay — Conectando serviços locais',
  description: 'Plataforma de serviços locais com gamificação',
  icons: {
    icon: '/img/favicon2.png',
    shortcut: '/img/favicon2.png',
    apple: '/img/favicon2.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <ProvedorAutenticacao>
          <ProvedorTema>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ProvedorTema>
        </ProvedorAutenticacao>
      </body>
    </html>
  );
}
