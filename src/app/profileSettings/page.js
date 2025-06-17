import { Suspense } from 'react';
import ProfileSettingsClient from './ProfileSettingsClient.js';
import LoadingScreen from '../study/loadingScreen.js'; 

export default function ProfileSettingsPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ProfileSettingsClient />
    </Suspense>
  );
}