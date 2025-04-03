import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';
import { MdAssignment, MdDownload, MdFilterList } from 'react-icons/md';
import Toast from './Toast';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showResults, setShowResults] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const navigate = useNavigate();

  const filterOptions = ['All', 'Not Started', 'In Progress', 'Completed'];

  const fetchEvaluations = async () => {
    try {
      const response = await axiosInstance.get('/api/evaluations');
      setEvaluations(response.data);
    } catch (error) {
      setError('Failed to fetch evaluations');
      console.error('Error fetching evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const closeToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  const handleDelete = async (evaluationId) => {
    if (!window.confirm('Are you sure you want to delete this evaluation?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/api/evaluations/${evaluationId}`);
      setToast({
        show: true,
        message: 'Evaluation deleted successfully',
        type: 'success',
        duration: 3000
      });
      fetchEvaluations(); // Refresh the list
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      setToast({
        show: true,
        message: 'Failed to delete evaluation',
        type: 'error',
        duration: 3000
      });
    }
  };

  const downloadCSV = (evaluation) => {
    // Create CSV header
    let csv = 'Register Number,';
    
    // Get all unique question numbers
    const allQuestions = new Set();
    evaluation.studentSubmissions.forEach(submission => {
      submission.questionMarks.forEach(mark => {
        allQuestions.add(mark.questionNumber);
      });
    });
    const sortedQuestions = Array.from(allQuestions).sort();
    
    // Add question numbers to header
    sortedQuestions.forEach(q => {
      csv += `Q${q},`;
    });
    csv += 'Total Marks\n';

    // Add data rows
    evaluation.studentSubmissions.forEach(submission => {
      csv += `${submission.registerNumber},`;
      
      // Create a map of question numbers to marks
      const marksMap = {};
      submission.questionMarks.forEach(mark => {
        marksMap[mark.questionNumber] = mark.marks;
      });
      
      // Add marks for each question
      sortedQuestions.forEach(q => {
        csv += `${marksMap[q] || '0'},`;
      });
      
      csv += `${submission.totalMarks || '0'}\n`;
    });

    // Create and trigger download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${evaluation.subject}_results.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getFilteredEvaluations = () => {
    if (statusFilter === 'All') return evaluations;
    return evaluations.filter(evaluation => evaluation.status === statusFilter);
  };

  const ResultsModal = ({ evaluation, onClose }) => {
    if (!evaluation) return null;

    // Get all unique question numbers
    const allQuestions = new Set();
    evaluation.studentSubmissions.forEach(submission => {
      submission.questionMarks.forEach(mark => {
        allQuestions.add(mark.questionNumber);
      });
    });
    const sortedQuestions = Array.from(allQuestions).sort();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col">
          <div className="p-4 border-b flex justify-between items-center bg-[#0C5A93] text-white rounded-t-lg">
            <h3 className="text-xl font-semibold">{evaluation.subject} - Results</h3>
            <button
              onClick={onClose}
              className="text-white hover:bg-[#094875] p-2 rounded-full"
            >
              ×
            </button>
          </div>
          
          <div className="p-4 flex justify-between items-center border-b bg-gray-50">
            <div>
              <p className="text-sm text-gray-600">Total Submissions: {evaluation.studentSubmissions.length}</p>
            </div>
            <button
              onClick={() => downloadCSV(evaluation)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              <MdDownload />
              Download CSV
            </button>
          </div>

          <div className="overflow-auto flex-1 p-4">
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 sticky left-0 bg-gray-100">Register Number</th>
                  {sortedQuestions.map(q => (
                    <th key={q} className="border p-2">Q{q}</th>
                  ))}
                  <th className="border p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {evaluation.studentSubmissions.map(submission => {
                  // Create a map of question numbers to marks
                  const marksMap = {};
                  submission.questionMarks.forEach(mark => {
                    marksMap[mark.questionNumber] = mark.marks;
                  });

                  return (
                    <tr key={submission._id}>
                      <td className="border p-2 sticky left-0 bg-white font-medium">
                        {submission.registerNumber}
                      </td>
                      {sortedQuestions.map(q => (
                        <td key={q} className="border p-2 text-center">
                          {marksMap[q] || '0'}
                        </td>
                      ))}
                      <td className="border p-2 text-center font-semibold">
                        {submission.totalMarks || '0'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4">
      {/* Success Message Toast */}
      {toast.show && (
        <Toast 
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={closeToast}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Evaluations Dashboard</h2>
        
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

      {getFilteredEvaluations().length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md">
          <div className="text-gray-600 text-lg mb-4">
            {evaluations.length === 0 ? 'No evaluations found' : 'No evaluations match the selected filter'}
          </div>
          {evaluations.length === 0 && (
            <button
              onClick={() => document.querySelector('[data-menu="create-evaluation"]').click()}
              className="flex items-center gap-2 bg-[#0C5A93] text-white px-6 py-3 rounded-lg hover:bg-[#094875] transition-colors"
            >
              <MdAssignment className="text-xl" />
              Create Evaluation
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getFilteredEvaluations().map((evaluation) => {
            const correctedPapers = evaluation.studentSubmissions.filter(
              sub => sub.status === 'evaluated' || sub.status === 'reviewed'
            ).length;
            const totalPapers = evaluation.studentSubmissions.length;
            const remainingPapers = totalPapers - correctedPapers;

            return (
              <div key={evaluation._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                {/* Card Header */}
                <div className="bg-[#0C5A93] text-white p-3">
                  <h3 className="text-lg font-semibold truncate">
                    {evaluation.subject}
                  </h3>
                </div>
                
                {/* Card Body */}
                <div className="p-3 space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-x-2">
                    <div className="space-y-2">
                      <div className="flex flex-col">
                        <span className="text-gray-600">Regulation</span>
                        <span className="font-medium">{evaluation.regulation}</span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-gray-600">Year</span>
                        <span className="font-medium">{evaluation.year}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-col">
                        <span className="text-gray-600">Branch</span>
                        <span className="font-medium">{evaluation.branch}</span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-gray-600">Semester</span>
                        <span className="font-medium">{evaluation.semester}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Evaluator</span>
                      <span className="font-medium truncate">
                        {evaluation.evaluator?.username || 'Not Assigned'}
                      </span>
                    </div>
                  </div>

                  {/* Papers Status */}
                  <div className="bg-gray-50 p-2 rounded-md mt-2">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-gray-600 text-xs">Total</div>
                        <div className="font-semibold">{totalPapers}</div>
                      </div>
                      <div>
                        <div className="text-gray-600 text-xs">Corrected</div>
                        <div className="font-semibold text-green-600">{correctedPapers}</div>
                      </div>
                      <div>
                        <div className="text-gray-600 text-xs">Remaining</div>
                        <div className="font-semibold text-orange-600">{remainingPapers}</div>
                      </div>
                    </div>
                  </div>

                  {/* End Date */}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-gray-600">End Date</span>
                    <span className="text-red-600 font-medium">
                      {new Date(evaluation.endDate).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Evaluation Status */}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-gray-600">Status</span>
                    <span className="font-medium" style={{ 
                      color: evaluation.status === 'Not Started' ? '#CA8A04' :  // yellow-600
                             evaluation.status === 'In Progress' ? '#2563EB' :  // blue-600
                             '#16A34A'  // green-600 for Completed
                    }}>
                      {evaluation.status}
                    </span>
                  </div>

                  {/* Add View Result and Delete buttons */}
                  <div className="flex justify-end gap-2 pt-2">
                    {evaluation.status === 'Completed' && (
                      <button
                        onClick={() => navigate(`/admin/evaluation/${evaluation._id}/results`)}
                        className="bg-blue-500 text-white px-3 py-1.5 text-sm rounded hover:bg-blue-600 transition-colors"
                      >
                        View Result
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(evaluation._id)}
                      className="bg-red-500 text-white px-3 py-1.5 text-sm rounded hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Results Modal */}
      {showResults && selectedEvaluation && (
        <ResultsModal
          evaluation={selectedEvaluation}
          onClose={() => {
            setShowResults(false);
            setSelectedEvaluation(null);
          }}
        />
      )}
    </div>
  );
}

export default Dashboard; 