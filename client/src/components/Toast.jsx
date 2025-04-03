import { useEffect } from 'react';
import { MdClose } from 'react-icons/md';

function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const bgColor = type === 'success' ? 'bg-green-50' : 'bg-red-50';
  const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
  const borderColor = type === 'success' ? 'border-green-400' : 'border-red-400';

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center ${bgColor} border ${borderColor} px-4 py-3 rounded`}>
      <span className={`${textColor}`}>{message}</span>
      <button
        onClick={onClose}
        className={`ml-4 ${textColor} hover:opacity-75`}
      >
        <MdClose className="text-xl" />
      </button>
    </div>
  );
}

export default Toast; 