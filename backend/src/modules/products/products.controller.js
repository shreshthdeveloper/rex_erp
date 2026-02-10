const productsService = require('./products.service');

exports.createProduct = async (req, res, next) => {
  try {
    const product = await productsService.create(req.body);
    
    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, category_id, is_active } = req.query;
    
    const result = await productsService.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      category_id,
      is_active: is_active === 'true'
    });
    
    res.json({
      success: true,
      data: {
        products: result.products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await productsService.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' }
      });
    }
    
    res.json({
      success: true,
      data: product,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await productsService.update(req.params.id, req.body);
    
    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    await productsService.delete(req.params.id);
    
    res.json({
      success: true,
      message: 'Product deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getProductInventory = async (req, res, next) => {
  try {
    const inventory = await productsService.getInventory(req.params.id);
    
    res.json({
      success: true,
      data: inventory,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};
