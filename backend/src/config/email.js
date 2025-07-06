const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailConfig {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.setupTransporter();
  }

  setupTransporter() {
    try {
      // Checking for the presence of email credentials in environment variables.
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        logger.warn('Email credentials not provided - email service disabled');
        this.transporter = null;
        this.initialized = false;
        return;
      }

      // Creating the Nodemailer transporter with the configured credentials.
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
      
      // Verifying the SMTP connection to ensure the credentials and server settings are correct.
      this.verifyConnection();
    } catch (error) {
      logger.error('Email transporter setup failed:', error);
      this.transporter = null;
      this.initialized = false;
    }
  }

  async verifyConnection() {
    if (!this.transporter) {
      logger.warn('Cannot verify email connection - transporter is null');
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('Email service connected successfully to Gmail!');
      return true;
    } catch (error) {
      logger.error('Email service connection failed:', error.message);
      return false;
    }
  }

  getTransporter() {
    return this.transporter;
  }

  isConfigured() {
    // A method to check if the email service is properly configured.
    const hasCredentials = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    
    // Returns true if credentials are provided, indicating the transporter should be available.
    return hasCredentials;
  }
}

// Creating and exporting a singleton instance of the EmailConfig class.
const emailConfigInstance = new EmailConfig();

module.exports = emailConfigInstance;