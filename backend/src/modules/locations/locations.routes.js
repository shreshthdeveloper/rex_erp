const express = require('express');
const router = express.Router();
const { Country, State } = require('../../models');
const { authenticate } = require('../../middleware/auth.middleware');

// Apply authentication to all routes
router.use(authenticate);

// Get all countries
router.get('/countries', async (req, res, next) => {
  try {
    const countries = await Country.findAll({
      order: [['name', 'ASC']]
    });
    res.json({
      success: true,
      data: { countries },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// Get states by country
router.get('/countries/:countryId/states', async (req, res, next) => {
  try {
    const { countryId } = req.params;
    const states = await State.findAll({
      where: { country_id: countryId },
      order: [['name', 'ASC']]
    });
    res.json({
      success: true,
      data: { states },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// Get all states
router.get('/states', async (req, res, next) => {
  try {
    const { countryId } = req.query;
    const where = countryId ? { country_id: countryId } : {};
    const states = await State.findAll({
      where,
      include: [{ model: Country, attributes: ['id', 'name', 'code'] }],
      order: [['name', 'ASC']]
    });
    res.json({
      success: true,
      data: { states },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
