import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from './Login'
import { login } from '../api/auth'

vi.mock('../api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
  activate: vi.fn(),
  requestPasswordReset: vi.fn(),
  confirmPasswordReset: vi.fn(),
}))

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Login />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Login page', () => {
  it('renders the login form by default', () => {
    renderLogin()
    expect(screen.getByRole('heading', { name: 'تسجيل الدخول' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/email@example.com/)).toBeInTheDocument()
  })

  it('shows a wrong-credentials message on 401', async () => {
    login.mockRejectedValueOnce({ response: { status: 401 } })
    renderLogin()
    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText(/email@example.com/), 'test@test.com')
    await user.type(screen.getByLabelText('كلمة المرور'), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /دخول النظام/ }))

    await waitFor(() => {
      expect(screen.getByText('بيانات الدخول غير صحيحة')).toBeInTheDocument()
    })
  })

  it('shows a subscription-expired message on 402', async () => {
    login.mockRejectedValueOnce({ response: { status: 402 } })
    renderLogin()
    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText(/email@example.com/), 'test@test.com')
    await user.type(screen.getByLabelText('كلمة المرور'), 'somepass')
    await user.click(screen.getByRole('button', { name: /دخول النظام/ }))

    await waitFor(() => {
      expect(screen.getByText('انتهت فترة الاشتراك — تواصل مع الدعم لتجديد اشتراكك')).toBeInTheDocument()
    })
  })

  it('shows a generic connection error on other failures', async () => {
    login.mockRejectedValueOnce({ response: { status: 500 } })
    renderLogin()
    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText(/email@example.com/), 'test@test.com')
    await user.type(screen.getByLabelText('كلمة المرور'), 'somepass')
    await user.click(screen.getByRole('button', { name: /دخول النظام/ }))

    await waitFor(() => {
      expect(screen.getByText('خطأ في الاتصال، حاول مجددًا')).toBeInTheDocument()
    })
  })

  it('switches to the register tab and shows terms/privacy links', async () => {
    renderLogin()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'حساب جديد' }))

    expect(await screen.findByRole('link', { name: 'شروط الاستخدام' })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: 'سياسة الخصوصية' })).toHaveAttribute('href', '/privacy')
  })
})
