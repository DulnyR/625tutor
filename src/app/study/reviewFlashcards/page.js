import { Suspense } from 'react';
import ReviewFlashcardsClient from './ReviewFlashcardsClient.js';
import LoadingScreen from '../loadingScreen.js'; 

export default function ReviewFlashcardsPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ReviewFlashcardsClient />
    </Suspense>
  );
}