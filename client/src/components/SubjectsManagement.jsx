import { useState, useEffect } from 'react';

function SubjectsManagement() {
  const [subjects, setSubjects] = useState([]);
  const [distinctRegulations, setDistinctRegulations] = useState([]);
  const [distinctBranches, setDistinctBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingSubject, setAddingSubject] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    regulation: '',
    year: '',
    branch: '',
    semester: ''
  });
  const [newSubject, setNewSubject] = useState({
    regulation: '',
    year: '',
    branch: '',
    semester: '',
    subjectCode: '',
    subjectName: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [subjectsPerPage] = useState(5);

  // Remove or comment out these arrays since we won't use them for regulation and branches
 // const regulations = ['R23', 'R20', 'R19','R24'];  // Can be removed if not used elsewhere
  const years = ['1', '2', '3', '4'];
  // const branches = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL','IT','AIDS','AIML','CSBS','CSD'];  // Can be removed if not used elsewhere
  const semesters = ['1', '2'];

  // Calculate pagination values
  const indexOfLastSubject = currentPage * subjectsPerPage;
  const indexOfFirstSubject = indexOfLastSubject - subjectsPerPage;
  const currentSubjects = subjects.slice(indexOfFirstSubject, indexOfLastSubject);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      // Reset branch when regulation changes
      ...(name === 'regulation' ? { branch: '' } : {})
    }));
  };

  const handleNewSubjectChange = (e) => {
    const { name, value } = e.target;
    setNewSubject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Create an object with only non-empty filter values
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      
      // Convert the filters object to URL parameters
      const queryParams = new URLSearchParams(activeFilters).toString();
      console.log('Fetching with filters:', queryParams); // Debug log
      
      const response = await fetch(`/api/subjects?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch subjects');
      }
      
      const data = await response.json();
      console.log('Received subjects:', data); // Debug log
      
      if (Array.isArray(data)) {
        setSubjects(data);
      } else {
        setSubjects([]);
        console.error('Received non-array data:', data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setError(error.message);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistinctValues = async () => {
    try {
      console.log('Fetching distinct values...');
      const [regulationsRes, branchesRes] = await Promise.all([
        fetch('/api/subjects/distinct/regulation'),
        fetch('/api/subjects/distinct/branch')
      ]);

      if (!regulationsRes.ok || !branchesRes.ok) {
        throw new Error('Failed to fetch distinct values');
      }

      const regulations = await regulationsRes.json();
      const branches = await branchesRes.json();

      console.log('Distinct regulations:', regulations);
      console.log('Distinct branches:', branches);

      setDistinctRegulations(regulations);
      setDistinctBranches(branches);
    } catch (error) {
      console.error('Error fetching distinct values:', error);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    try {
      setAddingSubject(true);
      setSuccessMessage('');
      
      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSubject),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add subject');
      }

      // Reset form
      setNewSubject({
        regulation: '',
        year: '',
        branch: '',
        semester: '',
        subjectCode: '',
        subjectName: ''
      });

      // Show success message
      setSuccessMessage('Subject added successfully');

      // Refresh the subjects list
      fetchSubjects();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error adding subject:', error);
      alert(error.message || 'Error adding subject');
    } finally {
      setAddingSubject(false);
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    try {
      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete subject');
      }

      // Show success message
      setSuccessMessage('Subject deleted successfully');

      // Refresh the subjects list
      fetchSubjects();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert(error.message || 'Error deleting subject');
    }
  };

  useEffect(() => {
    fetchSubjects();
    fetchDistinctValues();
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [filters]);

  useEffect(() => {
    const fetchBranches = async () => {
      if (!filters.regulation) {
        setDistinctBranches([]);
        return;
      }
      try {
        const response = await fetch(`/api/subjects/distinct/branch?regulation=${filters.regulation}`);
        if (!response.ok) {
          throw new Error('Failed to fetch distinct branches');
        }
        const branches = await response.json();
        setDistinctBranches(branches);
      } catch (error) {
        setError(error.message);
      }
    };
    fetchBranches();
  }, [filters.regulation]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Subjects Management</h2>
      
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
      
      {/* Add New Subject Form */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <h3 className="font-semibold">Add New Subject</h3>
        <form onSubmit={handleAddSubject} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="new-regulation" className="block text-sm font-medium text-gray-700">
                Regulation
              </label>
              <input
                id="new-regulation"
                type="text"
                name="regulation"
                placeholder="Enter Regulation"
                value={newSubject.regulation}
                onChange={handleNewSubjectChange}
                className="w-full border rounded p-2"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="new-branch" className="block text-sm font-medium text-gray-700">
                Branch
              </label>
              <input
                id="new-branch"
                type="text"
                name="branch"
                placeholder="Enter Branch"
                value={newSubject.branch}
                onChange={handleNewSubjectChange}
                className="w-full border rounded p-2"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="new-subject-code" className="block text-sm font-medium text-gray-700">
                Subject Code
              </label>
              <input
                id="new-subject-code"
                type="text"
                name="subjectCode"
                placeholder="Enter Subject Code"
                value={newSubject.subjectCode}
                onChange={handleNewSubjectChange}
                className="w-full border rounded p-2"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="new-subject-name" className="block text-sm font-medium text-gray-700">
                Subject Name
              </label>
              <input
                id="new-subject-name"
                type="text"
                name="subjectName"
                placeholder="Enter Subject Name"
                value={newSubject.subjectName}
                onChange={handleNewSubjectChange}
                className="w-full border rounded p-2"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="new-year" className="block text-sm font-medium text-gray-700">
                Year
              </label>
              <select
                id="new-year"
                name="year"
                value={newSubject.year}
                onChange={handleNewSubjectChange}
                className="w-full border rounded p-2"
                required
              >
                <option value="">Select Year</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="new-semester" className="block text-sm font-medium text-gray-700">
                Semester
              </label>
              <select
                id="new-semester"
                name="semester"
                value={newSubject.semester}
                onChange={handleNewSubjectChange}
                className="w-full border rounded p-2"
                required
              >
                <option value="">Select Semester</option>
                {semesters.map(sem => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
            </div>
          </div>
          
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
            disabled={addingSubject}
          >
            {addingSubject ? 'Adding...' : 'Add Subject'}
          </button>
        </form>
      </div>

      {/* Filter section */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <h3 className="font-semibold">Filter Subjects</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <label htmlFor="filter-regulation" className="block text-sm font-medium text-gray-700">
              Regulation
            </label>
            <select
              id="filter-regulation"
              name="regulation"
              value={filters.regulation}
              onChange={handleFilterChange}
              className="w-full border rounded p-2"
            >
              <option value="">All Regulations</option>
              {distinctRegulations.map(reg => (
                <option key={reg} value={reg}>{reg}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="filter-branch" className="block text-sm font-medium text-gray-700">
              Branch
            </label>
            <select
              id="filter-branch"
              name="branch"
              value={filters.branch}
              onChange={handleFilterChange}
              className="w-full border rounded p-2"
            >
              <option value="">All Branches</option>
              {distinctBranches.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="filter-year" className="block text-sm font-medium text-gray-700">
              Year
            </label>
            <select
              id="filter-year"
              name="year"
              value={filters.year}
              onChange={handleFilterChange}
              className="w-full border rounded p-2"
            >
              <option value="">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="filter-semester" className="block text-sm font-medium text-gray-700">
              Semester
            </label>
            <select
              id="filter-semester"
              name="semester"
              value={filters.semester}
              onChange={handleFilterChange}
              className="w-full border rounded p-2"
            >
              <option value="">All Semesters</option>
              {semesters.map(sem => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Subjects List with Pagination */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-semibold mb-4">Subjects List</h3>
        
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        
        {!loading && !error && subjects.length === 0 && (
          <p>No subjects found.</p>
        )}

        {!loading && !error && subjects.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Regulation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentSubjects.map((subject) => (
                    <tr key={subject._id}>
                      <td className="px-6 py-4 whitespace-nowrap">{subject.regulation}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{subject.branch}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{subject.year}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{subject.semester}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{subject.subjectCode}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{subject.subjectName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteSubject(subject._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {indexOfFirstSubject + 1} to {Math.min(indexOfLastSubject, subjects.length)} of {subjects.length} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-1 border rounded-md bg-gray-50">
                  Page {currentPage} of {Math.ceil(subjects.length / subjectsPerPage)}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(subjects.length / subjectsPerPage)))}
                  disabled={currentPage >= Math.ceil(subjects.length / subjectsPerPage)}
                  className="px-3 py-1 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SubjectsManagement; 