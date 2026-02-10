const { AuditLog } = require('../models');

const auditLog = (action, entityType) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = async function(data) {
      try {
        // Only log successful operations (2xx status codes)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          await AuditLog.create({
            user_id: req.user?.userId || null,
            action,
            entity_type: entityType,
            entity_id: req.params.id || null,
            old_values: req.originalBody || null,
            new_values: req.body || null,
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.get('user-agent')
          });
        }
      } catch (error) {
        console.error('Audit log error:', error);
      }
      
      originalSend.call(this, data);
    };
    
    // Store original body for updates
    if (['PUT', 'PATCH'].includes(req.method)) {
      req.originalBody = { ...req.body };
    }
    
    next();
  };
};

module.exports = { auditLog };
