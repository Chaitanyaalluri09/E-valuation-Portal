import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';
import { MdAdd, MdDelete, MdEdit } from 'react-icons/md';

function PaperSchemaManagement() {
  const [schemas, setSchemas] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchema, setEditingSchema] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    totalSets: '',
    questionsPerSet: 2,
    totalMarks: '',
    questionSets: []
  });

  useEffect(() => {
    fetchSchemas();
  }, []);

  const fetchSchemas = async () => {
    try {
      const response = await axiosInstance.get('/api/paper-schemas');
      setSchemas(response.data);
    } catch (error) {
      console.error('Error fetching schemas:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'totalSets' && !editingSchema) {
      const totalSets = parseInt(value);
      const newQuestionSets = [];
      
      for (let i = 1; i <= totalSets; i += 2) {
        // Create main set
        const mainSet = {
          setNumber: i,
          questions: [
            { questionNumber: i.toString(), maxMarks: 0 }
          ],
          hasParts: false,
          choiceSetNumber: i + 1
        };
        
        // Create choice set
        const choiceSet = {
          setNumber: i + 1,
          questions: [
            { questionNumber: (i + 1).toString(), maxMarks: 0 }
          ],
          hasParts: false,
          choiceSetNumber: i
        };

        newQuestionSets.push(mainSet, choiceSet);
      }

      setFormData(prev => ({
        ...prev,
        [name]: value,
        questionSets: newQuestionSets
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleQuestionMarksChange = (setIndex, questionIndex, value) => {
    setFormData(prev => {
      const newQuestionSets = [...prev.questionSets];
      newQuestionSets[setIndex].questions[questionIndex].maxMarks = Number(value);
      return {
        ...prev,
        questionSets: newQuestionSets
      };
    });
  };

  const toggleQuestionParts = (setIndex) => {
    setFormData(prev => {
      const newQuestionSets = [...prev.questionSets];
      const set = {...newQuestionSets[setIndex]}; // Create a new object for the set
      const currentMarks = set.questions[0]?.maxMarks || 0;
      
      // Toggle hasParts first
      set.hasParts = !set.hasParts;
      
      // Then update questions based on new hasParts value
      if (!set.hasParts) {
        // Converting from parts (a,b) to single question
        set.questions = [
          { questionNumber: set.setNumber.toString(), maxMarks: currentMarks }
        ];
      } else {
        // Converting from single question to parts (a,b)
        set.questions = [
          { questionNumber: `${set.setNumber}a`, maxMarks: currentMarks },
          { questionNumber: `${set.setNumber}b`, maxMarks: currentMarks }
        ];
      }
      
      newQuestionSets[setIndex] = set; // Replace the old set with the new one

      return {
        ...prev,
        questionSets: newQuestionSets
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSchema) {
        await axiosInstance.put(`/api/paper-schemas/${editingSchema._id}`, formData);
      } else {
        await axiosInstance.post('/api/paper-schemas', formData);
      }
      setIsModalOpen(false);
      setEditingSchema(null);
      setFormData({
        name: '',
        totalSets: '',
        questionsPerSet: 2,
        totalMarks: '',
        questionSets: []
      });
      fetchSchemas();
    } catch (error) {
      console.error('Error saving schema:', error);
    }
  };

  const handleEdit = (schema) => {
    // When editing, make sure to preserve the hasParts flag and question structure
    setEditingSchema(schema);
    setFormData({
      ...schema,
      questionSets: schema.questionSets.map(set => ({
        ...set,
        questions: [...set.questions] // Make a deep copy of questions
      }))
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this schema?')) {
      try {
        await axiosInstance.delete(`/api/paper-schemas/${id}`);
        fetchSchemas();
      } catch (error) {
        console.error('Error deleting schema:', error);
      }
    }
  };

  function disableNumberInputScrolling(e) {
    // Prevent the mousewheel from changing the input value
    e.target.blur();
  }

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Paper Schemas</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <MdAdd /> Create New Schema
        </button>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingSchema ? 'Edit Schema' : 'Create New Schema'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Schema Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Sets (Must be even)</label>
                  <input
                    type="number"
                    name="totalSets"
                    value={formData.totalSets}
                    onChange={handleInputChange}
                    onWheel={(e) => e.target.blur()}
                    min="2"
                    step="2"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Marks</label>
                  <input
                    type="number"
                    name="totalMarks"
                    value={formData.totalMarks}
                    onChange={handleInputChange}
                    onWheel={(e) => e.target.blur()}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Question Sets */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Question Sets</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.questionSets.map((set, setIndex) => (
                    <div key={setIndex} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">
                          Set {set.setNumber} 
                          {setIndex % 2 === 0 ? 
                            ` (Choice: Set ${set.choiceSetNumber})` : 
                            ` (Choice: Set ${set.choiceSetNumber})`
                          }
                        </h4>
                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={set.hasParts || false}
                            onChange={() => toggleQuestionParts(setIndex)}
                            className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Has parts (a,b)</span>
                        </label>
                      </div>
                      <div className="space-y-3">
                        {set.questions.map((question, qIndex) => (
                          <div key={qIndex} className="flex items-center gap-2">
                            <span className="font-medium w-8">
                              {question.questionNumber}:
                            </span>
                            <input
                              type="number"
                              value={question.maxMarks}
                              onChange={(e) => handleQuestionMarksChange(setIndex, qIndex, e.target.value)}
                              onWheel={(e) => e.target.blur()}
                              className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Marks"
                              min="0"
                              required
                            />
                            <span className="text-sm text-gray-500">marks</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingSchema(null);
                    setFormData({
                      name: '',
                      totalSets: '',
                      questionsPerSet: 2,
                      totalMarks: '',
                      questionSets: []
                    });
                  }}
                  className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingSchema ? 'Update Schema' : 'Create Schema'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schema List with Empty State */}
      {schemas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600 text-lg">No paper schemas found.</p>
          <p className="text-gray-500 mt-2">Click the 'Create New Schema' button to add one.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {schemas.map(schema => (
            <div key={schema._id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-800">{schema.name}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(schema)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <MdEdit size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(schema._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <MdDelete size={20} />
                  </button>
                </div>
              </div>
              <div className="text-gray-600">
                <p>Total Sets: {schema.totalSets}</p>
                <p>Total Marks: {schema.totalMarks}</p>
              </div>
            </div>
          ))}
        </div>
      )}

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

export default PaperSchemaManagement; 