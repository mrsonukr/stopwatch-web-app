import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, Flag, History, Trash2, X } from 'lucide-react';

interface LapTime {
  id: number;
  time: number;
  lapTime: number;
}

interface Session {
  id: string;
  date: string;
  totalTime: number;
  lapTimes: LapTime[];
}

function App() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [lapTimes, setLapTimes] = useState<LapTime[]>([]);
  const [lastLapTime, setLastLapTime] = useState(0);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load sessions from localStorage on component mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('stopwatch-sessions');
    if (savedSessions) {
      try {
        setSessions(JSON.parse(savedSessions));
      } catch (error) {
        console.error('Error loading sessions:', error);
      }
    }
  }, []);

  // Save sessions to localStorage whenever sessions change
  useEffect(() => {
    localStorage.setItem('stopwatch-sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 10);
      }, 10);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleStartStop = () => {
    setIsRunning(!isRunning);
  };

  const saveSession = () => {
    if (time > 0) {
      const newSession: Session = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        totalTime: time,
        lapTimes: [...lapTimes]
      };
      setSessions(prev => [newSession, ...prev]);
    }
  };

  const handleReset = () => {
    // Save current session before resetting if there's time recorded
    saveSession();

    setIsRunning(false);
    setTime(0);
    setLapTimes([]);
    setLastLapTime(0);
  };

  const handleLap = () => {
    if (isRunning) {
      const lapTime = time - lastLapTime;
      const newLap: LapTime = {
        id: lapTimes.length + 1,
        time: time,
        lapTime: lapTime
      };
      setLapTimes(prev => [newLap, ...prev]);
      setLastLapTime(time);
    }
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(session => session.id !== sessionId));
  };

  const clearAllHistory = () => {
    setSessions([]);
    localStorage.removeItem('stopwatch-sessions');
  };

  const getFastest = (laps: LapTime[] = lapTimes) => {
    if (laps.length === 0) return null;
    return Math.min(...laps.map(lap => lap.lapTime));
  };

  const getSlowest = (laps: LapTime[] = lapTimes) => {
    if (laps.length === 0) return null;
    return Math.max(...laps.map(lap => lap.lapTime));
  };

  const fastest = getFastest();
  const slowest = getSlowest();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl font-semibold text-gray-900">Stopwatch</h1>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 relative"
            >
              <History className="w-5 h-5 text-gray-600" />
              {sessions.length > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-medium">{sessions.length > 9 ? '9+' : sessions.length}</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Session History</h2>
              <div className="flex items-center space-x-2">
                {sessions.length > 0 && (
                  <button
                    onClick={clearAllHistory}
                    className="p-2 rounded-full hover:bg-red-50 text-red-600 transition-colors duration-200"
                    title="Clear all history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-96">
              {sessions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No sessions recorded yet</p>
                  <p className="text-sm mt-1">Start timing to create your first session</p>
                </div>
              ) : (
                sessions.map((session) => {
                  const sessionFastest = getFastest(session.lapTimes);
                  const sessionSlowest = getSlowest(session.lapTimes);

                  return (
                    <div key={session.id} className="border-b border-gray-100 last:border-b-0">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="font-mono text-lg font-medium text-gray-900">
                              {formatTime(session.totalTime)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDate(session.date)}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteSession(session.id)}
                            className="p-1 rounded-full hover:bg-red-50 text-red-600 transition-colors duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {session.lapTimes.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-gray-700">
                              Laps ({session.lapTimes.length})
                            </div>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                              {session.lapTimes.map((lap) => (
                                <div
                                  key={lap.id}
                                  className={`flex justify-between items-center text-sm p-2 rounded-lg ${lap.lapTime === sessionFastest ? 'bg-green-50 text-green-700' :
                                      lap.lapTime === sessionSlowest ? 'bg-red-50 text-red-700' :
                                        'bg-gray-50 text-gray-600'
                                    }`}
                                >
                                  <span>Lap {lap.id}</span>
                                  <span className="font-mono">{formatTime(lap.lapTime)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-6 py-8 space-y-8">
        {/* Timer Display */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20">
          <div className="text-center">
            <div className="text-6xl font-mono font-light text-gray-900 mb-2 tracking-tight">
              {formatTime(time)}
            </div>
            <div className="text-sm text-gray-500 font-medium">
              {isRunning ? 'Running' : time > 0 ? 'Paused' : 'Ready'}
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center space-x-4">
          {/* Start/Stop Button */}
          <button
            onClick={handleStartStop}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg ${isRunning
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
          >
            {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>

          {/* Lap Button */}
          <button
            onClick={handleLap}
            disabled={!isRunning}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg ${isRunning
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
          >
            <Flag className="w-5 h-5" />
          </button>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            disabled={time === 0}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg ${time > 0
                ? 'bg-gray-600 hover:bg-gray-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Lap Times */}
        {lapTimes.length > 0 && (
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 overflow-hidden">
            <div className="p-4 border-b border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-900 text-center">Lap Times</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {lapTimes.map((lap) => (
                <div
                  key={lap.id}
                  className={`flex justify-between items-center p-4 border-b border-gray-100/50 last:border-b-0 transition-colors hover:bg-white/50 ${lap.lapTime === fastest ? 'bg-green-50/50' :
                      lap.lapTime === slowest ? 'bg-red-50/50' : ''
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${lap.lapTime === fastest ? 'bg-green-100 text-green-700' :
                        lap.lapTime === slowest ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                      }`}>
                      {lap.id}
                    </div>
                    <div>
                      <div className="font-mono text-sm text-gray-900">
                        {formatTime(lap.lapTime)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Total: {formatTime(lap.time)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {lap.lapTime === fastest && (
                      <div className="text-xs text-green-600 font-medium">Fastest</div>
                    )}
                    {lap.lapTime === slowest && lapTimes.length > 1 && (
                      <div className="text-xs text-red-600 font-medium">Slowest</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {lapTimes.length === 0 && time === 0 && (
          <div className="text-center text-gray-500 text-sm">
            <p>Press play to start timing</p>
            <p className="mt-1">Use the flag button to record lap times</p>
            <p className="mt-1">Sessions are automatically saved when you reset</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer>
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Created with ❤️ by{' '}
              <a
                href="https://mrsonu.in"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-indigo-600 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
              >
                Sonu Kumar
              </a>
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;