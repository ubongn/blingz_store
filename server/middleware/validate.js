const { body, param, query, validationResult } = require('express-validator');

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
}

const signupRules = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('full_name').optional().trim().isLength({ max: 255 }).withMessage('Name too long'),
  handleValidation,
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation,
];

const changePasswordRules = [
  body('current_password').notEmpty().withMessage('Current password is required'),
  body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  handleValidation,
];

const productRules = [
  body('name').notEmpty().withMessage('Product name is required').trim().isLength({ max: 255 }),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('description').optional().trim(),
  body('category').optional().trim().isLength({ max: 100 }),
  handleValidation,
];

const reviewRules = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 1000 }).withMessage('Comment too long'),
  handleValidation,
];

const checkoutRules = [
  body('full_name').notEmpty().withMessage('Full name is required').trim(),
  body('address').notEmpty().withMessage('Address is required').trim(),
  body('city').notEmpty().withMessage('City is required').trim(),
  body('phone').notEmpty().withMessage('Phone is required').trim(),
  handleValidation,
];

const couponRules = [
  body('code').notEmpty().withMessage('Coupon code is required').trim().isLength({ max: 20 }),
  body('discount_type').isIn(['percentage', 'fixed']).withMessage('Discount type must be percentage or fixed'),
  body('discount_value').isFloat({ min: 0.01 }).withMessage('Discount value must be positive'),
  body('min_order_amount').optional().isFloat({ min: 0 }),
  body('max_uses').optional().isInt({ min: 0 }),
  handleValidation,
];

module.exports = {
  signupRules,
  loginRules,
  changePasswordRules,
  productRules,
  reviewRules,
  checkoutRules,
  couponRules,
  handleValidation,
};
