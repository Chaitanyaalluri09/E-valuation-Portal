import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';
import { MdArrowBack, MdDownload } from 'react-icons/md';

function EvaluationResults() {
  const { evaluationId } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        const response = await axiosInstance.get(`/api/evaluations/${evaluationId}`);
        setEvaluation(response.data);
      } catch (error) {
        console.error('Error fetching evaluation:', error);
        setError('Failed to fetch evaluation details');
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluation();
  }, [evaluationId]);

  const downloadCSV = () => {
    if (!evaluation) return;

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

  if (loading) return (
    <div className="min-h-screen bg-[#EBF3FA] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#EBF3FA] flex items-center justify-center">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    </div>
  );

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
    <div className="min-h-screen bg-[#EBF3FA]">
      {/* Header */}
      <header className="bg-[#0C5A93] text-white shadow">
        <div className="px-4 py-3 flex items-center">
          <button 
            onClick={() => navigate('/admin/dashboard')}
            className="mr-2 hover:bg-[#094875] p-2 rounded transition-colors flex items-center"
            title="Back to Dashboard"
          >
            <MdArrowBack className="text-xl" />
          </button>
          <h2 className="text-center text-base font-bold flex-1">
            SAGI RAMA KRISHNAM RAJU ENGINEERING COLLEGE (AUTONOMOUS)
          </h2>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Results Header */}
          <div className="p-4 border-b">
            <h1 className="text-2xl font-bold text-[#0C5A93] mb-2">
              {evaluation.subject} ({evaluation.subjectCode})
            </h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Regulation:</span>
                <span className="ml-2 font-medium">{evaluation.regulation}</span>
              </div>
              <div>
                <span className="text-gray-600">Branch:</span>
                <span className="ml-2 font-medium">{evaluation.branch}</span>
              </div>
              <div>
                <span className="text-gray-600">Year:</span>
                <span className="ml-2 font-medium">{evaluation.year}</span>
              </div>
              <div>
                <span className="text-gray-600">Semester:</span>
                <span className="ml-2 font-medium">{evaluation.semester}</span>
              </div>
            </div>
          </div>

          {/* Download Button */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Total Submissions: {evaluation.studentSubmissions.length}
              </p>
              <button
                onClick={downloadCSV}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              >
                <MdDownload />
                Download CSV
              </button>
            </div>
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
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
    </div>
  );
}

export default EvaluationResults; 