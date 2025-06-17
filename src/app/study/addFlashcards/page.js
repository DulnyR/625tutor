import { Suspense } from 'react';
import AddFlashcardsClient from './AddFlashcardsClient.js';
import LoadingScreen from '../loadingScreen.js'; 

export default function AddFlashcardsPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AddFlashcardsClient />
    </Suspense>
  );
}