import React, { useState, useEffect } from 'react';
import { SessionMetadata } from '../../domain/types';
import { SessionRepository } from '../../storage/SessionRepository';
import { Disc3, Play, Pause, Download, Trash2, Calendar, Clock, HardDrive } from 'lucide-react';

export const SessionsView: React.FC = () => {
  const [sessions, setSessions] = useState<SessionMetadata[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const loadSessions = async () => {
    const list = await SessionRepository.getAllSessions();
    setSessions(list);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handlePlay = async (session: SessionMetadata) => {
    if (activeSessionId === session.id && audioElement) {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        audioElement.play();
        setIsPlaying(true);
      }
      return;
    }

    // Load full session with blob
    const full = await SessionRepository.getSession(session.id);
    if (!full || !full.wavBlob) {
      alert('Audio file data not found for this session.');
      return;
    }

    if (activeAudioUrl) {
      URL.revokeObjectURL(activeAudioUrl);
    }

    const url = URL.createObjectURL(full.wavBlob);
    const audio = new Audio(url);
    audio.onended = () => setIsPlaying(false);
    audio.play();

    setAudioElement(audio);
    setActiveAudioUrl(url);
    setActiveSessionId(session.id);
    setIsPlaying(true);
  };

  const handleDownload = async (session: SessionMetadata) => {
    const full = await SessionRepository.getSession(session.id);
    if (!full || !full.wavBlob) {
      alert('Cannot export: WAV audio data missing.');
      return;
    }

    const a = document.createElement('a');
    a.href = URL.createObjectURL(full.wavBlob);
    a.download = `doppler_session_${session.id.slice(0, 8)}.wav`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this recorded session permanently?')) {
      await SessionRepository.deleteSession(id);
      if (activeSessionId === id && audioElement) {
        audioElement.pause();
        setIsPlaying(false);
      }
      loadSessions();
    }
  };

  const formatDuration = (ms: number) => {
    const secs = Math.floor(ms / 1000);
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="space-y-4 pb-24 max-w-2xl mx-auto px-4 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-100">Saved Sessions</h2>
          <p className="text-xs text-zinc-400">Locally stored non-destructive Doppler recordings</p>
        </div>
        <span className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs font-mono text-zinc-400">
          {sessions.length} Recorded
        </span>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center bg-zinc-900/30">
          <Disc3 className="mx-auto h-10 w-10 text-zinc-700 mb-2" />
          <p className="text-sm font-medium text-zinc-400">No sessions recorded yet</p>
          <p className="text-xs text-zinc-600 mt-1">
            Switch to the Monitor tab and click "Record Session" to save audio.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const isCurrent = activeSessionId === s.id;
            return (
              <div
                key={s.id}
                className={`rounded-xl border p-4 transition-all ${
                  isCurrent
                    ? 'border-cyan-500/50 bg-zinc-900/90 shadow-md'
                    : 'border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-zinc-200">{s.title}</span>
                      <span className="rounded bg-zinc-800 px-1.5 py-0.2 text-[10px] font-mono text-zinc-400">
                        {s.storageType.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-zinc-500" />
                        <span>{new Date(s.startTime).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-zinc-500" />
                        <span>{formatDuration(s.durationMs)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <HardDrive className="h-3 w-3 text-zinc-500" />
                        <span>{(s.pcmByteLength / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePlay(s)}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
                        isCurrent && isPlaying
                          ? 'bg-cyan-500 text-zinc-950 border-cyan-400'
                          : 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-700'
                      }`}
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="h-4 w-4 fill-current" />
                      ) : (
                        <Play className="h-4 w-4 fill-current" />
                      )}
                    </button>

                    <button
                      onClick={() => handleDownload(s)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                      title="Download WAV File"
                    >
                      <Download className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(s.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-rose-400 hover:border-rose-500/30"
                      title="Delete Session"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
