import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';
import Toast from './Toast';

function CreateEvaluation() {
  const [formData, setFormData] = useState({
    regulation: '',
    year: '',
    branch: '',
    semester: '',
    subject: '',
    evaluator: '',
    numberOfStudents: '',
    paperSchema: ''
  });
  const [evaluators, setEvaluators] = useState([]);
  const [files, setFiles] = useState(new Array(0));
  const [registerNumbers, setRegisterNumbers] = useState(new Array(0));
  const [subjects, setSubjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [regulations, setRegulations] = useState([]);
  const [questionPaper, setQuestionPaper] = useState(null);
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [paperSchemas, setPaperSchemas] = useState([]);

  useEffect(() => {
    const fetchEvaluators = async () => {
      try {
        const response = await axiosInstance.get('/api/users');
        const evaluatorsList = response.data.filter(user => user.role === 'evaluator');
        setEvaluators(evaluatorsList);
      } catch (error) {
        console.error('Error fetching evaluators:', error);
      }
    };
    fetchEvaluators();
  }, []);

  useEffect(() => {
    const fetchSubjects = async () => {
      // Reset subjects if any required field is missing
      if (!formData.regulation || !formData.year || !formData.branch || !formData.semester) {
        setSubjects([]);
        return;
      }

      try {
        const response = await axiosInstance.get('/api/subjects/filter', {
          params: {
            regulation: formData.regulation,
            year: formData.year,
            branch: formData.branch,
            semester: formData.semester
          }
        });
        setSubjects(response.data);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        setSubjects([]);
      }
    };

    fetchSubjects();
  }, [formData.regulation, formData.year, formData.branch, formData.semester]);

  useEffect(() => {
    const fetchBranches = async () => {
      if (!formData.regulation) {
        setBranches([]);
        return;
      }
      try {
        const response = await axiosInstance.get(`/api/subjects/distinct/branch?regulation=${formData.regulation}`);
        setBranches(response.data);
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };
    fetchBranches();
  }, [formData.regulation]);

  useEffect(() => {
    const fetchRegulations = async () => {
      try {
        const response = await axiosInstance.get('/api/subjects/distinct/regulation');
        setRegulations(response.data);
      } catch (error) {
        console.error('Error fetching regulations:', error);
      }
    };
    fetchRegulations();
  }, []);

  useEffect(() => {
    const fetchPaperSchemas = async () => {
      try {
        const response = await axiosInstance.get('/api/paper-schemas');
        setPaperSchemas(response.data);
      } catch (error) {
        console.error('Error fetching paper schemas:', error);
      }
    };
    fetchPaperSchemas();
  }, []);

  // Initialize register number inputs when number of students changes
  const handleStudentNumberChange = (value) => {
    setFormData({ ...formData, numberOfStudents: value });
    const numStudents = parseInt(value) || 0;
    setRegisterNumbers(new Array(numStudents).fill(''));
    setFiles(new Array(numStudents).fill(null));
  };

  // Handle individual file upload
  const handleFileChange = (index, file) => {
    if (!file) return;

    if (!file.type.includes('pdf')) {
      alert('Please upload a PDF file only');
      return;
    }

    const newFiles = [...files];
    newFiles[index] = file;
    setFiles(newFiles);
  };

  // Update regulation change handler
  const handleRegulationChange = (e) => {
    const newRegulation = e.target.value;
    setFormData(prev => ({
      ...prev,
      regulation: newRegulation,
      branch: '',
      subject: ''
    }));
  };

  const handleQuestionPaperChange = (file) => {
    if (!file) return;

    if (!file.type.includes('pdf')) {
      alert('Please upload a PDF file only for the question paper');
      return;
    }

    setQuestionPaper(file);
  };

  // Add this function to filter evaluators based on selected subject
  const getFilteredEvaluators = () => {
    if (!formData.subject) {
      return [];
    }
    return evaluators.filter(evaluator => 
      evaluator.subjects && evaluator.subjects.includes(formData.subject)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(''); // Clear any existing message

    try {
      const submitFormData = new FormData();
      
      const jsonData = {
        regulation: formData.regulation,
        year: formData.year,
        branch: formData.branch,
        semester: formData.semester,
        subject: formData.subject,
        evaluator: formData.evaluator,
        numberOfStudents: parseInt(formData.numberOfStudents),
        endDate: endDate,
        registerNumbers: registerNumbers,
        paperSchema: formData.paperSchema
      };

      submitFormData.append('formData', JSON.stringify(jsonData));
      submitFormData.append('questionPaper', questionPaper);
      files.forEach((file) => {
        submitFormData.append('files', file);
      });

      await axiosInstance.post('/api/evaluations/create', submitFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccessMessage('Evaluation created successfully!');
      
      // Reset form
      setFormData({
        regulation: '',
        year: '',
        branch: '',
        semester: '',
        subject: '',
        evaluator: '',
        numberOfStudents: '',
        paperSchema: ''
      });
      setFiles(new Array(0));
      setRegisterNumbers(new Array(0));
      setQuestionPaper(null);
      setEndDate('');

      // Reset all file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach(input => {
        input.value = '';
      });

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

    } catch (error) {
      console.error('Error creating evaluation:', error);
      alert(error.response?.data?.message || 'Error creating evaluation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E3F2FD] py-1">
      {successMessage && <Toast message={successMessage} />}
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-6">Create Evaluation</h2>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Regulation</label>
              <select
                value={formData.regulation}
                onChange={handleRegulationChange}
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
                required
              >
                <option value="">Select Regulation</option>
                {regulations.map((regulation) => (
                  <option key={regulation} value={regulation}>
                    {regulation}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Year</label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({...formData, year: e.target.value})}
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
                required
              >
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Branch</label>
              <select
                value={formData.branch}
                onChange={(e) => {
                  console.log('Branch selected:', e.target.value);
                  setFormData(prev => ({...prev, branch: e.target.value}));
                }}
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
                required
              >
                <option value="">Select Branch</option>
                {branches.map((branch, index) => (
                  <option key={index} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Semester</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({...formData, semester: e.target.value})}
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
                required
              >
                <option value="">Select Semester</option>
                <option value="1">1st Semester</option>
                <option value="2">2nd Semester</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">Number of Students</label>
            <input
              type="number"
              min="1"
              value={formData.numberOfStudents}
              onChange={(e) => handleStudentNumberChange(e.target.value)}
              onWheel={(e) => e.target.blur()}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
              placeholder="Enter number of students"
              required
            />
          </div>

          {registerNumbers.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Enter Register Numbers and Upload PDF Files
              </label>
              <div className="space-y-4">
                {registerNumbers.map((rn, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <input
                      type="text"
                      value={rn}
                      onChange={(e) => {
                        const newRegisterNumbers = [...registerNumbers];
                        newRegisterNumbers[index] = e.target.value;
                        setRegisterNumbers(newRegisterNumbers);
                      }}
                      className="flex-1 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
                      placeholder={`Enter register number ${index + 1}`}
                      required
                    />
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(index, e.target.files[0])}
                      className="w-64 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">Subject</label>
            <select
              value={formData.subject}
              onChange={(e) => {
                setFormData({
                  ...formData, 
                  subject: e.target.value,
                  evaluator: '' // Reset evaluator when subject changes
                });
              }}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
              required
              disabled={!formData.regulation || !formData.year || !formData.branch || !formData.semester}
            >
              <option value="">Select Subject</option>
              {subjects.map(subject => (
                <option key={subject._id} value={subject.subjectName}>
                  {subject.subjectCode} - {subject.subjectName}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">Paper Schema</label>
            <select
              value={formData.paperSchema}
              onChange={(e) => setFormData({...formData, paperSchema: e.target.value})}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
              required
            >
              <option value="">Select Paper Schema</option>
              {paperSchemas.map(schema => (
                <option key={schema._id} value={schema._id}>
                  {schema.name} - {schema.totalSets} sets, {schema.totalMarks} marks
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">Evaluator</label>
            <select
              value={formData.evaluator}
              onChange={(e) => setFormData({...formData, evaluator: e.target.value})}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
              required
              disabled={!formData.subject} // Disable until subject is selected
            >
              <option value="">Select Evaluator</option>
              {getFilteredEvaluators().map(evaluator => (
                <option key={evaluator._id} value={evaluator._id}>
                  {evaluator.username}
                </option>
              ))}
            </select>
            {formData.subject && getFilteredEvaluators().length === 0 && (
              <p className="mt-1 text-sm text-red-600">
                No evaluators available for this subject
              </p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Question Paper
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => handleQuestionPaperChange(e.target.files[0])}
              className="w-full"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]} // Prevents selecting past dates
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
              required
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => {
                // Reset form
                setFormData({
                  regulation: '',
                  year: '',
                  branch: '',
                  semester: '',
                  subject: '',
                  evaluator: '',
                  numberOfStudents: '',
                  paperSchema: ''
                });
                setFiles(new Array(0));
                setRegisterNumbers(new Array(0));
                setQuestionPaper(null);
                setEndDate('');
                
                // Reset all file inputs
                const fileInputs = document.querySelectorAll('input[type="file"]');
                fileInputs.forEach(input => {
                  input.value = '';
                });
              }}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Reset
            </button>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Evaluation
            </button>
          </div>
        </form>

        {/* Loading indicator */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg">
              <p className="text-lg font-semibold">Creating evaluation...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateEvaluation; 