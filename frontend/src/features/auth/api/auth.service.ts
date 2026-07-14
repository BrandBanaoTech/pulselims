import { api } from "@/lib/axios";
// import { LoginFormValues } from "../schemas/login.schema";


// 1. DTO (Data Transfer Object) matching your FastAPI `SendRegistrationOTP`
export interface SendOtpPayload {
  email: string;
  mobile: string;
}

// 2. Response matching your FastAPI `OTPResponse`
export interface OtpResponse {
  message: string;
  mobile_verification_token: string;
  email_verification_token: string;
  expires_in_minutes: number;
}

// 3. DTO matching your FastAPI `OwnerRegisterRequest`
export interface RegisterOwnerPayload {
  email: string;
  full_name: string;
  mobile: string;
  password: string;
  mobile_otp: string;
  email_otp: string;
  mobile_verification_token: string;
  email_verification_token: string;
}

// 4. Response matching your FastAPI `Token` schema
export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    mobile: string;
    is_active: boolean;
    is_verified: boolean;
    is_platform_admin: boolean;
    created_at: string;
  };
}


export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    // ... other user fields based on your FastAPI UserResponse
  };
}

// 5. The Service Abstraction
export const authService = {

 // 1. Request OTP
  requestLoginOtp: async (data: { mobile: string }) => {
    const response = await api.post("/auth/request-login-otp", data); // Ensure this path matches your endpoint
    return response.data; 
  },

  // 2. Verify OTP & Login
  verifyLoginOtp: async (data: { mobile: string; mobile_otp: string; mobile_verification_token: string }) => {
    const response = await api.post("/auth/login", data); // Ensure this path matches your endpoint
    return response.data;
  },
  
  // Triggers the generation of OTPs and returns stateless verification tokens.
  requestRegistrationOtps: async (data: SendOtpPayload): Promise<OtpResponse> => {
    // Note: Adjust the URL path if your FastAPI endpoint routing differs
    const response = await api.post<OtpResponse>('/auth/request-otp', data);
    return response.data;
  },

  // Submits the user data alongside the OTPs and state tokens for final registration.
  registerOwner: async (data: RegisterOwnerPayload): Promise<AuthTokenResponse> => {
    const response = await api.post<AuthTokenResponse>('/auth/register', data);
    return response.data;
  },

  // login: async (credentials: LoginFormValues): Promise<LoginResponse> => {
  //   // Note: FastAPI typically expects OAuth2 Password Request Form (x-www-form-urlencoded) for login
  //   // If your backend expects JSON, keep it as api.post('/auth/login', credentials)
  //   // If it expects form data (Standard FastAPI OAuth2PasswordBearer), do this:
    
  //   const formData = new URLSearchParams();
  //   formData.append('username', credentials.email); // FastAPI OAuth2 uses 'username'
  //   formData.append('password', credentials.password);

  //   const response = await api.post<LoginResponse>('/auth/login', formData, {
  //     headers: {
  //       'Content-Type': 'application/x-www-form-urlencoded'
  //     }
  //   });
  //   return response.data;
  // },

  /**
   * Hits the /auth/refresh endpoint.
   * Because of our global Axios interceptor, the current Bearer token 
   * is automatically sent. The backend validates it and returns a new 
   * token with freshly compiled lab_permissions.
   */
  refreshToken: async (): Promise<AuthTokenResponse> => {
    // We send an empty POST request. The interceptor handles the Auth header.
    const response = await api.post<AuthTokenResponse>('/auth/refresh');
    return response.data;
  },
  verifySession: async () => {
    const response = await api.get("/users/me");
    return response.data;
  }
};