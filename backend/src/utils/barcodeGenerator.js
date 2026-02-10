const bwipjs = require('bwip-js');
const { Barcode } = require('../models');

class BarcodeGenerator {
  /**
   * Generate barcode for a product
   */
  static async generateBarcode(product, type = 'CODE128') {
    try {
      // Generate unique barcode number
      const barcodeValue = await this.generateUniqueCode(product);

      // Generate barcode image
      const buffer = await bwipjs.toBuffer({
        bcid: type.toLowerCase(),
        text: barcodeValue,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center'
      });

      // Save barcode to database
      const barcode = await Barcode.create({
        barcode: barcodeValue,
        barcode_type: type,
        product_id: product.id
      });

      return {
        barcode: barcodeValue,
        image: buffer,
        record: barcode
      };
    } catch (error) {
      console.error('Barcode generation error:', error);
      throw error;
    }
  }

  /**
   * Generate unique barcode value
   */
  static async generateUniqueCode(product) {
    // Use product SKU + random number
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const code = `${product.sku}${timestamp}${random}`;

    // Check if code already exists
    const exists = await Barcode.findOne({ where: { barcode: code } });
    
    if (exists) {
      // Recursively generate new code
      return this.generateUniqueCode(product);
    }

    return code;
  }

  /**
   * Generate QR code for product
   */
  static async generateQRCode(product, data = null) {
    try {
      const qrData = data || JSON.stringify({
        productId: product.id,
        sku: product.sku,
        name: product.product_name
      });

      const buffer = await bwipjs.toBuffer({
        bcid: 'qrcode',
        text: qrData,
        scale: 3,
        height: 10,
        width: 10
      });

      return buffer;
    } catch (error) {
      console.error('QR code generation error:', error);
      throw error;
    }
  }

  /**
   * Validate barcode format
   */
  static validateBarcode(barcode, type = 'CODE128') {
    const patterns = {
      CODE128: /^[\x00-\x7F]+$/,
      EAN13: /^\d{13}$/,
      UPC: /^\d{12}$/,
      QR: /.+/
    };

    return patterns[type]?.test(barcode) || false;
  }

  /**
   * Lookup product by barcode
   */
  static async lookupProduct(barcodeValue) {
    return await Barcode.findOne({
      where: { barcode: barcodeValue },
      include: ['Product']
    });
  }

  /**
   * Bulk generate barcodes for multiple products
   */
  static async bulkGenerate(products, type = 'CODE128') {
    const results = [];

    for (const product of products) {
      try {
        const barcode = await this.generateBarcode(product, type);
        results.push({
          success: true,
          productId: product.id,
          barcode: barcode.barcode
        });
      } catch (error) {
        results.push({
          success: false,
          productId: product.id,
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = BarcodeGenerator;
