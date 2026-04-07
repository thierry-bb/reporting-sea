import './globals.css';

export const metadata = {
  title: 'Reporting SEA — Agence BB',
  description: 'Dashboard de reporting SEA pour Agence BB',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
