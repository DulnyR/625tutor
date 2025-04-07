//http://localhost:3000/study/testPdf

"use client";

import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

const Page = () => {
  const router = useRouter();

  //let subject = "Physics";
  //let subject = "Mathematics";
  //let subject = "Irish";
  //let subject = "English";
  //let subject = "Design & Communication Graphics";
  //let subject = "Polish"
  let subject = "Spanish";
  //let level = "ordinary";
  let level = "higher";
  let paper = "1";
  let question = "Section B";
  let year = "2018";

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
