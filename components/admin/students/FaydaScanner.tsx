'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Camera, AlertCircle } from 'lucide-react'

interface FaydaData {
  firstName: string
  lastName: string
  fullName: string
  gender: 'MALE' | 'FEMALE'
  dateOfBirth: string
  nationalId: string
}

interface FaydaScannerProps {
  onScan: (data: FaydaData) => void
  onClose: () => void
}

function parseFaydaQR(raw: string): FaydaData | null {
  try {
    const parts = raw.split(':')

    const dltIndex = parts.findIndex(p => p.trim() === 'DLT')
    if (dltIndex === -1) return null

    const fullName = parts[dltIndex + 1]?.trim() ?? ''
    if (!fullName) return null

    const nameParts = fullName.split(' ').filter(Boolean)
    const firstName = nameParts[0] ?? ''
    const lastName = nameParts[1] ?? ''

    const gIndex = parts.findIndex(p => p.trim() === 'G')
    const genderRaw = gIndex !== -1 ? parts[gIndex + 1]?.trim() : ''
    const gender: 'MALE' | 'FEMALE' = genderRaw === 'F' ? 'FEMALE' : 'MALE'

    const aIndex = parts.findIndex(p => p.trim() === 'A')
    const nationalId = aIndex !== -1 ? parts[aIndex + 1]?.trim() ?? '' : ''

    const dIndex = parts.findIndex(p => p.trim() === 'D')
    const dobRaw = dIndex !== -1 ? parts[dIndex + 1]?.trim() ?? '' : ''
    const dateOfBirth = dobRaw.replace(/\//g, '-')

    if (!firstName || !nationalId) return null

    return { firstName, lastName, fullName, gender, dateOfBirth, nationalId }
  } catch {
    return null
  }
}

// Track scanner state separately from React state
// to avoid closure/stale reference issues
const scannerState = {
  instance: null as any,
  isRunning: false,
  isStopping: false,
}

async function safeStopScanner() {
  if (!scannerState.instance) return
  if (!scannerState.isRunning) return
  if (scannerState.isStopping) return

  scannerState.isStopping = true
  try {
    await scannerState.instance.stop()
  } catch {
    // Ignore stop errors
  } finally {
    scannerState.isRunning = false
    scannerState.isStopping = false
    scannerState.instance = null
  }
}

export function FaydaScanner({ onScan, onClose }: FaydaScannerProps) {
  const [error, setError] = useState<string | null>(null)
  const [dots, setDots] = useState('.')
  const onScanRef = useRef(onScan)
  const onCloseRef = useRef(onClose)
  const mountedRef = useRef(true)

  // Keep refs updated
  useEffect(() => { onScanRef.current = onScan }, [onScan])
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '.' : d + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    mountedRef.current = true

    // Reset scanner state at mount
    scannerState.instance = null
    scannerState.isRunning = false
    scannerState.isStopping = false

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')

        if (!mountedRef.current) return

        const instance = new Html5Qrcode('fayda-qr-reader')
        scannerState.instance = instance

        await instance.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          async (decodedText: string) => {
            // Guard against multiple calls
            if (!scannerState.isRunning || scannerState.isStopping) return

            const data = parseFaydaQR(decodedText)
            if (!data) {
              // Not a valid Fayda QR — show brief error, keep scanning
              if (mountedRef.current) {
                setError('Not a Fayda ID QR code. Try again.')
                setTimeout(() => {
                  if (mountedRef.current) setError(null)
                }, 2000)
              }
              return
            }

            // Valid scan — stop and call callback
            await safeStopScanner()
            if (mountedRef.current) {
              onScanRef.current(data)
            }
          },
          () => {
            // Per-frame QR not found — ignore
          }
        )

        scannerState.isRunning = true

      } catch (err: any) {
        if (!mountedRef.current) return
        const msg = (err?.message ?? String(err)).toLowerCase()
        if (msg.includes('permission') || msg.includes('notallowed')) {
          setError('Camera access denied. Please allow camera permission in your browser settings.')
        } else if (msg.includes('notfound') || msg.includes('no camera')) {
          setError('No camera found on this device.')
        } else {
          setError(`Scanner could not start. ${err?.message ?? 'Please try again.'}`)
        }
      }
    }

    startScanner()

    return () => {
      mountedRef.current = false
      // Fire-and-forget stop on unmount
      safeStopScanner()
    }
  }, [])

  async function handleClose() {
    await safeStopScanner()
    onCloseRef.current()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative bg-gray-950 rounded-3xl overflow-hidden w-full max-w-sm mx-4 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
              <Camera size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Scan Fayda ID</p>
              <p className="text-gray-400 text-xs">Point camera at QR code</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
          >
            <X size={16} className="text-gray-300" />
          </button>
        </div>

        {/* Camera container */}
        <div className="relative bg-black" style={{ minHeight: 300 }}>
          <div id="fayda-qr-reader" className="w-full" />

          {/* Viewfinder overlay — only when no error */}
          {!error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-52 h-52">
                {/* Corner brackets */}
                {[
                  'top-0 left-0 border-t-4 border-l-4 rounded-tl-xl',
                  'top-0 right-0 border-t-4 border-r-4 rounded-tr-xl',
                  'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl',
                  'bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl',
                ].map((cls, i) => (
                  <div
                    key={i}
                    className={`absolute w-9 h-9 border-blue-400 ${cls}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/75 p-6">
              <div className="text-center">
                <AlertCircle size={36} className="text-red-400 mx-auto mb-3" />
                <p className="text-white text-sm font-medium leading-snug">
                  {error}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 text-center border-t border-gray-800">
          <p className="text-gray-300 text-sm font-medium">
            {error ? 'Resuming scan' : `Scanning${dots}`}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Point the QR code on the Fayda ID card at the camera
          </p>
        </div>
      </div>
    </div>
  )
}
