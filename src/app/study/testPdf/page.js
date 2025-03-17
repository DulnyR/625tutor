//http://localhost:3000/study/testPdf

"use client";

import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

const Page = () => {
  const router = useRouter();

  let subject = "Irish";
  let level = "ordinary";
  let paper = "1";
  let question = "An Chluastuiscint";
  let year = "2024";

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
