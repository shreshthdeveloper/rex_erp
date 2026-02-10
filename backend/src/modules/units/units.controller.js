const unitsService = require('./units.service');

// Get all units
const getUnits = async (req, res, next) => {
  try {
    const result = await unitsService.getUnits(req.query);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// Get unit by ID
const getUnitById = async (req, res, next) => {
  try {
    const unit = await unitsService.getUnitById(req.params.id);
    res.json({
      success: true,
      unit
    });
  } catch (error) {
    next(error);
  }
};

// Create unit
const createUnit = async (req, res, next) => {
  try {
    const unit = await unitsService.createUnit(req.body);
    res.status(201).json({
      success: true,
      message: 'Unit created successfully',
      unit
    });
  } catch (error) {
    next(error);
  }
};

// Update unit
const updateUnit = async (req, res, next) => {
  try {
    const unit = await unitsService.updateUnit(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Unit updated successfully',
      unit
    });
  } catch (error) {
    next(error);
  }
};

// Delete unit
const deleteUnit = async (req, res, next) => {
  try {
    await unitsService.deleteUnit(req.params.id);
    res.json({
      success: true,
      message: 'Unit deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUnits,
  getUnitById,
  createUnit,
  updateUnit,
  deleteUnit
};
