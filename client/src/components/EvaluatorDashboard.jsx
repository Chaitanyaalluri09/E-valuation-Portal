import { useState, useEffect, useRef } from 'react';
import axiosInstance from '../utils/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { MdDashboard, MdAccountCircle, MdFilterList } from 'react-icons/md';
import AccountSettings from './AccountSettings';

function EvaluatorDashboard() {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [evaluatorName, setEvaluatorName] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'settings'
  const [statusFilter, setStatusFilter] = useState('All');
  const filterOptions = ['All', 'Not Started', 'In Progress', 'Completed'];
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

  const getFilteredEvaluations = () => {
    if (statusFilter === 'All') return evaluations;
    return evaluations.filter(evaluation => evaluation.status === statusFilter);
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
    <div className="min-h-screen bg-[#EBF3FA] flex">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-56' : 'w-0'} fixed left-0 top-0 bg-[#0C5A93] text-white h-screen transition-all duration-300 overflow-hidden`}>
        <div className="p-3 border-b border-blue-700">
          <h1 className="text-base font-semibold">Evaluator Panel</h1>
        </div>
        <nav className="mt-2">
          <div className="flex flex-col">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-6 py-3 text-left flex items-center gap-2 ${
                currentView === 'dashboard' ? 'bg-[#094875] border-l-4 border-white' : 'hover:bg-[#094875]'
              }`}
            >
              <MdDashboard className="text-xl" />
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('settings')}
              className={`px-6 py-3 text-left flex items-center gap-2 ${
                currentView === 'settings' ? 'bg-[#094875] border-l-4 border-white' : 'hover:bg-[#094875]'
              }`}
            >
              <MdAccountCircle className="text-xl" />
              Account Settings
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 ${isSidebarOpen ? 'ml-56' : 'ml-0'} transition-all duration-300`}>
        {/* Header */}
        <header className="bg-[#0C5A93] text-white shadow">
          <div className="flex justify-between items-center px-4 py-2">
            <div className="flex-none">
              {/* Hamburger Menu Button */}
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="hover:bg-[#094875] p-1 rounded transition-colors"
              >
                <div className="space-y-1">
                  <span className="block w-4 h-0.5 bg-white"></span>
                  <span className="block w-4 h-0.5 bg-white"></span>
                  <span className="block w-4 h-0.5 bg-white"></span>
                </div>
              </button>
            </div>
            <h2 className="flex-1 text-center text-base font-bold">
              SAGI RAMA KRISHNAM RAJU ENGINEERING COLLEGE (AUTONOMOUS)
            </h2>
            <div ref={dropdownRef} className="flex-none relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-4 py-2 flex items-center space-x-1"
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
                    onClick={() => {
                      setCurrentView('settings');
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Account Settings
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 font-medium"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-8">
          {currentView === 'dashboard' ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Evaluations Dashboard</h1>
                
                {/* Filter Section */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <MdFilterList className="text-gray-600" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C5A93]"
                    >
                      {filterOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                  {error}
                </div>
              ) : getFilteredEvaluations().length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    {evaluations.length === 0 ? 'No Evaluations Assigned' : 'No evaluations match the selected filter'}
                  </h3>
                  <p className="mt-2 text-gray-600">
                    {evaluations.length === 0 ? 'You currently have no evaluations assigned to you.' : 'Try changing the filter to see more evaluations.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getFilteredEvaluations().map((evaluation) => {
                    const notStartedPapers = evaluation.studentSubmissions.filter(
                      sub => sub.status === 'Not Started'
                    ).length;
                    const inProgressPapers = evaluation.studentSubmissions.filter(
                      sub => sub.status === 'In Progress'
                    ).length;
                    const completedPapers = evaluation.studentSubmissions.filter(
                      sub => sub.status === 'Completed'
                    ).length;
                    const totalPapers = evaluation.studentSubmissions.length;

                    // Status badge color mapping
                    const statusColors = {
                      'Not Started': 'bg-yellow-100 text-yellow-800',
                      'In Progress': 'bg-blue-100 text-blue-800',
                      'Completed': 'bg-green-100 text-green-800'
                    };

                    return (
                      <div
                        key={evaluation._id}
                        className="bg-white rounded-lg shadow-md overflow-hidden"
                      >
                        <div className="p-6">
                          {/* Evaluation Status Badge */}
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-semibold text-[#0C5A93]">
                              {evaluation.subject}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[evaluation.status]}`}>
                              {evaluation.status}
                            </span>
                          </div>

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

                            {/* Papers Status Section */}
                            <div className="col-span-2 mt-2">
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <h4 className="text-gray-600 font-medium mb-2">Papers Status</h4>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <p className="text-gray-600">Total Papers</p>
                                    <p className="font-semibold text-gray-800">{totalPapers}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Not Started</p>
                                    <p className="font-semibold text-yellow-600">{notStartedPapers}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">In Progress</p>
                                    <p className="font-semibold text-blue-600">{inProgressPapers}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Completed</p>
                                    <p className="font-semibold text-green-600">{completedPapers}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="col-span-2">
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
                              {evaluation.status === 'Not Started' ? 'Start Evaluation' :
                               evaluation.status === 'In Progress' ? 'Continue Evaluation' :
                               'View Evaluation'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <AccountSettings />
          )}
        </main>
      </div>
    </div>
  );
}

export default EvaluatorDashboard; 