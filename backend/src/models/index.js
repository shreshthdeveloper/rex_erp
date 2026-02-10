const sequelize = require('../config/database');

// Import all models
const User = require('./User');
const Role = require('./Role');
const Permission = require('./Permission');
const Country = require('./Country');
const State = require('./State');
const TaxRate = require('./TaxRate');
const Customer = require('./Customer');
const Supplier = require('./Supplier');
const Category = require('./Category');
const Brand = require('./Brand');
const Unit = require('./Unit');
const Product = require('./Product');
const Attribute = require('./Attribute');
const AttributeValue = require('./AttributeValue');
const ProductAttribute = require('./ProductAttribute');
const ProductImage = require('./ProductImage');
const Warehouse = require('./Warehouse');
const Inventory = require('./Inventory');
const InventoryTransaction = require('./InventoryTransaction');
const StockAdjustment = require('./StockAdjustment');
const StockAdjustmentItem = require('./StockAdjustmentItem');
const WarehouseTransfer = require('./WarehouseTransfer');
const WarehouseTransferItem = require('./WarehouseTransferItem');
const SalesOrder = require('./SalesOrder');
const SalesOrderItem = require('./SalesOrderItem');
const Invoice = require('./Invoice');
const InvoiceItem = require('./InvoiceItem');
const PurchaseOrder = require('./PurchaseOrder');
const PurchaseOrderItem = require('./PurchaseOrderItem');
const GRN = require('./GRN');
const GRNItem = require('./GRNItem');
const CustomerPayment = require('./CustomerPayment');
const SupplierPayment = require('./SupplierPayment');
const PaymentMethod = require('./PaymentMethod');
const ShippingCarrier = require('./ShippingCarrier');
const Dispatch = require('./Dispatch');
const DispatchItem = require('./DispatchItem');
const TrackingUpdate = require('./TrackingUpdate');
const ReturnRequest = require('./ReturnRequest');
const ReturnItem = require('./ReturnItem');
const Barcode = require('./Barcode');
const BarcodeScan = require('./BarcodeScan');
const NotificationTemplate = require('./NotificationTemplate');
const NotificationLog = require('./NotificationLog');
const Notification = require('./Notification');
const AuditLog = require('./AuditLog');

// =====================================================
// AUTHENTICATION & AUTHORIZATION
// =====================================================
User.belongsToMany(Role, { through: 'user_roles', foreignKey: 'user_id' });
Role.belongsToMany(User, { through: 'user_roles', foreignKey: 'role_id' });

Role.belongsToMany(Permission, { through: 'role_permissions', foreignKey: 'role_id' });
Permission.belongsToMany(Role, { through: 'role_permissions', foreignKey: 'permission_id' });

// =====================================================
// MASTER DATA
// =====================================================
Country.hasMany(State, { foreignKey: 'country_id' });
State.belongsTo(Country, { foreignKey: 'country_id' });

Country.hasMany(TaxRate, { foreignKey: 'country_id' });
TaxRate.belongsTo(Country, { foreignKey: 'country_id' });
State.hasMany(TaxRate, { foreignKey: 'state_id' });
TaxRate.belongsTo(State, { foreignKey: 'state_id' });

// Customer associations
Customer.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Customer.belongsTo(Country, { foreignKey: 'billing_country_id', as: 'billingCountry' });
Customer.belongsTo(State, { foreignKey: 'billing_state_id', as: 'billingState' });
Customer.belongsTo(Country, { foreignKey: 'shipping_country_id', as: 'shippingCountry' });
Customer.belongsTo(State, { foreignKey: 'shipping_state_id', as: 'shippingState' });

// Supplier associations
Supplier.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Supplier.belongsTo(Country, { foreignKey: 'country_id' });
Supplier.belongsTo(State, { foreignKey: 'state_id' });

// =====================================================
// PRODUCT CATALOG
// =====================================================
Category.hasMany(Category, { foreignKey: 'parent_id', as: 'children' });
Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent' });

