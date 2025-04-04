import { useState, useEffect, useCallback } from 'react';
import Toast from './Toast';
import axiosInstance from '../utils/axiosConfig';

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
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [currentPage, setCurrentPage] = useState(1);
  const [subjectsPerPage] = useState(5);
  const [csvFile, setCsvFile] = useState(null);

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

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      
      const queryParams = new URLSearchParams(activeFilters).toString();
      console.log('Fetching with filters:', queryParams);
      
      const response = await axiosInstance.get(`/api/subjects?${queryParams}`);
      
      console.log('Received subjects:', response.data);
      
      if (Array.isArray(response.data)) {
        setSubjects(response.data);
      } else {
        setSubjects([]);
        console.error('Received non-array data:', response.data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setError(error.message || 'Failed to fetch subjects');
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchDistinctValues = useCallback(async () => {
    try {
      console.log('Fetching distinct values...');
      
      // Use axiosInstance for both requests
      const [regulationsRes, branchesRes] = await Promise.all([
        axiosInstance.get('/api/subjects/distinct/regulation'),
        axiosInstance.get('/api/subjects/distinct/branch')
      ]);

      console.log('Distinct regulations:', regulationsRes.data);
      console.log('Distinct branches:', branchesRes.data);

      setDistinctRegulations(regulationsRes.data);
      setDistinctBranches(branchesRes.data);
    } catch (error) {
      console.error('Error fetching distinct values:', error);
    }
  }, []);

  const handleAddSubject = async (e) => {
    e.preventDefault();
    try {
      setAddingSubject(true);
      setToast({ show: false, message: '', type: 'success' });
      
      await axiosInstance.post('/api/subjects', newSubject);

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
      setToast({ show: true, message: 'Subject added successfully', type: 'success' });

      // Refresh both subjects list and distinct values
      await Promise.all([fetchSubjects(), fetchDistinctValues()]);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3000);
    } catch (error) {
      console.error('Error adding subject:', error);
      setToast({ 
        show: true, 
        message: error.message || 'Error adding subject', 
        type: 'error' 
      });
    } finally {
      setAddingSubject(false);
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    try {
      await axiosInstance.delete(`/api/subjects/${subjectId}`);

      // Show success message
      setToast({ show: true, message: 'Subject deleted successfully', type: 'success' });

      // Refresh both subjects list and distinct values
      await Promise.all([fetchSubjects(), fetchDistinctValues()]);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3000);
    } catch (error) {
      console.error('Error deleting subject:', error);
      setToast({ 
        show: true, 
        message: error.message || 'Error deleting subject', 
        type: 'error' 
      });
    }
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      setToast({
        show: true,
        message: 'Please select a CSV file first',
        type: 'error'
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      setLoading(true);
      const response = await axiosInstance.post('/api/subjects/upload-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setToast({ 
        show: true, 
        message: `Successfully added ${response.data.addedCount} out of ${response.data.totalRecords} subjects${
          response.data.failedRecords > 0 ? ` (${response.data.failedRecords} failed)` : ''
        }`, 
        type: 'success' 
      });
      
      setCsvFile(null);
      // Reset file input
      e.target.reset();
      
      // Refresh both subjects list and distinct values
      await Promise.all([fetchSubjects(), fetchDistinctValues()]);
    } catch (error) {
      console.error('Error uploading CSV:', error);
      setToast({ 
        show: true, 
        message: error.response?.data?.message || 'Error uploading CSV file', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCsvFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setCsvFile(null);
      return;
    }
    
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setToast({
        show: true,
        message: 'Please upload a CSV file',
        type: 'error'
      });
      e.target.value = '';
      setCsvFile(null);
      return;
    }
    
    setCsvFile(file);
  };

  const handleDeleteFilteredSubjects = async () => {
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      
      const queryParams = new URLSearchParams(activeFilters).toString();
      
      await axiosInstance.delete(`/api/subjects?${queryParams}`);

      setToast({ show: true, message: 'Filtered subjects deleted successfully', type: 'success' });
      
      // Refresh both subjects list and distinct values
      await Promise.all([fetchSubjects(), fetchDistinctValues()]);

      // Reset filters if all subjects of a particular filter are deleted
      setFilters(prev => ({
        ...prev,
        regulation: '',
        branch: ''
      }));

      setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3000);
    } catch (error) {
      console.error('Error deleting filtered subjects:', error);
      setToast({ 
        show: true, 
        message: error.message || 'Error deleting filtered subjects', 
        type: 'error' 
      });
    }
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  useEffect(() => {
    fetchSubjects();
    fetchDistinctValues();
  }, [fetchSubjects]);

  useEffect(() => {
    const fetchBranches = async () => {
      if (!filters.regulation) {
        setDistinctBranches([]);
        return;
      }
      try {
        const response = await axiosInstance.get(`/api/subjects/distinct/branch?regulation=${filters.regulation}`);
        setDistinctBranches(response.data);
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
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={closeToast}
          duration={3000}
        />
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

      {/* Add CSV Upload Form - Add this after the "Add New Subject" form */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <h3 className="font-semibold">Upload Subjects via CSV</h3>
        <form onSubmit={handleCsvUpload} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="csv-file" className="block text-sm font-medium text-gray-700">
              Choose CSV File
            </label>
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleCsvFileChange}
              className="w-full border rounded p-2"
              required
            />
            <p className="text-sm text-gray-500">
              CSV should have headers: regulation,year,branch,semester,subjectCode,subjectName
            </p>
          </div>
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-green-300"
            disabled={loading || !csvFile}
          >
            {loading ? 'Uploading...' : 'Upload CSV'}
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
            <div className="w-full">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="w-24 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Regulation</th>
                    <th scope="col" className="w-24 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                    <th scope="col" className="w-16 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                    <th scope="col" className="w-20 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Semester</th>
                    <th scope="col" className="w-32 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject Code</th>
                    <th scope="col" className="flex-1 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject Name</th>
                    <th scope="col" className="w-20 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    <th scope="col" className="w-24 px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete all filtered subjects?')) {
                            handleDeleteFilteredSubjects();
                          }
                        }}
                        className="bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600 transition-colors duration-200 flex items-center space-x-1 text-xs"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete All</span>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentSubjects.map((subject) => (
                    <tr key={subject._id}>
                      <td className="px-2 py-3 text-sm whitespace-nowrap">{subject.regulation}</td>
                      <td className="px-2 py-3 text-sm whitespace-nowrap">{subject.branch}</td>
                      <td className="px-2 py-3 text-sm whitespace-nowrap">{subject.year}</td>
                      <td className="px-2 py-3 text-sm whitespace-nowrap">{subject.semester}</td>
                      <td className="px-2 py-3 text-sm whitespace-nowrap">{subject.subjectCode}</td>
                      <td className="px-2 py-3 text-sm break-words">{subject.subjectName}</td>
                      <td className="px-2 py-3 text-sm whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteSubject(subject._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                      <td className="px-2 py-3 text-sm whitespace-nowrap"></td>
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