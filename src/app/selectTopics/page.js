import { Suspense } from 'react';
import SelectTopicsClient from './SelectTopicsClient.js';
import LoadingScreen from '../study/loadingScreen.js'; 

export default function SelectTopicsPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SelectTopicsClient />
    </Suspense>
  );
}