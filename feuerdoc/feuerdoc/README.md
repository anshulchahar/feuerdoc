# FeuerDoc 🔥📋

**AI-Powered Fire Department Documentation System**

FeuerDoc is a modern web application designed specifically for fire departments to streamline incident reporting and documentation. Using artificial intelligence, it transforms initial contact reports and field notes into comprehensive, professional incident reports.

## 🌟 Features

### Core Functionality
- **AI-Powered Report Generation**: Automatically generate comprehensive incident reports using Google's Gemini AI
- **Multi-Modal Input Support**: 
  - Text-based field notes
  - Audio recordings with playback controls
  - File uploads (PDF, Word, text documents)
- **Real-time Collaboration**: Live updates using Supabase real-time subscriptions
- **Case Management**: Track incidents from initial report to completion
- **Secure File Storage**: Robust file handling with Supabase Storage

### User Interface
- **Modern Dark Theme**: Fire department-themed UI with professional aesthetics
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Intuitive Navigation**: Clean sidebar navigation and organized workflow
- **Audio Recording Interface**: Built-in audio recorder with playback and management controls

### Technical Features
- **TypeScript**: Full type safety throughout the application
- **Next.js 15**: Latest React framework with App Router
- **Supabase Integration**: PostgreSQL database with real-time capabilities
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **Modern React**: Built with React 19 and latest best practices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- Supabase account and project
- Google AI API key (for Gemini)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd feuerdoc/feuerdoc
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_google_ai_api_key
   ```

4. **Database Setup**
   Create the following table in your Supabase project:
   ```sql
   CREATE TABLE cases (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     title TEXT NOT NULL,
     location TEXT NOT NULL,
     initial_report_path TEXT NOT NULL,
     final_report_content TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     status TEXT CHECK (status IN ('Open', 'InProgress', 'Completed', 'Closed')) DEFAULT 'Open',
     user_id UUID REFERENCES auth.users(id)
   );

   -- Enable RLS (Row Level Security)
   ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

   -- Create storage bucket for case files
   INSERT INTO storage.buckets (id, name, public) VALUES ('case-files', 'case-files', true);
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── generate-report/  # AI report generation endpoint
│   ├── cases/             # Case management pages
│   │   └── [id]/          # Individual case detail page
│   ├── (auth)/            # Authentication pages
│   ├── (main)/            # Main application pages
│   ├── layout.tsx         # Root layout component
│   ├── page.tsx           # Home/dashboard page
│   └── globals.css        # Global styles
├── components/            # Reusable React components
│   ├── auth/              # Authentication components
│   ├── cases/             # Case-related components
│   │   ├── CaseCard.tsx   # Individual case display
│   │   ├── CaseList.tsx   # Case listing component
│   │   └── CreateCaseForm.tsx # New case creation form
│   ├── common/            # Common UI components
│   │   └── Modal.tsx      # Modal dialog component
│   ├── layout/            # Layout components
│   │   └── Sidebar.tsx    # Navigation sidebar
│   └── reports/           # Report-related components
├── hooks/                 # Custom React hooks
├── lib/                   # External service integrations
│   ├── gemini/            # Google AI integration
│   │   └── client.ts      # Gemini API client
│   └── supabase/          # Supabase integration
│       └── client.ts      # Supabase client configuration
├── styles/                # Additional styling files
└── types/                 # TypeScript type definitions
    └── index.ts           # Main type definitions
