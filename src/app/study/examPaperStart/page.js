import { Suspense } from 'react';
import ExamPaperStartClient from './ExamPaperStartClient.js';
import LoadingScreen from '../loadingScreen.js'; 

export default function ExamPaperStartPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ExamPaperStartClient />
    </Suspense>
  );
}