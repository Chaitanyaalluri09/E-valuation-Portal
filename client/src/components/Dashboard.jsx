import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';
import { MdAssignment } from 'react-icons/md';
import Toast from './Toast';

function Dashboard() {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

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

  const handleDelete = async (evaluationId) => {
    if (!window.confirm('Are you sure you want to delete this evaluation?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/api/evaluations/${evaluationId}`);
      fetchEvaluations(); // Refresh the list
      setSuccessMessage('Evaluation deleted successfully');
      
      // Clear the success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      alert('Failed to delete evaluation');
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4">
      {/* Success Message Toast */}
      {successMessage && <Toast message={successMessage} />}

      <h2 className="text-2xl font-bold mb-6">Evaluations Dashboard</h2>

      {evaluations.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md">
          <div className="text-gray-600 text-lg mb-4">No evaluations found</div>
          <button
            onClick={() => document.querySelector('[data-menu="create-evaluation"]').click()}
            className="flex items-center gap-2 bg-[#0C5A93] text-white px-6 py-3 rounded-lg hover:bg-[#094875] transition-colors"
          >
            <MdAssignment className="text-xl" />
            Create Evaluation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {evaluations.map((evaluation) => {
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
                      <span className="font-medium truncate">{evaluation.evaluator.username}</span>
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

                  {/* Delete Button */}
                  <div className="flex justify-end pt-2">
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
    </div>
  );
}

export default Dashboard; 