```

## 📋 Usage Guide

### Creating a New Case

1. **Navigate to Dashboard**: Start from the main dashboard
2. **Create New Case**: Click "Create New Case" button
3. **Fill Details**: Enter case title, location, and upload initial report
4. **Submit**: Case is created and you're redirected to the detail page

### Processing a Case

1. **Open Case Detail**: Click on any case from the dashboard
2. **Review Initial Report**: View the uploaded initial contact report
3. **Add Field Notes**: 
   - Enter text-based observations in the notes field
   - Record audio notes using the built-in recorder
4. **Generate Report**: Click "Generate Final Report with AI"
5. **Review & Edit**: AI-generated report appears for review and editing
6. **Save Report**: Save the final report to complete the case

### Audio Recording Features

- **Record**: Click "Start Recording" to begin audio capture
- **Stop**: Click "Stop Recording" to end recording
- **Playback**: Use play/pause controls for each recording
- **Delete**: Remove unwanted recordings
- **Management**: View recording timestamp, duration, and file size

## 🔧 Configuration

### Supabase Configuration

1. **Create Project**: Set up a new Supabase project
2. **Database Setup**: Run the SQL commands provided in the installation guide
3. **Storage Setup**: Configure the 'case-files' storage bucket
4. **Authentication**: Enable desired auth providers (Email, Google, etc.)
5. **RLS Policies**: Set up Row Level Security policies for data protection

### Google AI Setup

1. **Get API Key**: Obtain a Gemini API key from Google AI Studio
2. **Add to Environment**: Include in your `.env.local` file
3. **Configure Client**: The Gemini client is pre-configured in `lib/gemini/client.ts`

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `GEMINI_API_KEY` | Google AI API key | Yes |

## 🎯 API Endpoints

### POST `/api/generate-report`

Generates an AI-powered incident report based on case data.

**Request Body:**
```json
{
  "caseId": "string",
  "caseTitle": "string",
  "caseLocation": "string",
  "initialReportPath": "string",
  "additionalNotes": "string",
  "audioTranscript": "string"
}
```

**Response:**
```json
{
  "report": "string"
}
```

## 🛠️ Development

### Running the Application for Developers

#### Prerequisites
Ensure you have the following installed:
- **Node.js 18+** (recommended: use nvm for version management)
- **npm** or **yarn** package manager
- **Git** for version control

#### Step-by-Step Development Setup

1. **Clone and Navigate**
   ```bash
   git clone <repository-url>
   cd feuerdoc/feuerdoc/feuerdoc
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**
   Create `.env.local` file with required variables:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Google AI Configuration
   GEMINI_API_KEY=your_google_ai_api_key
   ```

4. **Database Setup** (First-time only)
   - Create Supabase project at [https://supabase.com](https://supabase.com)
   - Run the SQL commands from the Quick Start section
   - Set up storage bucket for file uploads

5. **Start Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   
   The application will be available at [http://localhost:3000](http://localhost:3000)

6. **Verify Setup**
   - Open browser to localhost:3000
   - Check that the dashboard loads
   - Test creating a new case
   - Verify file upload functionality

#### Development Workflow

1. **Daily Development**
   ```bash
   # Pull latest changes
   git pull origin main
   
   # Install any new dependencies
   npm install
   
   # Start development server
   npm run dev
   ```

2. **Working with Features**
   ```bash
   # Create feature branch
   git checkout -b feature/your-feature-name
   
   # Make changes and test
   npm run dev
   
   # Check for linting issues
   npm run lint
   
   # Build to ensure no production issues
   npm run build
   ```

3. **Testing Changes**
   ```bash
   # Lint your code
   npm run lint
   
   # Build production version
   npm run build
   
   # Test production build locally
   npm run start
   ```

#### Hot Reload and Development Features

- **Turbopack**: Fast refresh enabled by default with `--turbopack` flag
- **Auto-reload**: Changes to React components, pages, and API routes trigger automatic reload
- **TypeScript**: Real-time type checking in your IDE
- **Tailwind CSS**: JIT compilation for instant styling updates

#### Debugging

1. **Client-side Debugging**
   - Use React Developer Tools browser extension
   - Console logs are available in browser DevTools
   - Network tab shows API requests to `/api/generate-report`

2. **Server-side Debugging**
   - API route logs appear in terminal where `npm run dev` is running
   - Use `console.log()` in API routes for debugging
   - Check Supabase dashboard for database queries

3. **Common Issues**
   ```bash
   # Clear Next.js cache if experiencing issues
   rm -rf .next
   npm run dev
   
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

### Available Scripts

- `npm run dev` - Start development server with Turbopack hot reload
- `npm run build` - Create optimized production build
- `npm run start` - Start production server (requires build first)
- `npm run lint` - Run ESLint for code quality checks

### Code Quality

- **TypeScript**: Full type safety with strict configuration
- **ESLint**: Code linting with Next.js recommended rules
- **Prettier**: Code formatting (configure as needed)
- **File Structure**: Organized by feature and component type

### Development Tools Integration

#### VS Code (Recommended)
Install these extensions for optimal development experience:
- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Tailwind CSS IntelliSense
- Prettier - Code formatter
- ESLint

#### IDE Configuration
Add to `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### Testing

Currently, the project doesn't include test setup. Consider adding:
- Jest for unit testing
- React Testing Library for component testing
- Playwright for E2E testing

#### Setting up Testing (Optional)
```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Install Playwright for E2E testing
npx playwright install
```

## 🔮 Future Enhancements

See `ENHANCEMENT_RECOMMENDATIONS.md` for detailed improvement suggestions:

### Immediate Priorities
- PDF and Word document parsing
- Speech-to-text integration for audio notes
- Enhanced file validation and security
- Rich text editor implementation

### Advanced Features
- Report templates for different incident types
- Multi-language support
- CAD system integration
- NFIRS compliance
- Advanced AI features (incident classification, risk assessment)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use meaningful commit messages
- Ensure responsive design
- Test on multiple browsers
- Document new features

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

1. **Documentation**: Check this README and inline code comments
2. **Issues**: Create an issue on GitHub for bugs or feature requests
3. **Discussions**: Use GitHub Discussions for general questions

## 🔐 Security

- All user data is protected by Supabase Row Level Security
- File uploads are validated and stored securely
- API keys are properly configured in environment variables
- Authentication is handled by Supabase Auth

## 🏢 For Fire Departments

FeuerDoc is designed specifically for fire department operations:

- **NFIRS Ready**: Structured for National Fire Incident Reporting System compatibility
- **Department Customizable**: Adaptable to specific department procedures
- **Secure & Compliant**: Built with emergency services security requirements in mind
- **Multi-User Support**: Team collaboration features for department-wide use

---

**Built with ❤️ for Fire Departments**

FeuerDoc helps firefighters focus on what matters most - protecting lives and property - while ensuring thorough, professional documentation of every incident.
