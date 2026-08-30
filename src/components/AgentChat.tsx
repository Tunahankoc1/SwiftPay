'use client'
import { useState, useRef, useEffect } from 'react'
import { useWallet } from '@/context/WalletContext'

type Message = {
  role: 'user' | 'agent'
  content: string
  action?: {
    type: 'payment'
    amount: string
    to: string
  }
}

export function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'agent', content: 'Hi! I\'m your SwiftPay AI agent. I can help you send USDC payments on Arc Testnet. Try: "Send 5 USDC to 0x..."' }
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

    try {
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + process.env.NEXT_PUBLIC_GEMINI_API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a SwiftPay AI agent for Arc Testnet USDC payments. 
              
The user said: "${userMsg}"

If the user wants to send USDC, extract:
- amount (number)
- to address (0x... Ethereum address)

Respond in JSON format only:
{
  "message": "your friendly response",
  "action": {
    "type": "payment",
    "amount": "10",
    "to": "0x..."
  }
}

If no payment intent, respond:
{
  "message": "your helpful response",
  "action": null
}

Rules:
- Only Arc Testnet USDC payments
- Amount must be positive number
- Address must start with 0x and be 42 chars
- Be concise and friendly`
            }]
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 500 }
        })
      })

      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)

      const agentMsg: Message = {
        role: 'agent',
        content: parsed.message,
        action: parsed.action || undefined
      }
      setMessages(prev => [...prev, agentMsg])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'agent', content: 'Sorry, I had trouble understanding that. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  async function executePayment(action: { type: string; amount: string; to: string }) {
    if (!evmAddress) {
      setTxStatus('Please connect your Rabby wallet first.')
      return
    }
    const eth = (window as any).ethereum
    if (!eth) { setTxStatus('No wallet found!'); return }

    try {
      setTxStatus('Sending payment...')
      const accounts = await eth.request({ method: 'eth_accounts' })
      const from = accounts[0]
      const USDC_ADDRESS = '0x3600000000000000000000000000000000000000'
      const ARC_CHAIN_ID = '0x4CEF52'
      const amountInUnits = BigInt(Math.round(parseFloat(action.amount) * 1e6))
      const paddedTo = action.to.slice(2).padStart(64, '0')
      const paddedAmount = amountInUnits.toString(16).padStart(64, '0')
      const data = '0xa9059cbb' + paddedTo + paddedAmount

      const txHash = await eth.request({
        method: 'eth_sendTransaction',
        params: [{ from, to: USDC_ADDRESS, value: '0x0', data, chainId: ARC_CHAIN_ID }]
      })

      setTxStatus('✅ Payment sent!')
      setMessages(prev => [...prev, {
        role: 'agent',
        content: `Payment successful! Sent ${action.amount} USDC. TX: ${txHash.slice(0, 16)}...`
      }])
    } catch (e: any) {
      if (e.code === 4001) setTxStatus('Transaction rejected.')
      else setTxStatus('Error: ' + e.message)
    }
  }

  return (
    <section className="panel agent-panel">
      <div className="panel-header">
        <h2>🤖 AI Payment Agent</h2>
        <p>Tell me what to pay and I&apos;ll handle it. Powered by Gemini.</p>
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
                <button
                  className="button primary agent-execute-btn"
                  onClick={() => executePayment(msg.action!)}
                >
                  Send Now
                </button>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="agent-message agent">
            <div className="agent-bubble agent-typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        {txStatus && <div className="agent-tx-status">{txStatus}</div>}
        <div ref={bottomRef} />
      </div>

      <div className="agent-input-row">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder='Try: "Send 5 USDC to 0x..."'
          disabled={loading}
        />
        <button
          className="button primary"
          onClick={sendMessage}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </section>
  )
}
