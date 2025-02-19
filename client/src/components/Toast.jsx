import React from 'react';

const Toast = ({ message, type = 'success' }) => {
  const baseClasses = "fixed z-50 animate-fade-in-down px-6 py-3 rounded shadow-lg";
  const typeClasses = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    warning: "bg-yellow-500 text-white",
    info: "bg-blue-500 text-white"
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]} top-4 right-4`}>
      {message}
    </div>
  );
};

export default Toast; 