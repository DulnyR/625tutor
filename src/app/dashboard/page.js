import { Suspense } from 'react';
import DashboardClient from './DashboardClient.js';
import LoadingScreen from '../study/loadingScreen.js'; 

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <DashboardClient />
    </Suspense>
  );
}