const categoriesService = require('./categories.service');
const { AppError } = require('../../middleware/error.middleware');

// Category controllers
exports.createCategory = async (req, res, next) => {
  try {
    const category = await categoriesService.createCategory(req.body);
    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, parentId, isActive, flat } = req.query;
    const result = await categoriesService.findAllCategories({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      parentId,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      flat: flat === 'true'
    });

    res.json({
      success: true,
      data: {
        categories: result.categories,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await categoriesService.findCategoryById(req.params.id);
    if (!category) {
      throw new AppError('Category not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: category,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await categoriesService.updateCategory(req.params.id, req.body);
    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    await categoriesService.deleteCategory(req.params.id);
    res.json({
      success: true,
      message: 'Category deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// Attribute controllers
exports.createAttribute = async (req, res, next) => {
  try {
    const attribute = await categoriesService.createAttribute(req.body);
    res.status(201).json({
      success: true,
      data: attribute,
      message: 'Attribute created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getAttributes = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, isVariant } = req.query;
    const result = await categoriesService.findAllAttributes({
      page: parseInt(page),
      limit: parseInt(limit),
      isVariant: isVariant === 'true' ? true : isVariant === 'false' ? false : undefined
    });

    res.json({
      success: true,
      data: result.attributes,
      pagination: {
        page: result.page,
        limit,
        total: result.total,
        totalPages: result.totalPages
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getAttributeById = async (req, res, next) => {
  try {
    const attribute = await categoriesService.findAttributeById(req.params.id);
    if (!attribute) {
      throw new AppError('Attribute not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: attribute,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAttribute = async (req, res, next) => {
  try {
    const attribute = await categoriesService.updateAttribute(req.params.id, req.body);
    res.json({
      success: true,
      data: attribute,
      message: 'Attribute updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteAttribute = async (req, res, next) => {
  try {
    await categoriesService.deleteAttribute(req.params.id);
    res.json({
      success: true,
      message: 'Attribute deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.addAttributeValue = async (req, res, next) => {
  try {
    const value = await categoriesService.addAttributeValue(req.params.id, req.body);
    res.status(201).json({
      success: true,
      data: value,
      message: 'Attribute value added successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAttributeValue = async (req, res, next) => {
  try {
    const value = await categoriesService.updateAttributeValue(req.params.valueId, req.body);
    res.json({
      success: true,
      data: value,
      message: 'Attribute value updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteAttributeValue = async (req, res, next) => {
  try {
    await categoriesService.deleteAttributeValue(req.params.valueId);
    res.json({
      success: true,
      message: 'Attribute value deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};
