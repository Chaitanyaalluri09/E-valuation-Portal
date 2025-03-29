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
  const [selectedChoices, setSelectedChoices] = useState({});

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

        // Initialize marks and choices from submission
        if (sub.questionMarks && sub.questionMarks.length > 0) {
          const marksObj = {};
          sub.questionMarks.forEach(qm => {
            marksObj[qm.questionNumber] = qm.marks;
          });
          setMarks(marksObj);

          // Determine selected choices based on marked questions
          const choicesObj = {};
          schemaResponse.data.questionSets.forEach((set, index) => {
            if (index % 2 === 0) { // Main sets only
              const mainSetQuestions = set.questions.map(q => q.questionNumber);
              const choiceSetQuestions = schemaResponse.data.questionSets[index + 1].questions.map(q => q.questionNumber);
              
              // Check which set has marks to determine the selected choice
              const hasMainSetMarks = mainSetQuestions.some(q => marksObj[q] !== undefined);
              const hasChoiceSetMarks = choiceSetQuestions.some(q => marksObj[q] !== undefined);
              
              if (hasMainSetMarks) {
                choicesObj[set.setNumber] = 'main';
              } else if (hasChoiceSetMarks) {
                choicesObj[set.setNumber] = 'choice';
              }
            }
          });
          setSelectedChoices(choicesObj);
        }

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
      [questionNumber]: Number(value)
    }));
  };

  const handleChoiceSelection = (setNumber, choice) => {
    setSelectedChoices(prev => ({
      ...prev,
      [setNumber]: choice
    }));

    // Clear marks for unselected choice
    const mainSet = schema.questionSets.find(s => s.setNumber === setNumber);
    const choiceSet = schema.questionSets.find(s => s.setNumber === mainSet.choiceSetNumber);
    
    const questionsToReset = choice === 'main' ? 
      choiceSet.questions.map(q => q.questionNumber) :
      mainSet.questions.map(q => q.questionNumber);

    setMarks(prev => {
      const newMarks = { ...prev };
      questionsToReset.forEach(qNum => {
        delete newMarks[qNum];
      });
      return newMarks;
    });
  };

  const handleSubmitEvaluation = async () => {
    try {
      // Convert marks object to array format
      const questionMarks = Object.entries(marks).map(([questionNumber, marks]) => ({
        questionNumber,
        marks
      }));

      const totalMarks = Object.values(marks).reduce((sum, mark) => sum + mark, 0);

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Answer Paper - Takes up 2/3 of the space */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-4">
            <h3 className="font-semibold mb-2 text-gray-700">Answer Paper</h3>
            {answerPaperUrl ? (
              <div className="w-full h-[85vh] overflow-hidden rounded">
                <iframe
                  src={`${answerPaperUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                  className="w-full h-full"
                  title="Answer Paper"
                  style={{ border: "none" }}
                />
              </div>
            ) : (
              <div className="w-full h-48 border rounded flex items-center justify-center bg-gray-100">
                Loading answer paper...
              </div>
            )}
          </div>

          {/* Evaluation Controls - Takes up 1/3 of the space */}
          <div className="lg:sticky lg:top-4 bg-white rounded-lg shadow-lg p-4 h-fit">
            <h3 className="font-semibold mb-6 text-gray-700">Evaluation</h3>
            {schema && (
              <div className="space-y-6">
                {schema.questionSets.map((set, index) => (
                  index % 2 === 0 && ( // Only show main sets with their choices
                    <div key={set.setNumber} className="border rounded-lg p-4">
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">
                          Question {set.setNumber}
                          {set.hasParts ? ' (Select parts a,b or alternative)' : ' (Select question or alternative)'}
                        </h4>
                        <div className="flex gap-4 mb-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`choice-${set.setNumber}`}
                              checked={selectedChoices[set.setNumber] === 'main'}
                              onChange={() => handleChoiceSelection(set.setNumber, 'main')}
                              className="mr-2"
                            />
                            {set.hasParts ? `Q${set.setNumber}(a,b)` : `Q${set.setNumber}`}
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`choice-${set.setNumber}`}
                              checked={selectedChoices[set.setNumber] === 'choice'}
                              onChange={() => handleChoiceSelection(set.setNumber, 'choice')}
                              className="mr-2"
                            />
                            {schema.questionSets[index + 1].hasParts ? 
                              `Q${set.choiceSetNumber}(a,b)` : 
                              `Q${set.choiceSetNumber}`}
                          </label>
                        </div>
                      </div>

                      {/* Show questions based on selected choice */}
                      {selectedChoices[set.setNumber] && (
                        <div className="space-y-3">
                          {(selectedChoices[set.setNumber] === 'main' ? set : 
                            schema.questionSets.find(s => s.setNumber === set.choiceSetNumber)
                          ).questions.map((question) => (
                            <div key={question.questionNumber} className="flex items-center gap-2">
                              <span className="font-medium w-8">
                                {question.questionNumber}:
                              </span>
                              <input
                                type="number"
                                value={marks[question.questionNumber] || ''}
                                onChange={(e) => handleMarkChange(question.questionNumber, e.target.value)}
                                className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Marks"
                                min="0"
                                max={question.maxMarks}
                              />
                              <span className="text-sm text-gray-500">/{question.maxMarks}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                ))}

                <div className="pt-4 border-t">
                  <p className="text-lg font-semibold">
                    Total Marks: {Object.values(marks).reduce((sum, mark) => sum + mark, 0)}
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
  );
}

export default PaperEvaluation; 