#!/bin/bash

# Build and Deploy Script for K8s MCP Server
set -e

echo "🚀 K8s MCP Server Build & Deploy Script"
echo "========================================"

# Parse command line arguments
COMMAND="${1:-build-deploy}"
IMAGE_TAG="${2:-latest}"
DOCKERFILE="${3:-Dockerfile.multistage}"
NAMESPACE="${4:-default}"

# Configuration
IMAGE_NAME="k8s-mcp-server"

# Functions
build_image() {
    echo "📦 Building Docker image: $IMAGE_NAME:$IMAGE_TAG"
    echo "📄 Using Dockerfile: $DOCKERFILE"
    docker build -f "$DOCKERFILE" -t "$IMAGE_NAME:$IMAGE_TAG" .
    echo "✅ Image built successfully"
}

run_local() {
    echo "🏃 Running container locally..."
    docker run --rm \
        -v ~/.kube:/home/mcp/.kube:ro \
        -e NODE_ENV=production \
        "$IMAGE_NAME:$IMAGE_TAG"
}

deploy_k8s() {
    echo "☸️  Deploying to Kubernetes cluster..."
    echo "🎯 Target namespace: $NAMESPACE"
    
    # Apply RBAC
    echo "🔐 Applying RBAC configuration..."
    kubectl apply -f examples/rbac.yaml
    
    # Update image in deployment
    echo "📝 Updating deployment with image: $IMAGE_NAME:$IMAGE_TAG"
    sed "s|k8s-mcp-server:latest|$IMAGE_NAME:$IMAGE_TAG|g" examples/k8s-deployment.yaml | kubectl apply -f -
    
    # Wait for deployment
    echo "⏳ Waiting for deployment to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/k8s-mcp-server -n "$NAMESPACE"
    
    echo "✅ Deployment completed successfully"
    kubectl get pods -l app=k8s-mcp-server -n "$NAMESPACE"
}

show_usage() {
    echo "Usage: $0 <COMMAND> [IMAGE_TAG] [DOCKERFILE] [NAMESPACE]"
    echo ""
    echo "Commands:"
    echo "  build           - Build Docker image only"
    echo "  run             - Build and run locally"
    echo "  deploy          - Build and deploy to Kubernetes"
    echo "  build-deploy    - Build and deploy (alias for deploy)"
    echo ""
    echo "Examples:"
    echo "  $0 build v1.0.0"
    echo "  $0 run latest Dockerfile.multistage"
    echo "  $0 deploy v1.0.0 Dockerfile.multistage production"
    echo ""
}

# Main execution
case "$COMMAND" in
    "build")
        build_image
        ;;
    "run")
        build_image
        run_local
        ;;
    "deploy"|"build-deploy")
        build_image
        deploy_k8s
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        echo "❌ Unknown command: $COMMAND"
        show_usage
        exit 1
        ;;
esac

echo "🎉 Script completed successfully!"
