//http://localhost:3000/study/testPdf

"use client";

import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

const Page = () => {
  const router = useRouter();

  let subject = "Spanish"; 
  //let level = "ordinary";
  let level = "higher";
  let exam = "Written";
  //let exam = "Oral";
  //let exam = "Listening";
  let paper = "1";
  //let letter = ["A", "B", "C"][Math.floor(Math.random() * 3)];
  let letter = "B"; 
  let question = `Section ${letter}`;
  //let year = (Math.floor(Math.random() * (2024 - 2015 + 1)) + 2015).toString();
  let year = "2022"; // Fixed year for testing

  const navigateToExamQuestion = () => {
    router.push(`/study/examQuestion?overallTime=0&subject=${subject}&level=${level}&exam=${exam}&paper=${paper}&question=${question}&year=${year}`);
  };

  const navigateToMarkingScheme = () => {
    router.push(`/study/markingScheme?overallTime=0&subject=${subject}&level=${level}&exam=${exam}&paper=${paper}&question=${question}&year=${year}`);
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
