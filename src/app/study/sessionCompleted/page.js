import { Suspense } from 'react';
import SessionCompletedClient from './SessionCompletedClient.js';
import LoadingScreen from '../loadingScreen.js'; 

export default function SessionCompletedPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SessionCompletedClient />
    </Suspense>
  );
}