import { Suspense } from 'react';
import ContactClient from './ContactClient.js';
import LoadingScreen from '../study/loadingScreen.js'; 

export default function ContactPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ContactClient />
    </Suspense>
  );
}