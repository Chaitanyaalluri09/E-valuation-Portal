import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateEvaluation from './CreateEvaluation';
import UserManagement from './UserManagement';
import SubjectsManagement from './SubjectsManagement';
function AdminDashboard() {
  const [activeMenu, setActiveMenu] = useState('create-evaluation');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const handleLogout = () => {
    localStorage.clear();
    navigate('/', { replace: true });
  };
  return (
    <div className="min-h-screen bg-[#EBF3FA] flex">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-48' : 'w-0'} fixed left-0 top-0 bg-[#0C5A93] text-white h-screen transition-all duration-300 overflow-hidden`}>
        <div className="p-3 border-b border-blue-700">
          <h1 className="text-base font-semibold">E-Valuation Portal</h1>
        </div>
        <nav className="mt-2">
          <div className="flex flex-col">
            <button
              className={`px-6 py-3 text-left ${
                activeMenu === 'create-evaluation'
                  ? 'bg-[#094875] border-l-4 border-white'
                  : 'hover:bg-[#094875]'
              }`}
              onClick={() => setActiveMenu('create-evaluation')}
            >
              Create Evaluation
            </button>
            <button
              className={`px-6 py-3 text-left ${
                activeMenu === 'user-management'
                  ? 'bg-[#094875] border-l-4 border-white'
                  : 'hover:bg-[#094875]'
              }`}
              onClick={() => setActiveMenu('user-management')}
            >
              User Management
            </button>
            <button
              className={`px-6 py-3 text-left ${
                activeMenu === 'subjects'
                  ? 'bg-[#094875] border-l-4 border-white'
                  : 'hover:bg-[#094875]'
              }`}
              onClick={() => setActiveMenu('subjects')}
            >
              Subjects
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 ${isSidebarOpen ? 'ml-48' : 'ml-0'} transition-all duration-300`}>
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
            <h2 className="flex-1 text-center text-base font-bold">SAGI RAMA KRISHNAM RAJU ENGINEERING COLLEGE (AUTONOMOUS)</h2>
            <div ref={dropdownRef} className="flex-none relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-4 py-2 flex items-center space-x-1"
              >
                <span>WELCOME ADMIN</span>
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
                      handleLogout();
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-8">
          {activeMenu === 'create-evaluation' ? <CreateEvaluation /> : activeMenu === 'user-management' ? <UserManagement /> : <SubjectsManagement />}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard; 