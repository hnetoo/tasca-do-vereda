import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function Home() {
  const cookieStore = await cookies();
  const pinSession = cookieStore.get('pin_session');

  let target = '/login';

  if (pinSession) {
    try {
      const session = JSON.parse(decodeURIComponent(pinSession.value));
      if (session && session.valid) {
        // Always redirect to dashboard, regardless of role
        target = '/dashboard';
      }
    } catch (e) {
      // ignore parse errors
    }
  }

  redirect(target);
}
