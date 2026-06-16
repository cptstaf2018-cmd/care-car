import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-5 text-center" dir="rtl">
          <p className="text-5xl mb-4">⚠️</p>
          <h1 className="text-xl font-black text-slate-900 mb-2">حدث خطأ غير متوقع</h1>
          <p className="text-slate-500 mb-6 text-sm">يمكنك إعادة تحميل الصفحة للمتابعة</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-slate-950 px-6 py-3 text-sm font-bold text-white hover:bg-slate-700"
          >
            إعادة تحميل
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
