import { useState, useEffect } from 'react';
import axios from 'axios';

function CreateEvaluation() {
  const [formData, setFormData] = useState({
    regulation: '',
    year: '',
    branch: '',
    semester: '',
    subject: '',
    evaluator: '',
    numberOfStudents: '',
  });
  const [evaluators, setEvaluators] = useState([]);
  const [files, setFiles] = useState(new Array(0));
  const [registerNumbers, setRegisterNumbers] = useState(new Array(0));
  const [subjects, setSubjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [regulations, setRegulations] = useState([]);
  const [questionPaper, setQuestionPaper] = useState(null);
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchEvaluators = async () => {
      try {
        const response = await axios.get('/api/users');
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
        const response = await axios.get('/api/subjects/filter', {
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
        const response = await axios.get(`/api/subjects/distinct/branch?regulation=${formData.regulation}`);
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
        const response = await axios.get('/api/subjects/distinct/regulation');
        setRegulations(response.data);
      } catch (error) {
        console.error('Error fetching regulations:', error);
      }
    };
    fetchRegulations();
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
    console.log('Regulation changed to:', newRegulation);
    setFormData(prev => ({
      ...prev,
      regulation: newRegulation,
      branch: '',  // Reset branch
      subject: ''  // Reset subject
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all register numbers and files
    if (registerNumbers.some(rn => !rn.trim())) {
      alert('Please enter all register numbers');
      return;
    }

    if (files.some(file => !file)) {
      alert('Please upload all PDF files');
      return;
    }

    const formDataToSend = new FormData();
    
    // Append form data
    Object.keys(formData).forEach(key => {
      formDataToSend.append(key, formData[key]);
    });
    
    // Append files with their register numbers
    files.forEach((file, index) => {
      formDataToSend.append('files', file);
      formDataToSend.append('registerNumbers', registerNumbers[index]);
    });

    // Append question paper to form data
    if (questionPaper) {
      formDataToSend.append('questionPaper', questionPaper);
    }

    try {
      await axios.post('/api/evaluations/create', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Evaluation created successfully!');
    } catch (error) {
      console.error('Error creating evaluation:', error);
      alert('Error creating evaluation');
    }
  };

  return (
    <div className="min-h-screen bg-[#E3F2FD] py-1">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-6">Create Evaluation</h2>
        <form onSubmit={handleSubmit}>
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
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
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4"
                      placeholder={`Enter register number ${index + 1}`}
                      required
                    />
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(index, e.target.files[0])}
                      className="w-64"
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
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
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
            <label className="block text-sm font-medium text-gray-700">Evaluator</label>
            <select
              value={formData.evaluator}
              onChange={(e) => setFormData({...formData, evaluator: e.target.value})}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
              required
            >
              <option value="">Select Evaluator</option>
              {evaluators.map(evaluator => (
                <option key={evaluator._id} value={evaluator._id}>
                  {evaluator.username}
                </option>
              ))}
            </select>
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Evaluation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateEvaluation; 