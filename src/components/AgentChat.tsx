'use client'
import { useState, useRef, useEffect } from 'react'
import { useWallet } from '@/context/WalletContext'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { createTransferInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'

type Action = { amount: string; to: string; chain: 'arc' | 'solana' }
type Message = { role: 'user' | 'agent'; content: string; action?: Action }

const SOLANA_USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')

function parsePayment(text: string): Action | null {
  const amountMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:usdc|USDC)/i)
  const evmAddress = text.match(/0x[a-fA-F0-9]{40}/i)
  const solanaAddress = text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/g)?.find(a => {
    try { new PublicKey(a); return true } catch { return false }
  })
  const isSolana = /solana|phantom|sol/i.test(text)

  if (amountMatch && evmAddress && !isSolana) {
    return { amount: amountMatch[1], to: evmAddress[0], chain: 'arc' }
  }
  if (amountMatch && solanaAddress && isSolana) {
    return { amount: amountMatch[1], to: solanaAddress, chain: 'solana' }
  }
  if (amountMatch && evmAddress) {
    return { amount: amountMatch[1], to: evmAddress[0], chain: 'arc' }
  }
  return null
}

export function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'agent', content: "Hi! I'm your SwiftPayment Agent. I can send USDC on Arc Testnet or Solana Devnet. Try: \"Send 5 USDC to 0x...\" or \"Send 2 USDC on Solana to [address]\"" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [txStatus, setTxStatus] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { evmAddress, solanaAddress } = useWallet()

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
      const chainLabel = action.chain === 'solana' ? 'Solana Devnet' : 'Arc Testnet'
      setMessages(prev => [...prev, {
        role: 'agent',
        content: `I'll send ${action.amount} USDC on ${chainLabel} to ${action.to.slice(0, 8)}...${action.to.slice(-6)}. Click "Send Now" to confirm.`,
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
            contents: [{ parts: [{ text: `You are SwiftPayment Agent. Help with USDC payments on Arc Testnet or Solana Devnet. User: "${userMsg}". Reply briefly in 1-2 sentences.` }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 100 }
          })
        }
      )
      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'How can I help you send USDC?'
      setMessages(prev => [...prev, { role: 'agent', content: text }])
    } catch {
      setMessages(prev => [...prev, { role: 'agent', content: 'Please specify amount and address. Example: "Send 5 USDC to 0x..." or "Send 2 USDC on Solana to [address]"' }])
    } finally {
      setLoading(false)
    }
  }

  async function executeArcPayment(action: Action) {
    if (!evmAddress) { setTxStatus('Connect your Rabby wallet first.'); return }
    const eth = (window as any).ethereum
    if (!eth) { setTxStatus('No wallet found!'); return }
    try {
      setTxStatus('Sending on Arc Testnet...')
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
      const history = JSON.parse(localStorage.getItem('swiftpay_history') || '[]')
      history.unshift({ id: Date.now().toString(), to: action.to, amount: action.amount, txHash, timestamp: new Date().toISOString(), status: 'success', chain: 'Arc Testnet' })
      localStorage.setItem('swiftpay_history', JSON.stringify(history))
      setTxStatus(null)
      setMessages(prev => [...prev, { role: 'agent', content: `✅ Sent ${action.amount} USDC on Arc Testnet! TX: ${txHash.slice(0, 16)}...` }])
    } catch (e: any) {
      setTxStatus(e.code === 4001 ? 'Rejected.' : 'Error: ' + e.message)
    }
  }

  async function executeSolanaPayment(action: Action) {
    if (!solanaAddress) { setTxStatus('Connect your Phantom wallet first.'); return }
    const sol = (window as any).solana
    if (!sol) { setTxStatus('Phantom not found!'); return }
    try {
      setTxStatus('Sending on Solana Devnet...')
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
      const fromPubkey = new PublicKey(solanaAddress)
      const toPubkey = new PublicKey(action.to)
      const amount = Math.round(parseFloat(action.amount) * 1e6)

      const fromATA = await getAssociatedTokenAddress(SOLANA_USDC_MINT, fromPubkey)
      const toATA = await getAssociatedTokenAddress(SOLANA_USDC_MINT, toPubkey)

      const tx = new Transaction()
      const toATAInfo = await connection.getAccountInfo(toATA)
      if (!toATAInfo) {
        tx.add(createAssociatedTokenAccountInstruction(fromPubkey, toATA, toPubkey, SOLANA_USDC_MINT, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID))
      }
      tx.add(createTransferInstruction(fromATA, toATA, fromPubkey, amount))
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
      tx.feePayer = fromPubkey

      const signed = await sol.signTransaction(tx)
      const txHash = await connection.sendRawTransaction(signed.serialize())
      await connection.confirmTransaction(txHash)

      const history = JSON.parse(localStorage.getItem('swiftpay_history') || '[]')
      history.unshift({ id: Date.now().toString(), to: action.to, amount: action.amount, txHash, timestamp: new Date().toISOString(), status: 'success', chain: 'Solana Devnet' })
      localStorage.setItem('swiftpay_history', JSON.stringify(history))
      setTxStatus(null)
      setMessages(prev => [...prev, { role: 'agent', content: `✅ Sent ${action.amount} USDC on Solana Devnet! TX: ${txHash.slice(0, 16)}...` }])
    } catch (e: any) {
      setTxStatus(e.code === 4001 ? 'Rejected.' : 'Error: ' + e.message)
    }
  }

  async function executePayment(action: Action) {
    if (action.chain === 'solana') {
      await executeSolanaPayment(action)
    } else {
      await executeArcPayment(action)
    }
  }

  return (
    <section className="panel agent-panel">
      <div className="panel-header">
        <h2>🤖 SwiftPayment Agent</h2>
        <p>Send USDC on Arc Testnet or Solana Devnet with a simple command.</p>
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
                  <span style={{ fontSize: '0.75rem', color: msg.action.chain === 'solana' ? '#9945FF' : '#10b981' }}>
                    {msg.action.chain === 'solana' ? 'Solana Devnet' : 'Arc Testnet'}
                  </span>
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
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder='Try: "Send 5 USDC to 0x..." or "Send 2 USDC on Solana to [address]"' disabled={loading} />
        <button className="button primary" onClick={sendMessage} disabled={loading || !input.trim()}>Send</button>
      </div>
    </section>
  )
}
