import React, { useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axiosInstance from '../utils/axiosConfig';

function PapersList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [evaluatorName, setEvaluatorName] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchEvaluation();
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const name = localStorage.getItem('username');
    if (name) setEvaluatorName(name);
  }, []);

  const fetchEvaluation = async () => {
    try {
      const response = await axiosInstance.get(`/api/evaluations/${id}`);
      setEvaluation(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch evaluation details');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/', { replace: true });
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!evaluation) return <div className="p-4">No evaluation found</div>;

  return (
    <div className="min-h-screen bg-[#EBF3FA]">
      {/* Header with adjusted padding */}
      <header className="bg-[#0C5A93] text-white shadow">
        <div className="px-4 py-3">
          <h2 className="text-center text-base font-bold">
            SAGI RAMA KRISHNAM RAJU ENGINEERING COLLEGE (AUTONOMOUS)
          </h2>
        </div>
      </header>

      {/* Content */}
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-6 text-[#0C5A93]">{evaluation.subject} - Papers List</h2>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paper ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {evaluation.studentSubmissions.map((submission, index) => (
                <tr key={submission._id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {submission.registerNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${submission.status === 'Not Started' ? 'bg-gray-100 text-gray-800' : 
                        submission.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 
                        'bg-green-100 text-green-800'}`}>
                      {submission.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {submission.status === 'Not Started' ? (
                      <button
                        onClick={() => navigate(`/evaluator/paper/${evaluation._id}/${submission._id}`)}
                        className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition-colors"
                      >
                        Start
                      </button>
                    ) : submission.status === 'In Progress' ? (
                      <button
                        onClick={() => navigate(`/evaluator/paper/${evaluation._id}/${submission._id}`)}
                        className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition-colors"
                      >
                        Continue
                      </button>
                    ) : (
                      <button
                        disabled
                        className="bg-gray-300 text-gray-500 px-4 py-1 rounded cursor-not-allowed"
                      >
                        Completed
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PapersList; 