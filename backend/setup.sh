#!/bin/bash

# CareerNavigator Backend Setup Script

echo "🚀 Setting up CareerNavigator Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v16.0.0 or higher)"
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="16.0.0"

if ! npx semver-compare $NODE_VERSION $REQUIRED_VERSION &> /dev/null; then
    echo "❌ Node.js version $REQUIRED_VERSION or higher is required. Current version: $NODE_VERSION"
    exit 1
fi

echo "✅ Node.js version: $NODE_VERSION"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Install Sequelize CLI globally
echo "🔧 Installing Sequelize CLI..."
npm install -g sequelize-cli

# Setup environment file
if [ ! -f .env ]; then
    echo "⚙️ Creating environment file..."
    cp .env.template .env
    echo "✏️ Please edit .env file with your configuration"
else
    echo "✅ Environment file already exists"
fi

# Create database if it doesn't exist
echo "🗄️ Setting up database..."
DB_NAME="careernavigator"

# Try to create database
psql -U postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database may already exist"

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Run 'npm run migrate' to set up database tables"
echo "3. Run 'npm run seed' to add initial data"
echo "4. Run 'npm run dev' to start the development server"
echo ""
echo "🌐 Server will be available at http://localhost:3001"
echo "📚 API documentation: http://localhost:3001/api/health"
