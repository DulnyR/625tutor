import { Suspense } from 'react';
import SelectSubjectsClient from './SelectSubjectsClient.js';
import LoadingScreen from '../study/loadingScreen.js'; 

export default function SelectSubjectsPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SelectSubjectsClient />
    </Suspense>
  );
}