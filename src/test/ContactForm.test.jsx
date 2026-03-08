import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ContactForm from '../components/ContactForm'
import * as supabaseModule from '../lib/supabase'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
  checkError: vi.fn(),
}))
vi.mock('../context/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}))

describe('ContactForm', () => {
  const mockOnClose = vi.fn()
  const mockOnSaved = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    const chain = {
      insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
      update: vi.fn().mockResolvedValue({ data: {}, error: null }),
      eq: vi.fn().mockReturnThis(),
    }
    vi.mocked(supabaseModule.supabase.from).mockReturnValue(chain)
    vi.mocked(supabaseModule.checkError).mockImplementation((result) => {
      if (result?.error) throw new Error(result.error.message)
      return result
    })
  })

  it('shows error and does not call onSaved when insert returns error', async () => {
    vi.mocked(supabaseModule.supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'RLS policy violation' },
      }),
      update: vi.fn(),
      eq: vi.fn().mockReturnThis(),
    })

    render(
      <ContactForm
        companies={[]}
        contact={null}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    )

    const nameInput = screen.getAllByRole('textbox')[0]
    fireEvent.change(nameInput, { target: { value: 'Test Contact' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText(/RLS policy violation/i)).toBeInTheDocument()
    })
    expect(mockOnSaved).not.toHaveBeenCalled()
  })

  it('calls onSaved when insert succeeds', async () => {
    render(
      <ContactForm
        companies={[]}
        contact={null}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    )

    const nameInput = screen.getAllByRole('textbox')[0]
    fireEvent.change(nameInput, { target: { value: 'Test Contact' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(mockOnSaved).toHaveBeenCalled()
    })
  })
})
