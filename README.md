# Nani Trading Dashboard 📈

A modern, AI-powered trading dashboard for Indian stock market (NSE/BSE) traders. Track intraday trades, manage long-term portfolios, and get AI-driven insights on your trading performance.

## ✨ Features

- **📊 Comprehensive Dashboard**: View total P&L, win rate, profit factor, best/worst trades at a glance
- **💹 Intraday Trading Log**: Record daily trades with entry/exit prices, P&L tracking, and setup adherence
- **💼 Portfolio Management**: Track long-term holdings with auto-updated prices from NSE/BSE
- **🤖 AI-Powered Insights**: Get GPT-4o-mini analysis of your trading patterns and mistakes
- **📈 Beautiful Visualizations**: Charts for P&L curves, win/loss ratios, monthly performance
- **📁 Import/Export Data**: 
  - **Import CSV**: Bulk import trades and portfolio from CSV files with validation
  - **Export CSV**: Download trades and portfolio as CSV with proper formatting
  - **Export Excel**: Download as Excel with formatting (coming soon)
- **🔐 Secure Authentication**: Gmail OAuth integration via NextAuth.js
- **🌙 Dark Mode**: Modern UI with shadcn/ui components and dark theme
- **₹ Indian Rupee Formatting**: All currency displayed in INR with proper formatting

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Recharts for visualizations
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Docker for local development, Azure-ready for production)
- **Authentication**: NextAuth.js with Google OAuth
- **Stock Data**: Finnhub API (free tier) for NSE/BSE prices
- **AI**: OpenAI GPT-4o-mini for trading insights
- **Import/Export**: PapaParse (CSV parsing and export), ExcelJS (Excel export)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker Desktop (for local PostgreSQL)
- Google OAuth credentials
- Finnhub API key (free tier)
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sureshpatta86/nani-trading-dashboard.git
   cd nani-trading-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

   Required environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://trading_user:trading_password@localhost:5432/nani_trading?schema=public"

   # NextAuth.js
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"  # Generate with: openssl rand -base64 32

   # Google OAuth (Get from https://console.cloud.google.com)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"

   # Finnhub API (Get from https://finnhub.io)
   FINNHUB_API_KEY="your-finnhub-api-key"

   # OpenAI API (Get from https://platform.openai.com)
   OPENAI_API_KEY="your-openai-api-key"
   ```

4. **Start Docker PostgreSQL database**
   ```bash
   docker compose up -d
   ```

5. **Run database migrations**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

7. **Open in browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### Setting Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env`

### Getting API Keys

- **Finnhub**: Sign up at [finnhub.io](https://finnhub.io) for free tier (60 calls/min)
- **OpenAI**: Create account at [platform.openai.com](https://platform.openai.com) and generate API key

### Logging Intraday Trades

1. Navigate to "Intraday Log" page
2. Fill in trade details:
   - Date, Day, Stock name (e.g., RELIANCE, TCS)
   - Buy/Sell, Quantity
   - Entry and Exit prices
   - P&L is calculated automatically
   - Mark if you followed your setup
   - Add remarks/notes
3. Click "Add Trade"

**Bulk Import via CSV:**
1. Click "Import CSV" button
2. Upload a CSV file with columns: Date, Script, Type, Quantity, Buy Price, Sell Price, Charges, Remarks, Follow Setup
3. Preview your data and click "Import"
4. See sample file: `sample-intraday-trades.csv`
5. Read the full guide: [CSV Import Guide](CSV_IMPORT_GUIDE.md)

### Managing Portfolio

1. Go to "Portfolio" page
2. Add stock with:
   - Stock name (e.g., INFY, HDFCBANK)
   - Average purchase price
   - Quantity
3. Prices update automatically from Finnhub
4. View unrealized P&L in rupees and percentage

**Bulk Import via CSV:**
1. Click "Import CSV" button
2. Upload a CSV file with columns: Symbol, Name, Quantity, Buy Price, Purchase Date
3. Preview your data and click "Import"
4. See sample file: `sample-portfolio.csv`
5. Read the full guide: [CSV Import Guide](CSV_IMPORT_GUIDE.md)

### Viewing AI Insights

The dashboard analyzes your trades and provides:
- Common mistakes (breaking setups, overleveraging)
- Emotional trading patterns
- Best performing stocks
- Risk management feedback
- Actionable recommendations

## 📁 Project Structure

```
nani-trading-dashboard/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/    # NextAuth.js routes
│   │   │   ├── intraday/              # Intraday trades API
│   │   │   ├── portfolio/             # Portfolio API
│   │   │   ├── ai/insights/           # AI insights API
│   │   │   └── export/                # CSV/Excel export
│   │   ├── auth/signin/               # Login page
│   │   ├── intraday/                  # Intraday logging page
│   │   ├── portfolio/                 # Portfolio management
│   │   ├── page.tsx                   # Dashboard (home)
│   │   └── layout.tsx                 # Root layout
│   ├── components/
│   │   ├── ui/                        # shadcn/ui components
│   │   └── theme-provider.tsx
│   ├── lib/
│   │   ├── auth.ts                    # NextAuth config
│   │   ├── prisma.ts                  # Prisma client
│   │   ├── stock-api.ts               # Finnhub integration
│   │   └── utils.ts                   # Helper functions
│   └── types/                         # TypeScript types
├── prisma/
│   └── schema.prisma                  # Database schema
├── docker-compose.yml                 # PostgreSQL setup
└── package.json
```

## 🚢 Deployment

### Azure Deployment (Coming Soon)

The app is designed to be easily deployed to Azure:
- Azure App Service for Next.js app
- Azure Database for PostgreSQL
- Configuration steps will be added

### Database Migration to Cloud

To migrate from local Docker to Azure PostgreSQL:
1. Update `DATABASE_URL` in `.env` with Azure connection string
2. Run migrations: `npx prisma migrate deploy`
3. No code changes needed!

## 💰 Cost Estimates

### Development (Free Tier)
- ✅ Next.js hosting: Free on Vercel
- ✅ PostgreSQL: Free (Docker locally)
- ✅ Finnhub API: Free (60 calls/min)
- ✅ Google OAuth: Free
- 💵 OpenAI GPT-4o-mini: ~$15-30/month with optimizations

### Production (Azure)
- Azure App Service: ~$50-100/month
- Azure PostgreSQL: ~$30-80/month
- APIs: Same as development

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com) for beautiful components
- [Finnhub](https://finnhub.io) for stock market data
- [OpenAI](https://openai.com) for AI insights
- [Next.js](https://nextjs.org) team for the amazing framework

## 📞 Support

For issues or questions, please open an issue on GitHub or contact the maintainer.

---

Built with ❤️ for Indian stock market traders
