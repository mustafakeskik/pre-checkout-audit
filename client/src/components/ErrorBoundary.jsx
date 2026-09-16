import React from 'react';
import { AlertTriangle } from 'lucide-react';

// Scopes a render crash to the tab it happened in instead of blanking the whole
// app (this is what let a bad URL crash SeoAuditTab take down the entire page).
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Tab render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white border border-[#d70015]/20 rounded-2xl p-8 text-center mb-8">
          <AlertTriangle className="w-8 h-8 text-[#d70015] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#1d1d1f] mb-1">Bu sekme yüklenirken bir hata oluştu</h3>
          <p className="text-xs text-[#6e6e73] mb-4">
            {this.state.error?.message || 'Beklenmeyen bir hata oluştu.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full text-xs font-semibold transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
