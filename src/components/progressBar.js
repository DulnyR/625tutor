import React from 'react';

const ProgressBar = ({ currentTime, subject }) => {
    const progressPercentage = Math.min((currentTime / (30 * 60)) * 100, 100);

    return (
        <div className="w-full fixed top-24 left-0 z-50">
            <div className="relative bg-gray" style={{ height: '2.5rem' }}>
                <div
                    className="bg-green"
                    style={{ width: `${progressPercentage}%`, height: '2.5rem' }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center text-black font-bold" style={{ marginTop: '-2rem' }}>
                    Currently Studying: {subject}
                </div>
            </div>
        </div>
    );
};

export default ProgressBar;