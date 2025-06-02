import React from 'react';

const LoadingScreen = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-500 to-purple-500 flex items-center justify-center">
            <div className="text-white text-2xl">
                <span className="font-bold">625</span>Tutor
            </div>
            <div className="loader"></div>
        </div>
    );
};

export default LoadingScreen;