// Unit self-referential (for conversion)
Unit.hasMany(Unit, { foreignKey: 'base_unit_id', as: 'derivedUnits' });
Unit.belongsTo(Unit, { foreignKey: 'base_unit_id', as: 'baseUnit' });

Product.belongsTo(Category, { foreignKey: 'category_id' });
Category.hasMany(Product, { foreignKey: 'category_id' });

Product.belongsTo(Brand, { foreignKey: 'brand_id' });
Brand.hasMany(Product, { foreignKey: 'brand_id' });

Product.belongsTo(Unit, { foreignKey: 'unit_id' });
Unit.hasMany(Product, { foreignKey: 'unit_id' });

Product.hasMany(Product, { foreignKey: 'parent_product_id', as: 'variants' });
Product.belongsTo(Product, { foreignKey: 'parent_product_id', as: 'parentProduct' });

// Attributes
Attribute.hasMany(AttributeValue, { foreignKey: 'attribute_id', as: 'values' });
AttributeValue.belongsTo(Attribute, { foreignKey: 'attribute_id' });

// Product Attributes
Product.hasMany(ProductAttribute, { foreignKey: 'product_id', as: 'productAttributes' });
ProductAttribute.belongsTo(Product, { foreignKey: 'product_id' });
ProductAttribute.belongsTo(Attribute, { foreignKey: 'attribute_id' });
ProductAttribute.belongsTo(AttributeValue, { foreignKey: 'attribute_value_id' });

// Product Images
Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images' });
ProductImage.belongsTo(Product, { foreignKey: 'product_id' });

// =====================================================
// WAREHOUSE & INVENTORY
// =====================================================
Warehouse.belongsTo(Country, { foreignKey: 'country_id' });
Warehouse.belongsTo(State, { foreignKey: 'state_id' });
Warehouse.belongsTo(User, { foreignKey: 'manager_id', as: 'manager' });

Inventory.belongsTo(Product, { foreignKey: 'product_id' });
Inventory.belongsTo(Warehouse, { foreignKey: 'warehouse_id' });
Product.hasMany(Inventory, { foreignKey: 'product_id' });
Warehouse.hasMany(Inventory, { foreignKey: 'warehouse_id' });

// Inventory Transactions
InventoryTransaction.belongsTo(Product, { foreignKey: 'product_id' });
InventoryTransaction.belongsTo(Warehouse, { foreignKey: 'warehouse_id' });
InventoryTransaction.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Stock Adjustments
StockAdjustment.belongsTo(Warehouse, { foreignKey: 'warehouse_id' });
StockAdjustment.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
StockAdjustment.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });
StockAdjustment.hasMany(StockAdjustmentItem, { foreignKey: 'stock_adjustment_id', as: 'items' });
StockAdjustmentItem.belongsTo(StockAdjustment, { foreignKey: 'stock_adjustment_id' });
StockAdjustmentItem.belongsTo(Product, { foreignKey: 'product_id' });

// Warehouse Transfers
WarehouseTransfer.belongsTo(Warehouse, { foreignKey: 'from_warehouse_id', as: 'fromWarehouse' });
WarehouseTransfer.belongsTo(Warehouse, { foreignKey: 'to_warehouse_id', as: 'toWarehouse' });
WarehouseTransfer.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
WarehouseTransfer.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });
WarehouseTransfer.belongsTo(User, { foreignKey: 'shipped_by', as: 'shipper' });
WarehouseTransfer.belongsTo(User, { foreignKey: 'received_by', as: 'receiver' });
WarehouseTransfer.hasMany(WarehouseTransferItem, { foreignKey: 'warehouse_transfer_id', as: 'items' });
WarehouseTransferItem.belongsTo(WarehouseTransfer, { foreignKey: 'warehouse_transfer_id' });
WarehouseTransferItem.belongsTo(Product, { foreignKey: 'product_id' });

