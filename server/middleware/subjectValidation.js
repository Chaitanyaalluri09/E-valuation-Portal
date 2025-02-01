const validateSubject = (req, res, next) => {
  const { regulation, year, branch, semester, subjectCode, subjectName } = req.body;

  // Validate required fields
  if (!regulation || !year || !branch || !semester || !subjectCode || !subjectName) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Validate regulation
  const validRegulations = ['R23', 'R20', 'R19'];
  if (!validRegulations.includes(regulation)) {
    return res.status(400).json({ message: 'Invalid regulation' });
  }

  // Validate year
  const validYears = ['1', '2', '3', '4'];
  if (!validYears.includes(year)) {
    return res.status(400).json({ message: 'Invalid year' });
  }

  // Validate branch
  const validBranches = ['CSE', 'ECE', 'EEE','MECH', 'CIVIL','IT','AIDS','AIML','CSBS','CSD'];
  if (!validBranches.includes(branch)) {
    return res.status(400).json({ message: 'Invalid branch' });
  }

  // Validate semester
  const validSemesters = ['1', '2'];
  if (!validSemesters.includes(semester)) {
    return res.status(400).json({ message: 'Invalid semester' });
  }

  // Subject code format validation (you can modify this based on your requirements)
  if (!/^[A-Z0-9]{5,10}$/.test(subjectCode)) {
    return res.status(400).json({ message: 'Invalid subject code format' });
  }

  // Subject name length validation
  if (subjectName.length < 3 || subjectName.length > 100) {
    return res.status(400).json({ message: 'Subject name must be between 3 and 100 characters' });
  }

  next();
};

module.exports = validateSubject; 