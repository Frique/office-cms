const { body, param, validationResult } = require('express-validator');

const officeValidators = [
  body('name')
    .trim()
    .notEmpty().withMessage('Office name is required')
    .isLength({ max: 200 }).withMessage('Name must be under 200 characters'),
  body('location')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 200 }).withMessage('Location must be under 200 characters'),
  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 2000 }).withMessage('Description must be under 2000 characters'),
  body('contact_email')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail().withMessage('Invalid email address'),
  body('contact_phone')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 50 }).withMessage('Phone must be under 50 characters'),
  body('contact_address')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Address must be under 500 characters'),
];

const loginValidators = [
  body('email').trim().isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

module.exports = { officeValidators, loginValidators, handleValidationErrors };
