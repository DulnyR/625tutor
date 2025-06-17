import { Suspense } from 'react';
import MarkingSchemeClient from './MarkingSchemeClient.js';
import LoadingScreen from '../loadingScreen.js'; 

export default function MarkingSchemePage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <MarkingSchemeClient />
    </Suspense>
  );
}