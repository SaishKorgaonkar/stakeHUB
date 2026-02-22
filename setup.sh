#!/bin/bash

# StakeHub Setup Script
# Automated setup for development environment

set -e

echo "🚀 StakeHub Setup Script"
echo "========================"
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm not found. Installing..."
    npm install -g pnpm
fi

if ! command -v forge &> /dev/null; then
    echo "⚠️  Foundry not found. Please install: https://getfoundry.sh"
    exit 1
fi

echo "✅ Prerequisites OK"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install
cd app && pnpm install && cd ..
cd indexer && pnpm install && cd ..
echo "✅ Dependencies installed"
echo ""

# Setup .env
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please fill in .env with your values"
    echo ""
fi

# Prisma setup
echo "🗄️  Setting up database..."
read -p "Have you created a PostgreSQL database? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma generate
    npx prisma migrate dev --name init
    echo "✅ Database setup complete"
else
    echo "⚠️  Please create a PostgreSQL database and update DATABASE_URL in .env"
    echo "   Then run: npx prisma migrate dev"
fi
echo ""

# Foundry setup
echo "🔨 Setting up contracts..."
cd contracts
forge install OpenZeppelin/openzeppelin-contracts OpenZeppelin/openzeppelin-contracts-upgradeable --no-commit
cd ..
echo "✅ Contract dependencies installed"
echo ""

echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Fill in .env with your API keys and addresses"
echo "2. Deploy contracts: cd contracts && forge script script/Deploy.s.sol --rpc-url \$MONAD_RPC_URL --broadcast"
echo "3. Start dev servers: pnpm dev"
echo ""
echo "Happy building! 🎉"
