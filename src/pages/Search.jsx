import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import { Search as SearchIcon, Users, Building2, HandCoins, Ticket } from 'lucide-react'

export default function Search() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ contacts: [], companies: [], deals: [], tickets: [] })
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const runSearch = useCallback(async () => {
    const q = query.trim()
    if (!q) {
      setResults({ contacts: [], companies: [], deals: [], tickets: [] })
      setSearched(true)
      return
    }
    setLoading(true)
    setSearched(true)
    const uid = user?.id
    const pattern = `%${q}%`
    try {
      const [contactsRes, companiesRes, dealsRes, ticketsRes] = await Promise.all([
        supabase
          .from('contacts')
          .select('id, full_name, email')
          .or(`owner_id.eq.${uid},owner_id.is.null`)
          .or(`full_name.ilike.${pattern},email.ilike.${pattern}`)
          .limit(10),
        supabase
          .from('companies')
          .select('id, name, domain')
          .or(`owner_id.eq.${uid},owner_id.is.null`)
          .or(`name.ilike.${pattern},domain.ilike.${pattern}`)
          .limit(10),
        supabase
          .from('deals')
          .select('id, title, amount, stage')
          .or(`owner_id.eq.${uid},owner_id.is.null`)
          .ilike('title', pattern)
          .limit(10),
        supabase
          .from('tickets')
          .select('id, title, status')
          .ilike('title', pattern)
          .limit(10),
      ])
      setResults({
        contacts: contactsRes.data ?? [],
        companies: companiesRes.data ?? [],
        deals: dealsRes.data ?? [],
        tickets: ticketsRes.data ?? [],
      })
    } catch (err) {
      setResults({ contacts: [], companies: [], deals: [], tickets: [] })
    } finally {
      setLoading(false)
    }
  }, [query, user?.id])

  const total =
    results.contacts.length +
    results.companies.length +
    results.deals.length +
    results.tickets.length

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Search</h1>
      <div className="max-w-2xl">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
              placeholder="Search contacts, companies, deals, tickets..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            />
          </div>
          <button
            onClick={runSearch}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-800 text-white rounded-md hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {searched && (
        <div className="mt-8 space-y-6">
          {query.trim() && total === 0 && !loading && (
            <p className="text-slate-500">No results found.</p>
          )}
          {results.contacts.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 font-medium text-slate-800 mb-2">
                <Users className="w-5 h-5 text-slate-500" />
                Contacts
              </h2>
              <ul className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
                {results.contacts.map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/contacts/${c.id}`}
                      className="block px-4 py-3 hover:bg-slate-50 font-medium text-slate-800"
                    >
                      {c.full_name}
                      {c.email && <span className="text-slate-500 font-normal ml-2">{c.email}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {results.companies.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 font-medium text-slate-800 mb-2">
                <Building2 className="w-5 h-5 text-slate-500" />
                Companies
              </h2>
              <ul className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
                {results.companies.map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/companies/${c.id}`}
                      className="block px-4 py-3 hover:bg-slate-50 font-medium text-slate-800"
                    >
                      {c.name}
                      {c.domain && <span className="text-slate-500 font-normal ml-2">{c.domain}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {results.deals.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 font-medium text-slate-800 mb-2">
                <HandCoins className="w-5 h-5 text-slate-500" />
                Deals
              </h2>
              <ul className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
                {results.deals.map((d) => (
                  <li key={d.id}>
                    <Link
                      to={`/deals/${d.id}`}
                      className="block px-4 py-3 hover:bg-slate-50 font-medium text-slate-800"
                    >
                      {d.title}
                      <span className="text-slate-500 font-normal ml-2">
                        ${Number(d.amount).toLocaleString()} · {d.stage}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {results.tickets.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 font-medium text-slate-800 mb-2">
                <Ticket className="w-5 h-5 text-slate-500" />
                Tickets
              </h2>
              <ul className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
                {results.tickets.map((t) => (
                  <li key={t.id}>
                    <Link
                      to={`/tickets/${t.id}`}
                      className="block px-4 py-3 hover:bg-slate-50 font-medium text-slate-800"
                    >
                      {t.title}
                      <span className="text-slate-500 font-normal ml-2 capitalize">{t.status}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
