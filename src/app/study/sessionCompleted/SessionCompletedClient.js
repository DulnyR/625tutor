"use client";

import { useSearchParams } from 'next/navigation';

const SessionCompletedClient = () => {
    const searchParams = useSearchParams();
    const time = searchParams.get('overallTime');

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes} minutes and ${remainingSeconds} seconds`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-500 to-purple-500 flex flex-col items-center justify-center px-8">
            <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8 space-y-6 ml-4">
                {/* Header */}
                <h1 className="text-4xl font-bold text-center text-black mb-4">
                    Congratulations on Completing Your Study Session!
                </h1>

                {/* Total Time Spent */}
                <p className="text-lg text-black leading-relaxed">
                    You have spent a total of <span className="font-semibold">{formatTime(time)}</span> studying during this session. Great job!
                </p>

                {/* Next Steps */}
                <p className="text-lg text-black leading-relaxed">
                    You can click <span className="font-semibold">Next</span> to continue studying or <span className="font-semibold">Finish Studying</span> to end your session. Keep up the good work!
                </p>
            </div>
        </div>
    );
};

export default SessionCompletedClient;