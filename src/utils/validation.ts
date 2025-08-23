import { body, param, query } from 'express-validator';

export const commonValidation = {
  // ID validation
  id: param('id').isString().notEmpty().withMessage('Valid ID is required'),

  // Pagination validation
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isString().notEmpty(),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  ],

  // Email validation
  email: body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),

  // Phone validation
  phone: body('phone').optional().isMobilePhone('any').withMessage('Valid phone number is required'),

  // Password validation
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
};