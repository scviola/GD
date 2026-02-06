const ProjectTask = require('../models/ProjectTask');

const getTaskOptions = async (req, res) => {
  try {
    // Extract enums from the Mongoose schema
    const schemaPaths = ProjectTask.schema.paths; //to dynamically read the enums from the Mongoose model

    const stages = schemaPaths.stage.enumValues;
    const tasks = schemaPaths.task.enumValues;
    const statuses = schemaPaths.status.enumValues;
    const transportModes = schemaPaths.transportMode.enumValues;

    res.status(200).json({
      stages,
      tasks,
      statuses,
      transportModes
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load task options', error: err.message });
  }
};

module.exports = { getTaskOptions };
