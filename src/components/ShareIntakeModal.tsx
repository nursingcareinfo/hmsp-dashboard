import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Copy, Check, ExternalLink, Share2 } from 'lucide-react'

const INTAKE_URL = 'https://nursingcareinfo.github.io/hmsp-dashboard/intake.html'

const WHATSAPP_TEXT = encodeURIComponent(
  'HMSP Patient Intake Form\n\n' +
    'Dear Patient, please fill this digital form to register for our home medical services. ' +
    'The form includes our service agreement and terms & conditions.\n\n' +
    'Link: ' +
    INTAKE_URL
)

const WHATSAPP_URL = `https://wa.me/?text=${WHATSAPP_TEXT}`

interface ShareIntakeModalProps {
  open: boolean
  onClose: () => void
}

export default function ShareIntakeModal({ open, onClose }: ShareIntakeModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(INTAKE_URL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API not available — user can manually select
    }
  }

  const handleWhatsApp = () => {
    window.open(WHATSAPP_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-black border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Share2 size={16} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Share Intake Form</h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                    Send link to patient via WhatsApp
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X size={14} className="text-slate-400" />
              </button>
            </div>

            {/* URL display */}
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1">
                Intake Form URL
              </p>
              <p className="text-sm text-slate-300 font-mono truncate">{INTAKE_URL}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 text-sm text-white font-medium transition-all"
              >
                {copied ? (
                  <>
                    <Check size={16} className="text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy Link
                  </>
                )}
              </button>
              <button
                onClick={handleWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 rounded-xl py-3 text-sm text-black font-bold transition-all"
              >
                <ExternalLink size={16} />
                WhatsApp
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
