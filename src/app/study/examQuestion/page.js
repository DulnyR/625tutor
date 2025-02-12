"use client";

import '../../globals.css';

const ExamQuestion = () => {
    return (
        <div className="bg-white min-h-screen text-black flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-6 ml-6" style={{ paddingTop: '1rem'}}>Exam Question</h1>
            <div className="w-3/5 max-w-6xl flex mb-40">
                <img src="/sample_exam_question.png" alt="Sample Exam Question" className="w-full h-auto" />
            </div>
        </div>
    );
};

export default ExamQuestion;