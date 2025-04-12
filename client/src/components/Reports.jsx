import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';
import { MdDownload, MdFilterList, MdAssignment, MdPending, MdDone, MdTrendingUp, MdPeople } from 'react-icons/md';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function Reports() {
  const [evaluations, setEvaluations] = useState([]);
  const [evaluators, setEvaluators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [evaluatorFilter, setEvaluatorFilter] = useState('All');

  // Update the statistics state to include more metrics
  const [statistics, setStatistics] = useState({
    totalEvaluations: 0,
    inProgress: 0,
    completed: 0,
    performance: 0,
    averageMarks: 0,
    highestMarks: 0,
    lowestMarks: 0,
    totalStudents: 0
  });

  useEffect(() => {
    fetchEvaluations();
    fetchEvaluators();
  }, []);

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

  const fetchEvaluators = async () => {
    try {
      const response = await axiosInstance.get('/api/users/evaluators');
      if (response.data) {
        console.log('Fetched evaluators:', response.data); // For debugging
        setEvaluators(response.data);
      }
    } catch (error) {
      console.error('Error fetching evaluators:', error);
      // Optionally show error to user
      setError('Failed to fetch evaluators');
    }
  };

  const getFilteredEvaluations = () => {
    if (evaluatorFilter === 'All') return evaluations;
    return evaluations.filter(evaluation => evaluation.evaluator?._id === evaluatorFilter);
  };

  const downloadReport = (evaluation) => {
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
    a.download = `${evaluation.subject}_${evaluation.branch}_${evaluation.year}_results.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Update the calculateStatistics function to include the new metrics
  const calculateStatistics = (evaluations, selectedEvaluatorId) => {
    const filteredEvals = selectedEvaluatorId === 'All' 
      ? evaluations 
      : evaluations.filter(evaluation => evaluation.evaluator?._id === selectedEvaluatorId);

    const stats = {
      totalEvaluations: filteredEvals.length,
      inProgress: filteredEvals.filter(evaluation => evaluation.status === 'In Progress').length,
      completed: filteredEvals.filter(evaluation => evaluation.status === 'Completed').length,
      performance: 0,
      averageMarks: 0,
      highestMarks: 0,
      lowestMarks: Infinity,
      totalStudents: 0
    };

    // Calculate performance and marks statistics
    let totalMarks = 0;
    let totalStudents = 0;

    filteredEvals.forEach(evaluation => {
      const completedSubmissions = evaluation.studentSubmissions.filter(sub => sub.status === 'Completed');
      completedSubmissions.forEach(submission => {
        const marks = submission.totalMarks || 0;
        totalMarks += marks;
        stats.highestMarks = Math.max(stats.highestMarks, marks);
        stats.lowestMarks = Math.min(stats.lowestMarks, marks);
        totalStudents++;
      });
    });

    // Calculate averages and performance
    stats.totalStudents = totalStudents;
    stats.averageMarks = totalStudents > 0 ? Math.round(totalMarks / totalStudents) : 0;
    stats.lowestMarks = stats.lowestMarks === Infinity ? 0 : stats.lowestMarks;

    if (stats.totalEvaluations > 0) {
      const totalSubmissions = filteredEvals.reduce((acc, evaluation) => 
        acc + evaluation.studentSubmissions.length, 0);
      const completedSubmissions = filteredEvals.reduce((acc, evaluation) => 
        acc + evaluation.studentSubmissions.filter(sub => sub.status === 'Completed').length, 0);
      stats.performance = Math.round((completedSubmissions / totalSubmissions) * 100) || 0;
    }

    setStatistics(stats);
  };

  // Update useEffect to calculate statistics when evaluations or filter changes
  useEffect(() => {
    calculateStatistics(evaluations, evaluatorFilter);
  }, [evaluations, evaluatorFilter]);

  // Add chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  // Prepare chart data
  const statusChartData = {
    labels: ['Not Started', 'In Progress', 'Completed'],
    datasets: [
      {
        data: [
          statistics.totalEvaluations - statistics.inProgress - statistics.completed,
          statistics.inProgress,
          statistics.completed
        ],
        backgroundColor: [
          'rgb(251, 191, 36)',
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const marksDistributionData = {
    labels: ['0-20', '21-40', '41-60', '61-80', '81-100'],
    datasets: [
      {
        label: 'Number of Students',
        data: calculateMarksDistribution(),
        backgroundColor: 'rgba(12, 90, 147, 0.6)',
        borderColor: 'rgb(12, 90, 147)',
        borderWidth: 1,
      },
    ],
  };

  // Function to calculate marks distribution
  function calculateMarksDistribution() {
    if (evaluatorFilter === 'All') return [0, 0, 0, 0, 0];

    const distribution = [0, 0, 0, 0, 0];
    const filteredEvals = evaluations.filter(evaluation => evaluation.evaluator?._id === evaluatorFilter);

    filteredEvals.forEach(evaluation => {
      evaluation.studentSubmissions.forEach(submission => {
        if (submission.status === 'Completed') {
          const marks = submission.totalMarks || 0;
          if (marks <= 20) distribution[0]++;
          else if (marks <= 40) distribution[1]++;
          else if (marks <= 60) distribution[2]++;
          else if (marks <= 80) distribution[3]++;
          else distribution[4]++;
        }
      });
    });

    return distribution;
  }

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4">
      {/* Statistics Section */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Evaluations</p>
              <p className="text-2xl font-bold text-[#0C5A93]">{statistics.totalEvaluations}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <MdAssignment className="text-[#0C5A93] text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{statistics.inProgress}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <MdPending className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Completed</p>
              <p className="text-2xl font-bold text-green-600">{statistics.completed}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <MdDone className="text-green-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Performance</p>
              <div className="flex items-center">
                <p className="text-2xl font-bold text-purple-600">{statistics.performance}%</p>
              </div>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <MdTrendingUp className="text-purple-600 text-xl" />
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${statistics.performance}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Add new statistics cards for marks */}
        {evaluatorFilter !== 'All' && (
          <>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Average Marks</p>
                  <p className="text-2xl font-bold text-orange-600">{statistics.averageMarks}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <MdTrendingUp className="text-orange-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Highest Marks</p>
                  <p className="text-2xl font-bold text-green-600">{statistics.highestMarks}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <MdTrendingUp className="text-green-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Lowest Marks</p>
                  <p className="text-2xl font-bold text-red-600">{statistics.lowestMarks}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <MdTrendingUp className="text-red-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Students</p>
                  <p className="text-2xl font-bold text-purple-600">{statistics.totalStudents}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <MdPeople className="text-purple-600 text-xl" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts Section */}
      {evaluatorFilter !== 'All' && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Status Distribution Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Evaluation Status Distribution</h3>
            <div className="h-64">
              <Doughnut data={statusChartData} options={chartOptions} />
            </div>
          </div>

          {/* Marks Distribution Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Marks Distribution</h3>
            <div className="h-64">
              <Bar 
                data={marksDistributionData} 
                options={{
                  ...chartOptions,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Number of Students'
                      }
                    },
                    x: {
                      title: {
                        display: true,
                        text: 'Marks Range'
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Evaluation Reports</h2>
        
        {/* Evaluator Filter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <MdFilterList className="text-gray-600" />
            <select
              value={evaluatorFilter}
              onChange={(e) => setEvaluatorFilter(e.target.value)}
              className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C5A93]"
            >
              <option value="" disabled>Select Evaluator</option>
              <option value="All">All Evaluators</option>
              {evaluators && evaluators.length > 0 ? (
                evaluators.map(evaluator => (
                  <option key={evaluator._id} value={evaluator._id}>
                    {evaluator.username}
                  </option>
                ))
              ) : (
                <option value="" disabled>No evaluators found</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {getFilteredEvaluations().length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-gray-600 text-lg">
            {evaluations.length === 0 ? 'No evaluations found' : 'No evaluations for selected evaluator'}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Download Results</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredEvaluations().map((evaluation) => {
                  const completedPapers = evaluation.studentSubmissions.filter(sub => sub.status === 'Completed').length;
                  const totalPapers = evaluation.studentSubmissions.length;
                  const progress = Math.round((completedPapers / totalPapers) * 100);

                  return (
                    <tr key={evaluation._id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">{evaluation.subjectCode}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">{evaluation.subject}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">{evaluation.branch}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">{evaluation.year}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-sm text-gray-600">{progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${evaluation.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                            evaluation.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 
                            'bg-yellow-100 text-yellow-800'}`}>
                          {evaluation.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {new Date(evaluation.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                        {evaluation.status === 'Completed' ? (
                          <button
                            onClick={() => downloadReport(evaluation)}
                            className="text-green-600 hover:text-green-800 transition-colors"
                            title="Download Results"
                          >
                            <MdDownload className="text-xl" />
                          </button>
                        ) : (
                          <span className="text-gray-400 italic text-sm">Not available</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports; 