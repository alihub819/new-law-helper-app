import React from "react";

type State = { hasError: boolean };

class ErrorBoundary extends React.Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    // Update state so the next render shows the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // You can log the error to an error reporting service here
    // eslint-disable-next-line no-console
    console.error("Unhandled error in UI:", error, info);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI here
      return (
        <div style={{ padding: 20, textAlign: "center" }}>
          <h1>Something went wrong.</h1>
          <p>We’re fixing it. Please try again in a moment.</p>
        </div>
      );
    }

    return this.props.children as React.ReactNode;
  }
}

export default ErrorBoundary;
