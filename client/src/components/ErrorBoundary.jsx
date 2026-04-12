import React from "react";
import { AlertTriangle } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Widget Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
          <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
            Widget failed to load
          </h3>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            Please refresh the page.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
