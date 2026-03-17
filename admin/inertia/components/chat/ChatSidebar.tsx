import classNames from '~/lib/classNames'
import StyledButton from '../StyledButton'
import { router, usePage } from '@inertiajs/react'
import { ChatSession } from '../../../types/chat'
import { IconCheck, IconMessage, IconPencil, IconTrash, IconX } from '@tabler/icons-react'
import { useRef, useState } from 'react'
import KnowledgeBaseModal from './KnowledgeBaseModal'

interface ChatSidebarProps {
  sessions: ChatSession[]
  activeSessionId: string | null
  onSessionSelect: (id: string) => void
  onNewChat: () => void
  onClearHistory: () => void
  onDeleteSession: (id: string) => void
  onRenameSession: (id: string, title: string) => void
  isInModal?: boolean
}

export default function ChatSidebar({
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewChat,
  onClearHistory,
  onDeleteSession,
  onRenameSession,
  isInModal = false,
}: ChatSidebarProps) {
  const { aiAssistantName } = usePage<{ aiAssistantName: string }>().props
  const [isKnowledgeBaseModalOpen, setIsKnowledgeBaseModalOpen] = useState(
    () => new URLSearchParams(window.location.search).get('knowledge_base') === 'true'
  )
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)

  function handleCloseKnowledgeBase() {
    setIsKnowledgeBaseModalOpen(false)
    const params = new URLSearchParams(window.location.search)
    if (params.has('knowledge_base')) {
      params.delete('knowledge_base')
      const newUrl = [window.location.pathname, params.toString()].filter(Boolean).join('?')
      window.history.replaceState(window.history.state, '', newUrl)
    }
  }

  function startRename(session: ChatSession) {
    setEditingSessionId(session.id)
    setEditTitle(session.title)
    setTimeout(() => editInputRef.current?.focus(), 0)
  }

  function submitRename() {
    if (editingSessionId && editTitle.trim()) {
      onRenameSession(editingSessionId, editTitle.trim())
    }
    setEditingSessionId(null)
  }

  function cancelRename() {
    setEditingSessionId(null)
  }

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 h-[75px] flex items-center justify-center">
        <StyledButton onClick={onNewChat} icon="IconPlus" variant="primary" fullWidth>
          New Chat
        </StyledButton>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">No previous chats</div>
        ) : (
          <div className="p-2 space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={classNames(
                  'w-full text-left px-3 py-2 rounded-lg transition-colors group relative',
                  activeSessionId === session.id
                    ? 'bg-desert-green text-white'
                    : 'hover:bg-gray-200 text-gray-700'
                )}
              >
                {editingSessionId === session.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitRename()
                        if (e.key === 'Escape') cancelRename()
                      }}
                      className="flex-1 min-w-0 text-sm px-1 py-0.5 rounded border border-gray-300 text-gray-900 bg-white"
                    />
                    <button
                      onClick={submitRename}
                      className="p-0.5 rounded hover:bg-green-100"
                      title="Save"
                    >
                      <IconCheck className="h-4 w-4 text-green-600" />
                    </button>
                    <button
                      onClick={cancelRename}
                      className="p-0.5 rounded hover:bg-red-100"
                      title="Cancel"
                    >
                      <IconX className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onSessionSelect(session.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start gap-2">
                      <IconMessage
                        className={classNames(
                          'h-5 w-5 mt-0.5 shrink-0',
                          activeSessionId === session.id ? 'text-white' : 'text-gray-400'
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{session.title}</div>
                        {session.lastMessage && (
                          <div
                            className={classNames(
                              'text-xs truncate mt-0.5',
                              activeSessionId === session.id ? 'text-white/80' : 'text-gray-500'
                            )}
                          >
                            {session.lastMessage}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )}
                {editingSessionId !== session.id && (
                  <div
                    className={classNames(
                      'absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity',
                    )}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        startRename(session)
                      }}
                      className={classNames(
                        'p-1 rounded',
                        activeSessionId === session.id
                          ? 'hover:bg-white/20 text-white/80 hover:text-white'
                          : 'hover:bg-gray-300 text-gray-400 hover:text-gray-600'
                      )}
                      title="Rename"
                    >
                      <IconPencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteSession(session.id)
                      }}
                      className={classNames(
                        'p-1 rounded',
                        activeSessionId === session.id
                          ? 'hover:bg-white/20 text-white/80 hover:text-white'
                          : 'hover:bg-red-100 text-gray-400 hover:text-red-500'
                      )}
                      title="Delete"
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col items-center justify-center gap-y-2">
        <img src="/project_nomad_logo.png" alt="Project Nomad Logo" className="h-28 w-28 mb-6" />
        <StyledButton
          onClick={() => {
            if (isInModal) {
              window.open('/chat', '_blank')
            } else {
              router.visit('/home')
            }
          }}
          icon={isInModal ? 'IconExternalLink' : 'IconHome'}
          variant="outline"
          size="sm"
          fullWidth
        >
          {isInModal ? 'Open in New Tab' : 'Back to Home'}
        </StyledButton>
        <StyledButton
          onClick={() => {
            router.visit('/settings/models')
          }}
          icon="IconDatabase"
          variant="primary"
          size="sm"
          fullWidth
        >
          Models & Settings
        </StyledButton>
        <StyledButton
          onClick={() => {
            setIsKnowledgeBaseModalOpen(true)
          }}
          icon="IconBrain"
          variant="primary"
          size="sm"
          fullWidth
        >
          Knowledge Base
        </StyledButton>
        {sessions.length > 0 && (
          <StyledButton
            onClick={onClearHistory}
            icon="IconTrash"
            variant="danger"
            size="sm"
            fullWidth
          >
            Clear History
          </StyledButton>
        )}
      </div>
      {isKnowledgeBaseModalOpen && (
        <KnowledgeBaseModal aiAssistantName={aiAssistantName} onClose={handleCloseKnowledgeBase} />
      )}
    </div>
  )
}
