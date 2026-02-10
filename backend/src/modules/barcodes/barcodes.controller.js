const barcodesService = require('./barcodes.service');

const generateProductBarcode = async (req, res, next) => {
  try {
    const result = await barcodesService.generateProductBarcode(req.params.productId);
    
    const message = result.generated ? 'Barcode generated successfully' : 'Product already has barcode';
    res.json({
      success: true,
      message,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const generateBulkBarcodes = async (req, res, next) => {
  try {
    const { productIds } = req.body;
    const result = await barcodesService.generateBulkBarcodes(productIds);
    
    res.json({
      success: true,
      message: 'Bulk barcode generation completed',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const lookupBarcode = async (req, res, next) => {
  try {
    const { barcode } = req.params;
    const result = await barcodesService.lookupBarcode(barcode);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const scanBarcode = async (req, res, next) => {
  try {
    const result = await barcodesService.scanBarcode(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      message: 'Barcode scanned successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const validateBarcode = async (req, res, next) => {
  try {
    const { barcode } = req.params;
    const result = await barcodesService.validateBarcode(barcode);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getScanHistory = async (req, res, next) => {
  try {
    const result = await barcodesService.getScanHistory(req.query);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const pickByBarcode = async (req, res, next) => {
  try {
    const { dispatchId, barcode, quantity } = req.body;
    const result = await barcodesService.pickByBarcode(dispatchId, barcode, quantity, req.user.id);
    
    res.json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const printBarcodeLabels = async (req, res, next) => {
  try {
    const { productIds, format, size, quantity } = req.body;
    const result = await barcodesService.printBarcodeLabels(productIds, { format, size, quantity });
    
    res.json({
      success: true,
      message: 'Barcode labels generated',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateProductBarcode,
  generateBulkBarcodes,
  lookupBarcode,
  scanBarcode,
  validateBarcode,
  getScanHistory,
  pickByBarcode,
  printBarcodeLabels
};