// =====================================================
// SALES & INVOICING
// =====================================================
SalesOrder.belongsTo(Customer, { foreignKey: 'customer_id' });
SalesOrder.belongsTo(Warehouse, { foreignKey: 'warehouse_id' });
SalesOrder.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Customer.hasMany(SalesOrder, { foreignKey: 'customer_id' });

SalesOrder.hasMany(SalesOrderItem, { foreignKey: 'sales_order_id', as: 'items' });
SalesOrderItem.belongsTo(SalesOrder, { foreignKey: 'sales_order_id' });
SalesOrderItem.belongsTo(Product, { foreignKey: 'product_id' });

Invoice.belongsTo(SalesOrder, { foreignKey: 'sales_order_id' });
Invoice.belongsTo(Customer, { foreignKey: 'customer_id' });
Invoice.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
SalesOrder.hasMany(Invoice, { foreignKey: 'sales_order_id' });
Customer.hasMany(Invoice, { foreignKey: 'customer_id' });

Invoice.hasMany(InvoiceItem, { foreignKey: 'invoice_id', as: 'items' });
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoice_id' });
InvoiceItem.belongsTo(Product, { foreignKey: 'product_id' });
InvoiceItem.belongsTo(SalesOrderItem, { foreignKey: 'sales_order_item_id' });

// =====================================================
// PURCHASE
// =====================================================
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplier_id' });
PurchaseOrder.belongsTo(Warehouse, { foreignKey: 'warehouse_id' });
PurchaseOrder.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
PurchaseOrder.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });
Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplier_id' });

PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'purchase_order_id', as: 'items' });
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'purchase_order_id' });
PurchaseOrderItem.belongsTo(Product, { foreignKey: 'product_id' });

GRN.belongsTo(PurchaseOrder, { foreignKey: 'purchase_order_id' });
GRN.belongsTo(Supplier, { foreignKey: 'supplier_id' });
GRN.belongsTo(Warehouse, { foreignKey: 'warehouse_id' });
GRN.belongsTo(User, { foreignKey: 'received_by', as: 'receiver' });
GRN.belongsTo(User, { foreignKey: 'verified_by', as: 'verifier' });
PurchaseOrder.hasMany(GRN, { foreignKey: 'purchase_order_id' });

GRN.hasMany(GRNItem, { foreignKey: 'grn_id', as: 'items' });
GRNItem.belongsTo(GRN, { foreignKey: 'grn_id' });
GRNItem.belongsTo(Product, { foreignKey: 'product_id' });
GRNItem.belongsTo(PurchaseOrderItem, { foreignKey: 'purchase_order_item_id' });

// =====================================================
// PAYMENTS
// =====================================================
CustomerPayment.belongsTo(Customer, { foreignKey: 'customer_id' });
CustomerPayment.belongsTo(PaymentMethod, { foreignKey: 'payment_method_id' });
CustomerPayment.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Customer.hasMany(CustomerPayment, { foreignKey: 'customer_id' });

SupplierPayment.belongsTo(Supplier, { foreignKey: 'supplier_id' });
SupplierPayment.belongsTo(PaymentMethod, { foreignKey: 'payment_method_id' });
SupplierPayment.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Supplier.hasMany(SupplierPayment, { foreignKey: 'supplier_id' });

// =====================================================
// DISPATCH & SHIPPING
// =====================================================
Dispatch.belongsTo(SalesOrder, { foreignKey: 'sales_order_id' });
Dispatch.belongsTo(Warehouse, { foreignKey: 'warehouse_id' });
Dispatch.belongsTo(ShippingCarrier, { foreignKey: 'carrier_id' });
Dispatch.belongsTo(User, { foreignKey: 'packed_by', as: 'packer' });
Dispatch.belongsTo(User, { foreignKey: 'shipped_by', as: 'shipper' });
SalesOrder.hasMany(Dispatch, { foreignKey: 'sales_order_id' });

