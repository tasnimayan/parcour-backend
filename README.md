On first run of the project
run `npx prisma generate`

# API Endpoints:

## Authentication

```
POST /api/v1/auth/signup/customer
POST /api/v1/auth/signup/agent
POST /api/v1/auth/signup/admin
POST /api/v1/auth/login

```

Role-Specific Signup Routes:
/auth/signup/customer - Customer registration with personal details
/auth/signup/agent - Delivery agent registration with vehicle/employment info
/auth/signup/admin - Admin registration with department and permissions
/auth/logout (protected) - Logout
/auth/profile (protected) - Get profile

Universal Login:
/auth/login - Returns role-specific profile data based on user type

## Admin

```
POST /api/v1/admin/assign/agent
GET /api/v1/admin/agents
GET /api/v1/admin/users
```
