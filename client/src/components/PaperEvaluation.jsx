import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';
import { MdArrowBack, MdDescription, MdClose } from 'react-icons/md';

function PaperEvaluation() {
  const { evaluationId, submissionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [schema, setSchema] = useState(null);
  const [questionPaperUrl, setQuestionPaperUrl] = useState(null);
  const [answerPaperUrl, setAnswerPaperUrl] = useState(null);
  const [showQuestionPaper, setShowQuestionPaper] = useState(false);
  const [marks, setMarks] = useState({});

  // First, add these styles at the top of your component
  const styles = {
    pdfContainer: {
      height: 'calc(100vh - 180px)', // Adjusted to account for header and paper title
      flex: 1 // Added to make it fill available space
    }
  };

  useEffect(() => {
    const fetchPaper = async () => {
      try {
        const response = await axiosInstance.get(`/api/evaluations/${evaluationId}`);
        setEvaluation(response.data);
        const sub = response.data.studentSubmissions.find(s => s._id === submissionId);
        if (!sub) {
          throw new Error('Submission not found');
        }
        setSubmission(sub);

        // Fetch paper schema
        const schemaResponse = await axiosInstance.get(`/api/paper-schemas/${response.data.paperSchema}`);
        setSchema(schemaResponse.data);

        // Get signed URLs for both papers
        const [questionResponse, answerResponse] = await Promise.all([
          axiosInstance.get(`/api/evaluations/file-url?key=${encodeURIComponent(response.data.questionPaperUrl)}`),
          axiosInstance.get(`/api/evaluations/file-url?key=${encodeURIComponent(sub.answerPaperUrl)}`)
        ]);

        setQuestionPaperUrl(questionResponse.data.url);
        setAnswerPaperUrl(answerResponse.data.url);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching paper:', error);
        setError('Failed to fetch paper details');
        setLoading(false);
      }
    };

    fetchPaper();
  }, [evaluationId, submissionId]);

  // Function to handle escape key press
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setShowQuestionPaper(false);
      }
    };

    if (showQuestionPaper) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showQuestionPaper]);

  const handleBackClick = () => {
    navigate(`/evaluator/evaluation/${evaluationId}`);
  };

  const handleMarkChange = (questionNumber, value) => {
    setMarks(prev => ({
      ...prev,
      [questionNumber]: Number(value) || 0  // Convert to number or 0 if empty
    }));
  };

  // Function to get the maximum marks between two sets
  const getMaxSetMarks = (set1Questions, set2Questions) => {
    const set1Total = set1Questions.reduce((sum, q) => sum + (marks[q.questionNumber] || 0), 0);
    const set2Total = set2Questions.reduce((sum, q) => sum + (marks[q.questionNumber] || 0), 0);
    return set1Total >= set2Total ? 'main' : 'choice';
  };

  const handleSubmitEvaluation = async () => {
    try {
      // Get final marks by selecting maximum scoring sets
      const finalMarks = {};
      schema.questionSets.forEach((set, index) => {
        if (index % 2 === 0) {
          const choiceSet = schema.questionSets[index + 1];
          const selectedSet = getMaxSetMarks(set.questions, choiceSet.questions) === 'main' ? 
            set.questions : choiceSet.questions;
          
          selectedSet.forEach(q => {
            if (marks[q.questionNumber]) {
              finalMarks[q.questionNumber] = marks[q.questionNumber];
            }
          });
        }
      });

      const questionMarks = Object.entries(finalMarks).map(([questionNumber, marks]) => ({
        questionNumber,
        marks
      }));

      const totalMarks = Object.values(finalMarks).reduce((sum, mark) => sum + mark, 0);

      await axiosInstance.put(`/api/evaluations/${evaluationId}/submissions/${submissionId}`, {
        questionMarks,
        totalMarks,
        status: 'Completed'
      });

      navigate(`/evaluator/evaluation/${evaluationId}`);
    } catch (error) {
      console.error('Error submitting evaluation:', error);
    }
  };

  // Add this function at the top of your component
  function disableNumberInputScrolling(e) {
    // Prevent the mousewheel from changing the input value
    e.target.blur();
  }

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

  if (!evaluation || !submission) return (
    <div className="min-h-screen bg-[#EBF3FA] flex items-center justify-center">
      <div className="text-gray-600">Paper not found</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#EBF3FA]">
      {/* Header */}
      <header className="bg-[#0C5A93] text-white shadow">
        <div className="px-4 py-3 flex items-center">
          <button 
            onClick={handleBackClick}
            className="mr-2 hover:bg-[#094875] p-2 rounded transition-colors flex items-center"
            title="Back to Papers List"
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
        <div className="mb-4 bg-white rounded-lg shadow-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-[#0C5A93] mb-2">{evaluation.subject}</h1>
              <p className="text-gray-600">Register Number: {submission.registerNumber}</p>
            </div>
            <button
              onClick={() => setShowQuestionPaper(!showQuestionPaper)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700"
            >
              <MdDescription className="text-xl" />
              View Question Paper
            </button>
          </div>
        </div>

        {/* Question Paper Modal Overlay */}
        {showQuestionPaper && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg max-w-4xl w-full h-[90vh] mx-4 flex flex-col">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-4 bg-[#0C5A93] text-white rounded-t-lg">
                <h3 className="font-semibold text-lg">Question Paper</h3>
                <button
                  onClick={() => setShowQuestionPaper(false)}
                  className="p-2 hover:bg-[#094875] rounded-full transition-colors"
                >
                  <MdClose className="text-xl" />
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="flex-1 overflow-auto p-4">
                {questionPaperUrl ? (
                  <iframe
                    src={`${questionPaperUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                    className="w-full h-full"
                    title="Question Paper"
                    style={{ border: "none" }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    Loading question paper...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Two Column Layout for Answer Paper and Evaluation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
          {/* Answer Paper - Takes up 2/3 of the space */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
            <h3 className="font-semibold p-4 border-b text-gray-700">Answer Paper</h3>
            <div className="flex-1">
              {answerPaperUrl ? (
                <iframe
                  src={`${answerPaperUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                  className="w-full h-full"
                  title="Answer Paper"
                  style={{ border: "none" }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  Loading answer paper...
                </div>
              )}
            </div>
          </div>

          {/* Evaluation Controls - Takes up 1/3 of the space */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="font-semibold mb-6 text-gray-700">Evaluation</h3>
              {schema && (
                <div className="space-y-4">
                  {schema.questionSets.map((set, index) => (
                    <div key={set.setNumber} className="p-2">
                      <div className="space-y-3">
                        {set.hasParts ? (
                          <div className="flex items-center gap-4">
                            {set.questions.map((question) => (
                              <div key={question.questionNumber} className="flex-1 flex items-center gap-2">
                                <span className="font-medium w-6">
                                  {question.questionNumber}:
                                </span>
                                <input
                                  type="number"
                                  value={marks[question.questionNumber] || ''}
                                  onChange={(e) => handleMarkChange(question.questionNumber, e.target.value)}
                                  onWheel={disableNumberInputScrolling}
                                  className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Marks"
                                  min="0"
                                  max={question.maxMarks}
                                />
                                <span className="text-sm text-gray-500">/{question.maxMarks}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-medium w-6">
                              {set.questions[0].questionNumber}:
                            </span>
                            <input
                              type="number"
                              value={marks[set.questions[0].questionNumber] || ''}
                              onChange={(e) => handleMarkChange(set.questions[0].questionNumber, e.target.value)}
                              onWheel={disableNumberInputScrolling}
                              className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Marks"
                              min="0"
                              max={set.questions[0].maxMarks}
                            />
                            <span className="text-sm text-gray-500">/{set.questions[0].maxMarks}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t mt-4">
                    <p className="text-lg font-semibold">
                      Total Marks: {
                        schema.questionSets.reduce((total, set, index) => {
                          if (index % 2 === 0) {
                            const choiceSet = schema.questionSets[index + 1];
                            const set1Total = set.questions.reduce((sum, q) => sum + (marks[q.questionNumber] || 0), 0);
                            const set2Total = choiceSet.questions.reduce((sum, q) => sum + (marks[q.questionNumber] || 0), 0);
                            return total + Math.max(set1Total, set2Total);
                          }
                          return total;
                        }, 0)
                      }
                      /{schema.totalMarks}
                    </p>
                  </div>

                  <button
                    onClick={handleSubmitEvaluation}
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Submit Evaluation
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add this CSS at the bottom of your component */}
      <style>
        {`
          /* Hide spinner buttons for number inputs */
          input[type=number]::-webkit-inner-spin-button,
          input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          
          /* For Firefox */
          input[type=number] {
            -moz-appearance: textfield;
          }
        `}
      </style>
    </div>
  );
}

export default PaperEvaluation; 