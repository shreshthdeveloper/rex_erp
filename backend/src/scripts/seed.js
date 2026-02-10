const { sequelize, Role, Permission, User, Country, State, TaxRate, PaymentMethod, Category, Warehouse, Product } = require('../models');

async function seedDatabase() {
  try {
    console.log('Starting database seed...');

    // Disable foreign key checks for clean drop
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Sync database (create tables, force: false keeps existing tables)
    await sequelize.sync({ force: false });
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // Seed Roles
    const roles = [
      { role_name: 'SUPER_ADMIN', description: 'Full system access' },
      { role_name: 'ADMIN', description: 'Administrative access' },
      { role_name: 'WAREHOUSE_MANAGER', description: 'Warehouse management' },
      { role_name: 'SALES_EXECUTIVE', description: 'Sales operations' },
      { role_name: 'CUSTOMER', description: 'Customer portal access' },
      { role_name: 'SUPPLIER', description: 'Supplier portal access' }
    ];

    for (const role of roles) {
      await Role.findOrCreate({
        where: { role_name: role.role_name },
        defaults: role
      });
    }
    console.log('✓ Roles seeded');

    // Seed Permissions
    const permissions = [
      'USER_VIEW', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE',
      'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'CUSTOMER_UPDATE', 'CUSTOMER_DELETE',
      'SUPPLIER_VIEW', 'SUPPLIER_CREATE', 'SUPPLIER_UPDATE', 'SUPPLIER_DELETE',
      'PRODUCT_VIEW', 'PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_DELETE',
      'CATEGORY_VIEW', 'CATEGORY_CREATE', 'CATEGORY_UPDATE', 'CATEGORY_DELETE',
      'WAREHOUSE_VIEW', 'WAREHOUSE_CREATE', 'WAREHOUSE_UPDATE', 'WAREHOUSE_DELETE',
      'ORDER_VIEW', 'ORDER_CREATE', 'ORDER_UPDATE', 'ORDER_DELETE',
      'INVENTORY_VIEW', 'INVENTORY_UPDATE',
      'INVOICE_VIEW', 'INVOICE_CREATE',
      'PAYMENT_VIEW', 'PAYMENT_CREATE',
      'REPORT_VIEW'
    ];

    for (const perm of permissions) {
      await Permission.findOrCreate({
        where: { permission_name: perm },
        defaults: { permission_name: perm, description: perm.replace('_', ' ') }
      });
    }
    console.log('✓ Permissions seeded');

    // Assign all permissions to SUPER_ADMIN
    const superAdmin = await Role.findOne({ where: { role_name: 'SUPER_ADMIN' } });
    const allPermissions = await Permission.findAll();
    await superAdmin.setPermissions(allPermissions);
    console.log('✓ Permissions assigned to SUPER_ADMIN');

    // Seed Countries
    const countries = [
      { code: 'IN', name: 'India', currency_code: 'INR', phone_code: '+91', tax_system: 'GST' },
      { code: 'US', name: 'United States', currency_code: 'USD', phone_code: '+1', tax_system: 'SALES_TAX' }
    ];

    for (const country of countries) {
      await Country.findOrCreate({
        where: { code: country.code },
        defaults: country
      });
    }
    console.log('✓ Countries seeded');

    // Seed States (India)
    const india = await Country.findOne({ where: { code: 'IN' } });
    const indiaStates = [
      { code: 'MH', name: 'Maharashtra' },
      { code: 'KA', name: 'Karnataka' },
      { code: 'TN', name: 'Tamil Nadu' },
      { code: 'DL', name: 'Delhi' }
    ];

    for (const state of indiaStates) {
      await State.findOrCreate({
        where: { country_id: india.id, code: state.code },
        defaults: { ...state, country_id: india.id }
      });
    }

    // Seed States (USA)
    const usa = await Country.findOne({ where: { code: 'US' } });
    const usaStates = [
      { code: 'CA', name: 'California' },
      { code: 'NY', name: 'New York' },
      { code: 'TX', name: 'Texas' },
      { code: 'FL', name: 'Florida' }
    ];

    for (const state of usaStates) {
      await State.findOrCreate({
        where: { country_id: usa.id, code: state.code },
        defaults: { ...state, country_id: usa.id }
      });
    }
    console.log('✓ States seeded');

    // Seed Tax Rates (India - GST)
    const maharashtra = await State.findOne({ where: { code: 'MH', country_id: india.id } });
    await TaxRate.findOrCreate({
      where: {
        country_id: india.id,
        state_id: maharashtra.id,
        tax_type: 'CGST'
      },
      defaults: {
        country_id: india.id,
        state_id: maharashtra.id,
        tax_type: 'CGST',
        tax_name: 'Central GST',
        rate: 9.00,
        is_active: true,
        effective_from: '2017-07-01'
      }
    });

    await TaxRate.findOrCreate({
      where: {
        country_id: india.id,
        state_id: maharashtra.id,
        tax_type: 'SGST'
      },
      defaults: {
        country_id: india.id,
        state_id: maharashtra.id,
        tax_type: 'SGST',
        tax_name: 'State GST',
        rate: 9.00,
        is_active: true,
        effective_from: '2017-07-01'
      }
    });

    // Seed Tax Rates (USA - Sales Tax)
    const california = await State.findOne({ where: { code: 'CA', country_id: usa.id } });
    await TaxRate.findOrCreate({
      where: {
        country_id: usa.id,
        state_id: california.id,
        tax_type: 'SALES_TAX'
      },
      defaults: {
        country_id: usa.id,
        state_id: california.id,
        tax_type: 'SALES_TAX',
        tax_name: 'California Sales Tax',
        rate: 7.25,
        is_active: true,
        effective_from: '2020-01-01'
      }
    });
    console.log('✓ Tax rates seeded');

    // Seed Payment Methods
    const paymentMethods = [
      { method_name: 'Cash', method_type: 'CASH' },
      { method_name: 'Credit Card', method_type: 'CARD' },
      { method_name: 'Debit Card', method_type: 'CARD' },
      { method_name: 'UPI', method_type: 'UPI' },
      { method_name: 'Bank Transfer', method_type: 'BANK_TRANSFER' },
      { method_name: 'Cheque', method_type: 'CHEQUE' }
    ];

    for (const method of paymentMethods) {
      await PaymentMethod.findOrCreate({
        where: { method_name: method.method_name },
        defaults: method
      });
    }
    console.log('✓ Payment methods seeded');

    // Seed Categories
    const categories = [
      { category_name: 'Electronics', slug: 'electronics', description: 'Electronic devices and accessories', is_active: true },
      { category_name: 'Clothing', slug: 'clothing', description: 'Apparel and fashion items', is_active: true },
      { category_name: 'Home & Garden', slug: 'home-garden', description: 'Home improvement and garden supplies', is_active: true },
      { category_name: 'Books', slug: 'books', description: 'Books and publications', is_active: true },
      { category_name: 'Sports & Outdoors', slug: 'sports-outdoors', description: 'Sports equipment and outdoor gear', is_active: true }
    ];

    for (const category of categories) {
      await Category.findOrCreate({
        where: { slug: category.slug },
        defaults: category
      });
    }
    console.log('✓ Categories seeded');

    // Seed Warehouses
    const maharashtraState = await State.findOne({ where: { name: 'Maharashtra' } });
    const delhiState = await State.findOne({ where: { name: 'Delhi' } });

    const warehouses = [
      {
        warehouse_code: 'WH001',
        warehouse_name: 'Main Warehouse',
        address_line1: '123 Industrial Road',
        city: 'Mumbai',
        state_id: maharashtraState.id,
        country_id: india.id,
        postal_code: '400001',
        phone: '+91-9876543210',
        email: 'warehouse@main.com',
        is_active: true
      },
      {
        warehouse_code: 'WH002',
        warehouse_name: 'Secondary Warehouse',
        address_line1: '456 Commerce Street',
        city: 'Delhi',
        state_id: delhiState.id,
        country_id: india.id,
        postal_code: '110001',
        phone: '+91-9876543211',
        email: 'warehouse@secondary.com',
        is_active: true
      }
    ];

    for (const warehouse of warehouses) {
      await Warehouse.findOrCreate({
        where: { warehouse_code: warehouse.warehouse_code },
        defaults: warehouse
      });
    }
    console.log('✓ Warehouses seeded');

    // Seed Products
    const electronicsCategory = await Category.findOne({ where: { slug: 'electronics' } });
    const clothingCategory = await Category.findOne({ where: { slug: 'clothing' } });

    const products = [
      {
        sku: 'ELE001',
        product_name: 'Wireless Headphones',
        slug: 'wireless-headphones',
        category_id: electronicsCategory.id,
        parent_product_id: null,
        cost_price: 50.00,
        selling_price: 100.00,
        description: 'High-quality wireless headphones with noise cancellation',
        is_active: true
      },
      {
        sku: 'ELE002',
        product_name: 'Smartphone Case',
        slug: 'smartphone-case',
        category_id: electronicsCategory.id,
        parent_product_id: null,
        cost_price: 5.00,
        selling_price: 15.00,
        description: 'Protective case for smartphones',
        is_active: true
      },
      {
        sku: 'CLO001',
        product_name: 'Cotton T-Shirt',
        slug: 'cotton-t-shirt',
        category_id: clothingCategory.id,
        parent_product_id: null,
        cost_price: 8.00,
        selling_price: 25.00,
        description: 'Comfortable cotton t-shirt',
        is_active: true
      }
    ];

    for (const product of products) {
      await Product.findOrCreate({
        where: { sku: product.sku },
        defaults: product
      });
    }
    console.log('✓ Products seeded');

    // Create default admin user
    const adminPassword = await User.hashPassword('Admin@123');
    const [adminUser, created] = await User.findOrCreate({
      where: { email: 'admin@erp.com' },
      defaults: {
        email: 'admin@erp.com',
        password_hash: adminPassword,
        first_name: 'System',
        last_name: 'Administrator',
        phone: '+1234567890',
        is_active: true
      }
    });

    if (created) {
      await adminUser.addRole(superAdmin);
      console.log('✓ Admin user created (email: admin@erp.com, password: Admin@123)');
    } else {
      console.log('✓ Admin user already exists');
    }

    console.log('\n=================================');
    console.log('✓ Database seeded successfully!');
    console.log('=================================');
    console.log('\nDefault Admin Credentials:');
    console.log('Email: admin@erp.com');
    console.log('Password: Admin@123');
    console.log('=================================\n');

    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
