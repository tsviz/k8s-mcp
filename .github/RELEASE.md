# 🚀 Release & CI/CD Workflows

This document describes the automated CI/CD workflows for the k8s-mcp-server project.

## 📋 Available Workflows

### 1. 🎉 Release Docker Images (`release.yml`)
**Triggers:** 
- Push to `main` branch
- Git tags (`v*`)
- Manual dispatch

**What it does:**
- ✅ Runs tests and linting
- 🐳 Builds multi-architecture Docker images (amd64, arm64)
- 🔒 Runs CodeQL security scans
- 📦 Publishes images to GitHub Container Registry
- 🎉 Creates GitHub releases for tags

**Images produced:**
- `ghcr.io/tsviz/k8s-mcp:latest`
- `ghcr.io/tsviz/k8s-mcp:v1.2.3` (for tags)
- `ghcr.io/tsviz/k8s-mcp-simple:latest` (development build)

### 2. 🔧 Development Build (`dev-build.yml`)
**Triggers:**
- Push to `develop` or `feature/*` branches
- Pull requests to `develop`

**What it does:**
- ✅ Runs tests and builds
- 🐳 Creates development Docker images
- 💬 Comments on PRs with testing instructions

## 🎯 Release Process

### Manual Releases

1. **Create and push a tag:**
   ```bash
   npm version patch  # or minor, major
   git push origin main --tags
   ```

2. **Or use npm scripts:**
   ```bash
   npm run release        # patch version
   npm run release:minor  # minor version  
   npm run release:major  # major version
   ```

3. **Manual workflow dispatch:**
   - Go to GitHub Actions
   - Run "Release Docker Images" workflow
   - Optionally specify custom tag

## 🐳 Using Released Images
### For configuration with VS Code and GitHub Copilot use the mcp.json file in the root of your project.

```json
{
  "servers": {
    "k8s-deployment-server": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-v", "/Users/your-user/.kube:/home/mcp/.kube:ro",
        "ghcr.io/tsviz/k8s-mcp:v1.2.3"
      ],
      "type": "stdio"
    }
  }
}
```

## 🔒 Security Features

- **CodeQL security scanning** for code vulnerabilities
- **Multi-architecture builds** for better security
- **Minimal container images** using Alpine Linux
- **Non-root user** execution in containers

## 📊 Monitoring & Notifications

- ✅ **Build status** visible in GitHub Actions
- 📧 **Automatic notifications** on failures
- 🔒 **Security alerts** for code vulnerabilities
- 📈 **Release metrics** in GitHub releases

## 🛠️ Local Development

### Testing the Workflows Locally

1. **Install act (GitHub Actions runner):**
   ```bash
   brew install act  # macOS
   # or
   curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
   ```

2. **Run workflows locally:**
   ```bash
   # Test the release workflow
   act push --workflows .github/workflows/release.yml
   
   # Test PR workflow
   act pull_request --workflows .github/workflows/dev-build.yml
   ```

### Manual Testing

1. **Build and test locally:**
   ```bash
   npm test
   npm run build
   npm run docker:build-multi
   ```

2. **Test the MCP server:**
   ```bash
   echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test", "version": "1.0.0"}}}' | docker run -i --rm -v ~/.kube:/home/mcp/.kube:ro k8s-mcp-server:latest
   ```

## 🎯 Best Practices

### Commit Messages
Use clear, descriptive commit messages:
- `feat: add new deployment strategy` 
- `fix: resolve pod discovery issue`
- `docs: update API documentation`
- `chore: update build scripts`

### Pull Request Process
1. Create feature branch: `feature/description`
2. Make changes and commit with clear messages
3. Push and create PR to `develop`
4. Automated tests and builds will run
5. After review, merge to `develop`
6. Periodically merge `develop` to `main` for releases

### Release Strategy
- **Patch releases:** Bug fixes, security updates
- **Minor releases:** New features, backwards compatible
- **Major releases:** Breaking changes, API changes

This workflow ensures reliable, automated releases with proper testing and security scanning! 🎉
