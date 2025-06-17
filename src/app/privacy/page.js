import { Suspense } from 'react';
import PrivacyClient from './PrivacyClient.js';
import LoadingScreen from '../study/loadingScreen.js'; 

export default function PrivacyPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <PrivacyClient />
    </Suspense>
  );
}