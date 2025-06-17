import { Suspense } from 'react';
import SelectConfidenceClient from './SelectConfidenceClient.js';
import LoadingScreen from '../study/loadingScreen.js'; 

export default function SelectConfidencePage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SelectConfidenceClient />
    </Suspense>
  );
}