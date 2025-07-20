// frontend/frontend/src/components/ErrorBoundary.jsx

import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    alert(
      "Ошибка в компоненте: " +
        error?.toString() +
        "\n" +
        (errorInfo?.componentStack || "")
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: "red", padding: 16 }}>
          <h2>Произошла ошибка при отображении результата.</h2>
          <pre>{this.state.error?.toString()}</pre>
          <pre>{this.state.errorInfo?.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;