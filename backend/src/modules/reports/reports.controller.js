const reportsService = require('./reports.service');

// SALES REPORTS
const getSalesSummary = async (req, res, next) => {
  try {
    const result = await reportsService.getSalesSummary(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getSalesByPeriod = async (req, res, next) => {
  try {
    const result = await reportsService.getSalesByPeriod(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getSalesByProduct = async (req, res, next) => {
  try {
    const result = await reportsService.getSalesByProduct(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getSalesByCustomer = async (req, res, next) => {
  try {
    const result = await reportsService.getSalesByCustomer(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// INVENTORY REPORTS
const getInventorySummary = async (req, res, next) => {
  try {
    const result = await reportsService.getInventorySummary(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getInventoryByWarehouse = async (req, res, next) => {
  try {
    const result = await reportsService.getInventoryByWarehouse();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getLowStockReport = async (req, res, next) => {
  try {
    const result = await reportsService.getLowStockReport(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getInventoryMovement = async (req, res, next) => {
  try {
    const result = await reportsService.getInventoryMovement(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// FINANCIAL REPORTS
const getReceivablesAgingReport = async (req, res, next) => {
  try {
    const result = await reportsService.getReceivablesAgingReport(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getPayablesAgingReport = async (req, res, next) => {
  try {
    const result = await reportsService.getPayablesAgingReport();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getProfitAndLossReport = async (req, res, next) => {
  try {
    const result = await reportsService.getProfitAndLossReport(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getTaxReport = async (req, res, next) => {
  try {
    const result = await reportsService.getTaxReport(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// PURCHASE REPORTS
const getPurchaseSummary = async (req, res, next) => {
  try {
    const result = await reportsService.getPurchaseSummary(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getPurchasesBySupplier = async (req, res, next) => {
  try {
    const result = await reportsService.getPurchasesBySupplier(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// CUSTOM REPORTS
const generateCustomReport = async (req, res, next) => {
  try {
    const result = await reportsService.generateCustomReport(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSalesSummary,
  getSalesByPeriod,
  getSalesByProduct,
  getSalesByCustomer,
  getInventorySummary,
  getInventoryByWarehouse,
  getLowStockReport,
  getInventoryMovement,
  getReceivablesAgingReport,
  getPayablesAgingReport,
  getProfitAndLossReport,
  getTaxReport,
  getPurchaseSummary,
  getPurchasesBySupplier,
  generateCustomReport
};
