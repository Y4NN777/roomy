const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailConfig {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    logger.info('🚀 EmailConfig constructor called');
    this.setupTransporter();
  }

  setupTransporter() {
    try {
      logger.info('📧 Setting up email transporter...');
      
      // Check if email credentials are provided
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        logger.warn('⚠️ Email credentials not provided - email service disabled');
        logger.warn('EMAIL_USER:', process.env.EMAIL_USER ? '✅ SET' : '❌ NOT SET');
        logger.warn('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ SET' : '❌ NOT SET');
        this.transporter = null;
        this.initialized = false;
        return;
      }

      logger.info('📧 Email credentials found, creating transporter...');
      logger.info('EMAIL_HOST:', process.env.EMAIL_HOST || 'smtp.gmail.com');
      logger.info('EMAIL_PORT:', process.env.EMAIL_PORT || '587');
      logger.info('EMAIL_USER:', process.env.EMAIL_USER);

      // Create transporter
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      this.initialized = true;
      logger.info('✅ Email transporter created successfully');
      
      // Verify connection
      this.verifyConnection();
    } catch (error) {
      logger.error('❌ Email transporter setup failed:', error);
      this.transporter = null;
      this.initialized = false;
    }
  }

  async verifyConnection() {
    if (!this.transporter) {
      logger.warn('⚠️ Cannot verify email connection - transporter is null');
      return false;
    }

    try {
      logger.info('🔍 Verifying email connection...');
      await this.transporter.verify();
      logger.info('✅ Email service connected successfully to Gmail!');
      return true;
    } catch (error) {
      logger.error('❌ Email service connection failed:', error.message);
      return false;
    }
  }

  getTransporter() {
    return this.transporter;
  }

  isConfigured() {
    // FIX: Check environment variables first, then transporter
    const hasCredentials = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    const hasTransporter = !!this.transporter;
    
    logger.debug('📧 Email configuration check:', {
      hasCredentials,
      hasTransporter,
      initialized: this.initialized
    });
    
    // Return true if we have credentials (transporter should exist)
    return hasCredentials;
  }
}

// Create and export instance
const emailConfigInstance = new EmailConfig();
logger.info('📧 Email config module loaded');

module.exports = emailConfigInstance;