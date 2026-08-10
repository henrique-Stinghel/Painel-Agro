import './styles.css';

export const metadata = {
  title: 'Painel Agro ES',
  description: 'Cotações, clima do Espírito Santo e Radar IA para o agro.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
