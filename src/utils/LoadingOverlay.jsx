import React from 'react';

const LoadingOverlay = ({ loading, text = "Loading..." }) => {
  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white bg-opacity-50 flex items-center justify-center">
      <div className="text-black text-2xl">{text}</div>
    </div>
  );
};

export default LoadingOverlay;
