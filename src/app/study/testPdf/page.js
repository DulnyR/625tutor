import { Suspense } from 'react';
import TestPDFClient from './TestPDFClient.js';
import LoadingScreen from '../loadingScreen.js'; 

export default function TestPDFPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <TestPDFClient />
    </Suspense>
  );
}