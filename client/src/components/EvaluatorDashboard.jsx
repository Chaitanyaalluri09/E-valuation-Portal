import { useState, useEffect, useRef } from 'react';
import axiosInstance from '../utils/axiosConfig';
import { useNavigate } from 'react-router-dom';
import Toast from './Toast';

function EvaluatorDashboard() {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [evaluatorName, setEvaluatorName] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvaluations();
    fetchEvaluatorInfo();

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchEvaluatorInfo = async () => {
    try {
      const response = await axiosInstance.get('/api/users/me');
      setEvaluatorName(response.data.username || '');
    } catch (error) {
      console.error('Error fetching evaluator info:', error);
      setEvaluatorName('');
    }
  };

  const fetchEvaluations = async () => {
    try {
      const response = await axiosInstance.get('/api/evaluations/my-evaluations');
      setEvaluations(response.data);
    } catch (error) {
      setError('Failed to fetch evaluations');
      console.error('Error fetching evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#EBF3FA] flex items-center justify-center">
      <div className="text-xl text-gray-600">Loading...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#EBF3FA]">
      {/* Header */}
      <header className="bg-[#0C5A93] text-white shadow">
        <div className="flex justify-between items-center px-4 py-2">
          <div className="flex-1">
            <h2 className="text-center text-base font-bold">
              SAGI RAMA KRISHNAM RAJU ENGINEERING COLLEGE (AUTONOMOUS)
            </h2>
          </div>
          <div ref={dropdownRef} className="flex-none relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="px-4 py-2 flex items-center space-x-1 hover:bg-[#094875] rounded transition-colors"
            >
              <span>WELCOME {evaluatorName ? evaluatorName.toUpperCase() : ''}</span>
              <svg
                className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Evaluations Dashboard</h1>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        ) : evaluations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900">No Evaluations Assigned</h3>
            <p className="mt-2 text-gray-600">You currently have no evaluations assigned to you.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {evaluations.map((evaluation) => (
              <div
                key={evaluation._id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-[#0C5A93] mb-4">
                    {evaluation.subject}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Regulation</p>
                      <p className="font-medium">{evaluation.regulation}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Branch</p>
                      <p className="font-medium">{evaluation.branch}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Year</p>
                      <p className="font-medium">{evaluation.year}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Semester</p>
                      <p className="font-medium">{evaluation.semester}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Papers</p>
                      <p className="font-medium">{evaluation.studentSubmissions.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Corrected</p>
                      <p className="font-medium">
                        {evaluation.studentSubmissions.filter(sub => sub.status === 'completed').length}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Remaining</p>
                      <p className="font-medium">
                        {evaluation.studentSubmissions.filter(sub => sub.status !== 'completed').length}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">End Date</p>
                      <p className="font-medium text-red-600">
                        {new Date(evaluation.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={() => navigate(`/evaluator/evaluation/${evaluation._id}`)}
                      className="w-full bg-[#0C5A93] text-white py-2 px-4 rounded hover:bg-[#094875] transition-colors"
                    >
                      Start Evaluation
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default EvaluatorDashboard; 