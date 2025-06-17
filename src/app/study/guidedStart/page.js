// src/app/study/guidedStart/page.js

import { Suspense } from 'react';
import GuidedStartClient from './GuidedStartClient.js';
import LoadingScreen from '../loadingScreen.js'; 

export default function GuidedStartPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <GuidedStartClient />
    </Suspense>
  );
}