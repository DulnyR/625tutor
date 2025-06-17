import { Suspense } from 'react';
import ResetPasswordClient from './ResetPasswordClient.js';
import LoadingScreen from '../study/loadingScreen.js'; 

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ResetPasswordClient />
    </Suspense>
  );
}