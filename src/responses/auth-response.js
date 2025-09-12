class AuthResponse {
  // Format successful signup response
  static formatSignupResponse(user, token) {
    return {
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    };
  }

  // Format error response
  static formatErrorResponse(message, errors = null) {
    const response = {
      success: false,
      message
    };

    if (errors) {
      response.errors = errors;
    }

    return response;
  }
}

export default AuthResponse;
