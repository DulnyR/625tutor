// src/components/MobileFallback.js
export default function MobileFallback() {
    return (
      <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col items-center justify-center bg-gray-900 text-white">
        <div className="text-center p-8 space-y-4">
          <h1 className="text-5xl font-bold">
            <span className="font-extrabold">625</span>
            <span className="font-normal">Tutor</span>
          </h1>
          <p className="text-2xl text-yellow-400">
            Mobile Coming Soon!
          </p>
          <p className="text-lg text-gray-300 max-w-sm">
            For the best experience, please visit our website on a desktop or tablet.
          </p>
        </div>
      </div>
    );
  }