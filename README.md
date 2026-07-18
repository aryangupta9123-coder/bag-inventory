# Bag Inventory Management System

A full-stack web application for managing bag store inventory, recording sales, and viewing analytics. Built with React, Node.js, Express, and MongoDB Atlas.

## Features

- **Authentication**: Secure login and registration system
- **Inventory Management**: Add, view, edit, and delete bag inventory
- **Sales Recording**: Record daily sales with customer information
- **Analytics Dashboard**: View sales trends, top products, and category breakdowns
- **Responsive Design**: Modern UI that works on desktop and mobile

## Tech Stack

### Frontend
- React 19
- React Router
- Axios
- TailwindCSS
- Recharts
- Lucide Icons

### Backend
- Node.js
- Express
- MongoDB (MongoDB Atlas)
- JWT Authentication
- bcryptjs

## Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account
- npm or yarn

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd bag-inventory
```

### 2. Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Edit the `.env` file with your MongoDB Atlas credentials:
```
MONGODB_URI=mongodb+srv://your_username:your_password@bag-inventory.mongodb.net/bag_inventory
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_random
PORT=5000
```

**Important**: Replace `your_username`, `your_password`, and `your_jwt_secret_key_here_make_it_long_and_random` with your actual MongoDB Atlas credentials and a secure JWT secret.

5. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

1. Navigate to the client directory:
```bash
cd ../client
```

2. Install dependencies:
```bash
npm install
```

3. The frontend `.env` file is already configured with:
```
VITE_API_URL=http://localhost:5000
```

4. Start the frontend development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### 4. MongoDB Atlas Setup

1. Log in to your MongoDB Atlas account
2. Create a new cluster named `bag-inventory` (or use your existing cluster)
3. Create a database named `bag_inventory`
4. Create a database user with read/write permissions
5. Get your connection string from the Atlas dashboard
6. Update the `MONGODB_URI` in `server/.env` with your connection string

**Note**: Make sure to whitelist your IP address in MongoDB Atlas Network Access settings or allow access from anywhere (0.0.0.0/0) for development.

## Usage

1. Open your browser and navigate to `http://localhost:5173`
2. Register a new account
3. Login with your credentials
4. Start managing your inventory!

### Application Sections

- **Dashboard**: Overview of sales, revenue, and low stock alerts
- **Inventory**: Manage your bag inventory (add, edit, delete items)
- **Sales**: Record new sales and view sales history
- **Analytics**: View detailed analytics with charts and reports

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Inventory
- `GET /api/inventory` - Get all inventory items
- `GET /api/inventory/:id` - Get single item
- `POST /api/inventory` - Create new item
- `PUT /api/inventory/:id` - Update item
- `DELETE /api/inventory/:id` - Delete item
- `PATCH /api/inventory/:id/quantity` - Update item quantity

### Sales
- `GET /api/sales` - Get all sales
- `GET /api/sales/:id` - Get single sale
- `POST /api/sales` - Create new sale
- `DELETE /api/sales/:id` - Delete sale (restores inventory)

### Analytics
- `GET /api/analytics/overview` - Get overview statistics
- `GET /api/analytics/sales-by-date` - Get sales by date
- `GET /api/analytics/top-products` - Get top selling products
- `GET /api/analytics/by-category` - Get sales by category
- `GET /api/analytics/low-stock` - Get low stock items

## Project Structure

```
bag-inventory/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── context/      # React context (Auth)
│   │   ├── pages/        # Page components
│   │   ├── utils/        # Utility functions (API, cn)
│   │   ├── App.jsx       # Main app with routing
│   │   └── main.jsx      # Entry point
│   ├── public/           # Static assets
│   └── package.json
└── server/               # Node.js backend
    ├── models/          # Mongoose models
    ├── routes/          # API routes
    ├── middleware/      # Custom middleware
    ├── index.js         # Server entry point
    └── package.json
```

## Development

### Running in Development Mode

**Backend** (in `server/` directory):
```bash
npm run dev
```

**Frontend** (in `client/` directory):
```bash
npm run dev
```

### Building for Production

**Frontend**:
```bash
npm run build
```

**Backend**:
```bash
npm start
```

## Troubleshooting

### MongoDB Connection Issues
- Ensure your MongoDB Atlas connection string is correct
- Check that your IP is whitelisted in Atlas Network Access
- Verify your database user has the correct permissions

### CORS Errors
- The backend is configured to allow CORS from all origins for development
- For production, update the CORS configuration in `server/index.js`

### Tailwind CSS Not Working
- Ensure you've installed the Tailwind CSS dependencies
- Check that `tailwind.config.js` and `postcss.config.js` are present
- Make sure the Tailwind directives are in `src/index.css`

## License

This project is licensed under the MIT License.

## Support

For issues or questions, please contact the development team.
