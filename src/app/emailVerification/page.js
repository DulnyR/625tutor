import { Suspense } from 'react';
import EmailVerificationClient from './EmailVerificationClient.js';
import LoadingScreen from '../study/loadingScreen.js'; 

export default function EmailVerificationPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <EmailVerificationClient />
    </Suspense>
  );
}