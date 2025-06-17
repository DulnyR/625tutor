import { Suspense } from 'react';
import LoginPageClient from './LoginPageClient.js';
import LoadingScreen from '../study/loadingScreen.js'; 

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <LoginPageClient />
    </Suspense>
  );
}