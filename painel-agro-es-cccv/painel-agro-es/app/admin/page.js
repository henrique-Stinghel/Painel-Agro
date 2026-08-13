import { isAdmin } from '../../lib/auth';
import AdminClient from './AdminClient';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin | Painel Agro ES' };

export default async function AdminPage() {
  const authenticated = await isAdmin();
  return <main className="adminShell">{authenticated ? <AdminClient /> : <LoginForm />}</main>;
}
