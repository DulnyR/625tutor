import { Suspense } from 'react';
import ExamQuestionClient from './ExamQuestionClient.js';
import LoadingScreen from '../loadingScreen.js'; 

export default function ExamQuestionPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ExamQuestionClient />
    </Suspense>
  );
}