Dispatch.hasMany(DispatchItem, { foreignKey: 'dispatch_id', as: 'items' });
DispatchItem.belongsTo(Dispatch, { foreignKey: 'dispatch_id' });
DispatchItem.belongsTo(Product, { foreignKey: 'product_id' });
DispatchItem.belongsTo(SalesOrderItem, { foreignKey: 'sales_order_item_id' });

Dispatch.hasMany(TrackingUpdate, { foreignKey: 'dispatch_id', as: 'trackingUpdates' });
TrackingUpdate.belongsTo(Dispatch, { foreignKey: 'dispatch_id' });

// =====================================================
// RETURNS & RMA
// =====================================================
ReturnRequest.belongsTo(SalesOrder, { foreignKey: 'sales_order_id' });
ReturnRequest.belongsTo(Customer, { foreignKey: 'customer_id' });
ReturnRequest.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });
ReturnRequest.belongsTo(User, { foreignKey: 'received_by', as: 'receiver' });
ReturnRequest.belongsTo(User, { foreignKey: 'inspected_by', as: 'inspector' });
SalesOrder.hasMany(ReturnRequest, { foreignKey: 'sales_order_id' });
Customer.hasMany(ReturnRequest, { foreignKey: 'customer_id' });

ReturnRequest.hasMany(ReturnItem, { foreignKey: 'return_request_id', as: 'items' });
ReturnItem.belongsTo(ReturnRequest, { foreignKey: 'return_request_id' });
ReturnItem.belongsTo(Product, { foreignKey: 'product_id' });
ReturnItem.belongsTo(SalesOrderItem, { foreignKey: 'sales_order_item_id' });

// =====================================================
// BARCODES
// =====================================================
Barcode.belongsTo(Product, { foreignKey: 'product_id' });
Product.hasMany(Barcode, { foreignKey: 'product_id' });

BarcodeScan.belongsTo(Barcode, { foreignKey: 'barcode_id' });
BarcodeScan.belongsTo(Product, { foreignKey: 'product_id' });
BarcodeScan.belongsTo(Warehouse, { foreignKey: 'warehouse_id' });
BarcodeScan.belongsTo(User, { foreignKey: 'scanned_by', as: 'scanner' });

// =====================================================
// NOTIFICATIONS
// =====================================================
NotificationLog.belongsTo(NotificationTemplate, { foreignKey: 'template_id' });
NotificationLog.belongsTo(User, { foreignKey: 'user_id' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });

// =====================================================
// AUDIT
// =====================================================
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// =====================================================
// Sync database (in development only)
// =====================================================
const syncDatabase = async () => {
  if (process.env.NODE_ENV === 'development') {
    try {
      await sequelize.sync({ alter: false });
      console.log('✓ Database models synchronized');
    } catch (error) {
      console.error('✗ Database sync error:', error.message);
    }
  }
};

syncDatabase();

module.exports = {
  sequelize,
  User,
  Role,
  Permission,
  Country,
  State,
  TaxRate,
  Customer,
  Supplier,
  Category,
  Brand,
  Unit,
  Product,
  Attribute,
  AttributeValue,
  ProductAttribute,
  ProductImage,
  Warehouse,
  Inventory,
  InventoryTransaction,
  StockAdjustment,
  StockAdjustmentItem,
  WarehouseTransfer,
  WarehouseTransferItem,
  SalesOrder,
  SalesOrderItem,
  Invoice,
  InvoiceItem,
  PurchaseOrder,
  PurchaseOrderItem,
  GRN,
  GRNItem,
  CustomerPayment,
  SupplierPayment,
  PaymentMethod,
  ShippingCarrier,
  Dispatch,
  DispatchItem,
  TrackingUpdate,
  ReturnRequest,
  ReturnItem,
  Return: ReturnRequest,
  Barcode,
  BarcodeScan,
  NotificationTemplate,
  NotificationLog,
  Notification,
  AuditLog
};
