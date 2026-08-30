'use client'
import { useState, useRef, useEffect } from 'react'
import { useWallet } from '@/context/WalletContext'

type Action = { amount: string; to: string }
type Message = { role: 'user' | 'agent'; content: string; action?: Action }

function parsePayment(text: string): Action | null {
  const amountMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:usdc|USDC)/i)
  const addressMatch = text.match(/0x[a-fA-F0-9]{40}/i)
  if (amountMatch && addressMatch) {
    return { amount: amountMatch[1], to: addressMatch[0] }
  }
  return null
}

export function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'agent', content: "Hi! I'm your SwiftPay AI agent. Try: \"Send 5 USDC to 0x...\"" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [txStatus, setTxStatus] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { evmAddress } = useWallet()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    const action = parsePayment(userMsg)

    if (action) {
      setMessages(prev => [...prev, {
        role: 'agent',
        content: `I'll send ${action.amount} USDC to ${action.to.slice(0, 8)}...${action.to.slice(-6)}. Click "Send Now" to confirm.`,
        action
      }])
      setLoading(false)
      return
    }

    try {
      const res = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=' + process.env.NEXT_PUBLIC_GEMINI_API_KEY,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `You are SwiftPay AI agent. Help with USDC payments on Arc Testnet. User: "${userMsg}". Reply briefly in 1-2 sentences.` }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 100 }
          })
        }
      )
      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'How can I help you send USDC?'
      setMessages(prev => [...prev, { role: 'agent', content: text }])
    } catch {
      setMessages(prev => [...prev, { role: 'agent', content: 'Please specify amount and address. Example: "Send 5 USDC to 0x..."' }])
    } finally {
      setLoading(false)
    }
  }

  async function executePayment(action: Action) {
    if (!evmAddress) { setTxStatus('Connect your Rabby wallet first.'); return }
    const eth = (window as any).ethereum
    if (!eth) { setTxStatus('No wallet found!'); return }
    try {
      setTxStatus('Sending...')
      const accounts = await eth.request({ method: 'eth_accounts' })
      const USDC = '0x3600000000000000000000000000000000000000'
      const ARC = '0x4CEF52'
      const amt = BigInt(Math.round(parseFloat(action.amount) * 1e6))
      const to = action.to.slice(2).padStart(64, '0')
      const amtHex = amt.toString(16).padStart(64, '0')
      const txHash = await eth.request({
        method: 'eth_sendTransaction',
        params: [{ from: accounts[0], to: USDC, value: '0x0', data: '0xa9059cbb' + to + amtHex, chainId: ARC }]
      })
      setTxStatus(null)
      setMessages(prev => [...prev, { role: 'agent', content: `✅ Sent ${action.amount} USDC! TX: ${txHash.slice(0, 16)}...` }])
    } catch (e: any) {
      setTxStatus(e.code === 4001 ? 'Rejected.' : 'Error: ' + e.message)
    }
  }

  return (
    <section className="panel agent-panel">
      <div className="panel-header">
        <h2>🤖 SwiftPayment Agent</h2>
        <p>Tell me what to pay and I&apos;ll handle it.</p>
      </div>
      <div className="agent-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`agent-message ${msg.role}`}>
            <div className="agent-bubble">{msg.content}</div>
            {msg.action && (
              <div className="agent-action-card">
                <div className="agent-action-details">
                  <span className="agent-action-amount">{msg.action.amount} USDC</span>
                  <span className="agent-action-to">→ {msg.action.to.slice(0, 8)}...{msg.action.to.slice(-6)}</span>
                </div>
                <button className="button primary agent-execute-btn" onClick={() => executePayment(msg.action!)}>Send Now</button>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="agent-message agent">
            <div className="agent-bubble agent-typing"><span></span><span></span><span></span></div>
          </div>
        )}
        {txStatus && <div className="agent-tx-status">{txStatus}</div>}
        <div ref={bottomRef} />
      </div>
      <div className="agent-input-row">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder='Try: "Send 5 USDC to 0x..."' disabled={loading} />
        <button className="button primary" onClick={sendMessage} disabled={loading || !input.trim()}>Send</button>
      </div>
    </section>
  )
}
