import bcrypt from 'bcryptjs';

class PasswordUtils {
  // Hash password with salt
  static async hashPassword(password) {
    try {
      const salt = await bcrypt.genSalt(12);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw new Error('Failed to hash password');
    }
  }

  // Compare password with hash
  static async comparePassword(candidatePassword, hashedPassword) {
    try {
      return await bcrypt.compare(candidatePassword, hashedPassword);
    } catch (error) {
      throw new Error('Failed to compare password');
    }
  }

  // Validate password strength (moved from Joi for reusability)
  static validatePasswordStrength(password) {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);

    if (password.length < minLength) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }

    if (!hasUppercase) {
      return { isValid: false, message: 'Password must contain at least 1 uppercase letter' };
    }

    if (!hasLowercase) {
      return { isValid: false, message: 'Password must contain at least 1 lowercase letter' };
    }

    if (!hasNumber) {
      return { isValid: false, message: 'Password must contain at least 1 number' };
    }

    if (!hasSpecialChar) {
      return { isValid: false, message: 'Password must contain at least 1 special character (@$!%*?&)' };
    }

    return { isValid: true, message: 'Password is strong' };
  }
}

export default PasswordUtils;