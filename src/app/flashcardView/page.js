import { Suspense } from 'react';
import FlashcardViewClient from './FlashcardViewClient.js';
import LoadingScreen from '../study/loadingScreen.js'; 

export default function FlashcardViewPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <FlashcardViewClient />
    </Suspense>
  );
}