#!/bin/bash

# ERP Backend Quick Start Script

echo "=================================="
echo "   ERP Backend Quick Start"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✓ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✓ npm version: $(npm -v)"

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "⚠️  MySQL command not found. Make sure MySQL is installed and running."
fi

echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✓ Dependencies installed successfully"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env and update your database credentials!"
    echo ""
    read -p "Press Enter after updating .env file..."
fi

echo "🗄️  Setting up database..."
echo ""

# Read database details from .env
source .env

# Check if database exists, create if not
echo "Checking if database exists..."
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "Creating database: $DB_NAME"
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    
    if [ $? -eq 0 ]; then
        echo "✓ Database created successfully"
    else
        echo "❌ Failed to create database. Please check your MySQL credentials in .env"
        exit 1
    fi
else
    echo "✓ Database already exists"
fi

echo ""
echo "🔄 Running migrations..."
npm run db:migrate

if [ $? -ne 0 ]; then
    echo "❌ Migration failed"
    exit 1
fi

echo "✓ Migrations completed"
echo ""

echo "🌱 Seeding database with initial data..."
npm run db:seed

if [ $? -ne 0 ]; then
    echo "❌ Seeding failed"
    exit 1
fi

echo "✓ Database seeded successfully"
echo ""

echo "=================================="
echo "   Setup Complete! 🎉"
echo "=================================="
echo ""
echo "Default Admin Credentials:"
echo "Email: admin@erp.com"
echo "Password: Admin@123"
echo ""
echo "To start the server:"
echo "  npm run dev    (development mode)"
echo "  npm start      (production mode)"
echo ""
echo "API will be available at: http://localhost:${PORT:-3000}/api/v1"
echo ""
echo "Quick test:"
echo "  curl http://localhost:${PORT:-3000}/health"
echo ""
echo "=================================="
