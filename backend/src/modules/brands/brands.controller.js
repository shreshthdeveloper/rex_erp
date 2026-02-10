const brandsService = require('./brands.service');

// Get all brands
const getBrands = async (req, res, next) => {
  try {
    const result = await brandsService.getBrands(req.query);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// Get brand by ID
const getBrandById = async (req, res, next) => {
  try {
    const brand = await brandsService.getBrandById(req.params.id);
    res.json({
      success: true,
      brand
    });
  } catch (error) {
    next(error);
  }
};

// Create brand
const createBrand = async (req, res, next) => {
  try {
    const brand = await brandsService.createBrand(req.body);
    res.status(201).json({
      success: true,
      message: 'Brand created successfully',
      brand
    });
  } catch (error) {
    next(error);
  }
};

// Update brand
const updateBrand = async (req, res, next) => {
  try {
    const brand = await brandsService.updateBrand(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Brand updated successfully',
      brand
    });
  } catch (error) {
    next(error);
  }
};

// Delete brand
const deleteBrand = async (req, res, next) => {
  try {
    await brandsService.deleteBrand(req.params.id);
    res.json({
      success: true,
      message: 'Brand deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand
};
