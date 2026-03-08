import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

vi.mock('../context/useAuth', () => ({
  useAuth: vi.fn(),
}))

const { useAuth } = await import('../context/useAuth')

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
      refreshProfile: vi.fn(),
    })
  })

  it('redirects to /login when user is not authenticated', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )
    // After redirect, Login page should be shown (Sign in heading)
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows loading when loading is true', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      profile: null,
      loading: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
      refreshProfile: vi.fn(),
    })
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByText(/Loading/i)).toBeInTheDocument()
  })
})
