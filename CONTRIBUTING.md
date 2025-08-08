# Contributing to Q MCP Manager

Thank you for your interest in contributing to the Q MCP Manager! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- **Node.js** (version 14 or higher)
- **macOS** with Amazon Q CLI installed
- **Git** for version control

### Development Setup

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/q-mcp-manager.git
   cd q-mcp-manager
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```
   This uses nodemon for automatic restarts when you make changes.

## 📁 Project Structure

```
q-mcp-manager/
├── src/
│   ├── backend/
│   │   └── server.js              # Express.js API server
│   └── frontend/
│       ├── dashboard/             # Main dashboard interface
│       │   ├── index.html
│       │   ├── script.js
│       │   └── styles.css
│       └── home/                  # Home launcher interface
│           ├── index.html
│           ├── script.js
│           └── styles.css
├── scripts/                       # Shell scripts for server control
├── docs/                         # Documentation
├── logs/                         # Server logs (auto-generated)
└── config/                       # Configuration files
```

## 🛠️ Development Guidelines

### Code Style

- Use **ES6+** features where appropriate
- Follow **consistent indentation** (2 spaces for JS/HTML, 2 spaces for CSS)
- Use **descriptive variable names**
- Add **comments** for complex logic

### Frontend Development

- **HTML**: Semantic markup, accessibility considerations
- **CSS**: Use custom properties for colors, consistent spacing
- **JavaScript**: Modular code, error handling, responsive design

### Backend Development

- **Express.js**: RESTful API design
- **Error Handling**: Comprehensive error responses
- **Security**: Input validation, safe file operations

## 🧪 Testing

### Manual Testing Checklist

Before submitting changes, please test:

1. **Server Operations**:
   - [ ] Server starts successfully
   - [ ] API endpoints respond correctly
   - [ ] Graceful shutdown works

2. **Dashboard Functionality**:
   - [ ] MCP servers display correctly
   - [ ] Enable/disable operations work
   - [ ] Bulk operations function
   - [ ] Real-time updates work

3. **Home Screen**:
   - [ ] Server status displays correctly
   - [ ] Control buttons work
   - [ ] Theme switching works

4. **Cross-browser Testing**:
   - [ ] Safari (primary)
   - [ ] Chrome
   - [ ] Firefox

## 📝 Contribution Types

### Bug Fixes
- Check existing issues first
- Provide clear reproduction steps
- Include environment details

### New Features
- Discuss in an issue before implementing
- Consider backward compatibility
- Update documentation

### Documentation
- Keep README.md updated
- Add inline code comments
- Update API documentation

## 🚦 Pull Request Process

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Follow the coding standards
   - Test thoroughly
   - Update documentation if needed

3. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

   Use conventional commit messages:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `style:` for formatting changes
   - `refactor:` for code refactoring

4. **Push and create PR**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **PR Requirements**:
   - Clear title and description
   - Reference related issues
   - Include testing instructions
   - Screenshots for UI changes

## 🐛 Bug Reports

When reporting bugs, please include:

- **Environment**: macOS version, Node.js version, browser
- **Steps to reproduce**: Clear, numbered steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Screenshots**: If applicable
- **Console logs**: Any error messages

## 💡 Feature Requests

For new features:

1. **Check existing issues** to avoid duplicates
2. **Describe the use case** and problem it solves
3. **Provide examples** of how it would work
4. **Consider implementation** complexity and maintenance

## 📋 Development Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-restart
- `npm run server` - Use shell script for server control
- `./scripts/server.sh status` - Check server status
- `./scripts/server.sh logs --follow` - View real-time logs

## 🔄 Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md` (if exists)
3. Create release PR
4. Tag release after merge
5. Update GitHub release notes

## 📚 Resources

- [Express.js Documentation](https://expressjs.com/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Amazon Q Developer Documentation](https://docs.aws.amazon.com/amazonq/)

## ❓ Questions?

- Check existing [GitHub Issues](https://github.com/YOUR_USERNAME/q-mcp-manager/issues)
- Create a new issue for questions
- Review documentation in the `docs/` folder

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make Q MCP Manager better! 🎉
