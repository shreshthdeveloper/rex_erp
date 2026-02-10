const dashboardService = require('./dashboard.service');

const getOverviewStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getOverviewStats(req.user.id, req.user.role);
    res.json({ success: true, data: { stats } });
  } catch (error) {
    next(error);
  }
};

const getRecentActivities = async (req, res, next) => {
  try {
    const result = await dashboardService.getRecentActivities(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getSalesChartData = async (req, res, next) => {
  try {
    const result = await dashboardService.getSalesChartData(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getPendingTasks = async (req, res, next) => {
  try {
    const result = await dashboardService.getPendingTasks(req.user.id, req.user.role);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getTopProducts = async (req, res, next) => {
  try {
    const result = await dashboardService.getTopProducts(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getTopCustomers = async (req, res, next) => {
  try {
    const result = await dashboardService.getTopCustomers(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getWarehouseStats = async (req, res, next) => {
  try {
    const result = await dashboardService.getWarehouseStats();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverviewStats,
  getRecentActivities,
  getSalesChartData,
  getPendingTasks,
  getTopProducts,
  getTopCustomers,
  getWarehouseStats
};
