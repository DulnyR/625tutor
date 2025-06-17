import { Suspense } from 'react';
import ExamRedirectClient from './ExamRedirectClient.js';
import LoadingScreen from '../loadingScreen.js'; 

export default function ExamRedirectPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ExamRedirectClient />
    </Suspense>
  );
}