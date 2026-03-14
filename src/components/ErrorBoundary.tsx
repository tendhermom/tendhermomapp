import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center px-6"
          style={{ background: "hsl(30 14% 96%)" }}
        >
          <div className="text-center max-w-[320px]">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "hsl(14 82% 96%)" }}
            >
              <span className="text-[28px]">⚠️</span>
            </div>
            <h2
              className="text-[20px] font-bold mb-2"
              style={{ fontFamily: "'DM Serif Display', serif", color: "hsl(0 0% 10%)" }}
            >
              Something went wrong
            </h2>
            <p
              className="text-[14px] mb-6"
              style={{ fontFamily: "'Poppins', sans-serif", color: "hsl(0 0% 54%)" }}
            >
              We're sorry for the inconvenience. Please try refreshing the page.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="px-6 py-3 rounded-2xl text-[15px] font-semibold"
              style={{
                fontFamily: "'Poppins', sans-serif",
                background: "hsl(153 42% 30%)",
                color: "white",
              }}
            >
              Refresh App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
