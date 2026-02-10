const { TaxRate, Country, State } = require('../models');
const { Op } = require('sequelize');

class TaxCalculator {
  /**
   * Calculate tax for order based on customer and warehouse location
   */
  static async calculateOrderTax(order) {
    const { customer, warehouse, items } = order;
    
    const customerCountry = await Country.findByPk(customer.billing_country_id);
    const warehouseCountry = await Country.findByPk(warehouse.country_id);
    
    if (!customerCountry || !warehouseCountry) {
      throw new Error('Country information not found');
    }

    // If different countries, no tax (international)
    if (customerCountry.id !== warehouseCountry.id) {
      return { taxAmount: 0, taxDetails: [] };
    }

    // GST System (India)
    if (customerCountry.tax_system === 'GST') {
      return this.calculateGST(items, customer, warehouse);
    }

    // Sales Tax System (USA)
    if (customerCountry.tax_system === 'SALES_TAX') {
      return this.calculateSalesTax(items, customer);
    }

    // VAT System
    if (customerCountry.tax_system === 'VAT') {
      return this.calculateVAT(items, customerCountry);
    }

    return { taxAmount: 0, taxDetails: [] };
  }

  /**
   * Calculate GST (India)
   */
  static async calculateGST(items, customer, warehouse) {
    const taxDetails = [];
    let totalTax = 0;

    // Check if intrastate or interstate
    const isIntrastate = customer.billing_state_id === warehouse.state_id;

    for (const item of items) {
      const taxableAmount = item.quantity * item.unit_price;
      const taxRate = item.tax_percent || 18; // Default 18% GST

      if (isIntrastate) {
        // CGST + SGST
        const cgstRate = taxRate / 2;
        const sgstRate = taxRate / 2;
        const cgstAmount = (taxableAmount * cgstRate) / 100;
        const sgstAmount = (taxableAmount * sgstRate) / 100;

        taxDetails.push({
          product_id: item.product_id,
          tax_type: 'CGST',
          rate: cgstRate,
          amount: cgstAmount
        });

        taxDetails.push({
          product_id: item.product_id,
          tax_type: 'SGST',
          rate: sgstRate,
          amount: sgstAmount
        });

        totalTax += cgstAmount + sgstAmount;
      } else {
        // IGST
        const igstAmount = (taxableAmount * taxRate) / 100;

        taxDetails.push({
          product_id: item.product_id,
          tax_type: 'IGST',
          rate: taxRate,
          amount: igstAmount
        });

        totalTax += igstAmount;
      }
    }

    return {
      taxAmount: parseFloat(totalTax.toFixed(2)),
      taxDetails
    };
  }

  /**
   * Calculate Sales Tax (USA)
   */
  static async calculateSalesTax(items, customer) {
    const taxDetails = [];
    let totalTax = 0;

    // Get tax rate for customer's state
    const taxRate = await TaxRate.findOne({
      where: {
        state_id: customer.billing_state_id,
        tax_type: 'SALES_TAX',
        is_active: true,
        effective_from: {
          [Op.lte]: new Date()
        },
        [Op.or]: [
          { effective_to: null },
          { effective_to: { [Op.gte]: new Date() } }
        ]
      }
    });

    if (!taxRate) {
      return { taxAmount: 0, taxDetails: [] };
    }

    for (const item of items) {
      const taxableAmount = item.quantity * item.unit_price;
      const taxAmount = (taxableAmount * taxRate.rate) / 100;

      taxDetails.push({
        product_id: item.product_id,
        tax_type: 'SALES_TAX',
        rate: taxRate.rate,
        amount: taxAmount
      });

      totalTax += taxAmount;
    }

    return {
      taxAmount: parseFloat(totalTax.toFixed(2)),
      taxDetails
    };
  }

  /**
   * Calculate VAT
   */
  static async calculateVAT(items, country) {
    const taxDetails = [];
    let totalTax = 0;

    // Get VAT rate for country
    const taxRate = await TaxRate.findOne({
      where: {
        country_id: country.id,
        tax_type: 'VAT',
        is_active: true,
        effective_from: {
          [Op.lte]: new Date()
        },
        [Op.or]: [
          { effective_to: null },
          { effective_to: { [Op.gte]: new Date() } }
        ]
      }
    });

    if (!taxRate) {
      return { taxAmount: 0, taxDetails: [] };
    }

    for (const item of items) {
      const taxableAmount = item.quantity * item.unit_price;
      const taxAmount = (taxableAmount * taxRate.rate) / 100;

      taxDetails.push({
        product_id: item.product_id,
        tax_type: 'VAT',
        rate: taxRate.rate,
        amount: taxAmount
      });

      totalTax += taxAmount;
    }

    return {
      taxAmount: parseFloat(totalTax.toFixed(2)),
      taxDetails
    };
  }

  /**
   * Calculate tax for a single amount
   */
  static calculateSimpleTax(amount, rate) {
    return parseFloat(((amount * rate) / 100).toFixed(2));
  }
}

module.exports = TaxCalculator;
