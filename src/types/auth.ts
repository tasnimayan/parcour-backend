import { Gender } from "@prisma/client";

// Common address type
export interface Address {
  label: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

// Common base for all signup types
export interface SignupBase {
  email: string;
  password: string;
  fullName: string;
}

// Details shared by Customer and Agent
export interface PersonDetails {
  phone: string;
  altPhone?: string;
  governmentId?: string;
  dob?: Date | string;
  gender?: Gender;
}

export interface CustomerSignup extends SignupBase, PersonDetails {
  address: Address;
}

export interface AgentSignup extends SignupBase, PersonDetails {
  vehicleType?: string;
  vehicleNumber?: string;
  licenseNo?: string;
  employmentType?: string;
}

export interface AdminSignup extends SignupBase {
  department?: string;
}
