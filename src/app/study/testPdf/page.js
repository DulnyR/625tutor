//http://localhost:3000/study/testPdf

"use client";

import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

const Page = () => {
  const router = useRouter();

  let subject = "Engineering";
  //let level = "ordinary";
  let level = "higher";
  let paper = "1";
  let question = "Question 9";
  let year = "2015";

  const navigateToExamQuestion = () => {
    router.push(`/study/examQuestion?overallTime=0&subject=${subject}&level=${level}&paper=${paper}&question=${question}&year=${year}`);
  };

  const navigateToMarkingScheme = () => {
    router.push(`/study/markingScheme?overallTime=0&subject=${subject}&level=${level}&paper=${paper}&question=${question}&year=${year}`);
  };

  useEffect(() => {
    navigateToExamQuestion();
    //navigateToMarkingScheme();
  }, []);

  return (
    <div>
      {/* Your component JSX goes here */}
    </div>
  );
};

export default Page;
