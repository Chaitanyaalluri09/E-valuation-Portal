// Update submission (both for saving progress and final submission)
router.put('/:evaluationId/submissions/:submissionId', async (req, res) => {
  try {
    const { evaluationId, submissionId } = req.params;
    const { status, questionMarks, totalMarks } = req.body;

    const evaluation = await Evaluation.findById(evaluationId);
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    // Find and update the specific submission
    const submissionIndex = evaluation.studentSubmissions.findIndex(
      sub => sub._id.toString() === submissionId
    );

    if (submissionIndex === -1) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Update the submission
    evaluation.studentSubmissions[submissionIndex] = {
      ...evaluation.studentSubmissions[submissionIndex],
      status,
      questionMarks,
      ...(totalMarks && { totalMarks }), // Only include totalMarks if provided (for final submission)
      lastModified: new Date()
    };

    await evaluation.save();
    res.json({ message: 'Submission updated successfully' });
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ message: 'Error updating submission' });
  }
}); 