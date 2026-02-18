import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Volume2 } from 'lucide-react';
import { useTraffic } from '@/hooks/useTraffic';
import { segments } from '@/lib/bengaluru-roads';

type AssistantState = 'idle' | 'listening' | 'processing' | 'speaking';

// Intent types the assistant can handle
type Intent =
  | 'location'
  | 'density'
  | 'vehicle_count'
  | 'spacing'
  | 'queue'
  | 'time_to_front'
  | 'alternate_route'
  | 'movement'
  | 'prediction'
  | 'general'
  | 'greeting';

function detectIntent(text: string): { intent: Intent; segmentHint?: string } {
  const lower = text.toLowerCase();

  // Try to detect a segment from the user's speech
  let segmentHint: string | undefined;
  for (const seg of segments) {
    const keywords = seg.name.toLowerCase().split(/[\s→:]+/).filter(w => w.length > 3);
    if (keywords.some(k => lower.includes(k))) {
      segmentHint = seg.id;
      break;
    }
  }

  if (/where am i|my location|current location|which road/.test(lower)) return { intent: 'location', segmentHint };
  if (/density|how (heavy|packed|busy)|traffic (level|condition)|congestion/.test(lower)) return { intent: 'density', segmentHint };
  if (/vehicle count|how many (vehicles|cars)|number of/.test(lower)) return { intent: 'vehicle_count', segmentHint };
  if (/spacing|space between|gap/.test(lower)) return { intent: 'spacing', segmentHint };
  if (/queue|queue length|how long is/.test(lower)) return { intent: 'queue', segmentHint };
  if (/first position|front|when will i move|reach.*front|time to/.test(lower)) return { intent: 'time_to_front', segmentHint };
  if (/alternate|alternative|other route|different road|bypass/.test(lower)) return { intent: 'alternate_route', segmentHint };
  if (/move|movement|will i move|probability/.test(lower)) return { intent: 'movement', segmentHint };
  if (/predict|forecast|future|will it clear|clearing/.test(lower)) return { intent: 'prediction', segmentHint };
  if (/hello|hi|nanba|hey/.test(lower)) return { intent: 'greeting', segmentHint };
  return { intent: 'general', segmentHint };
}

function getCongestionLabel(level: number): string {
  if (level > 0.8) return 'extremely heavy';
  if (level > 0.6) return 'heavy';
  if (level > 0.4) return 'moderate';
  if (level > 0.2) return 'light';
  return 'very light with free-flowing traffic';
}

export default function NanbaAssistant() {
  const [state, setState] = useState<AssistantState>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [showPanel, setShowPanel] = useState(false);
  const [userSegment, setUserSegment] = useState<string>('orr-silk-mara'); // simulated location
  const { states, predictCongestion, zoneStats } = useTraffic();
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef(window.speechSynthesis);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInteraction = useRef(Date.now());

  // Reset inactivity timer
  const resetInactivity = useCallback(() => {
    lastInteraction.current = Date.now();
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      if (state === 'idle' && showPanel) {
        const seg = states.get(userSegment);
        const trend = seg?.trend === 'falling' ? 'Traffic is gradually clearing.' : seg?.trend === 'rising' ? 'Traffic is building up, but hang in there.' : 'Traffic is steady right now.';
        const msg = `Nanba, are you feeling stressed? Don't worry, I am here with you. ${trend}`;
        setResponse(msg);
        speak(msg);
      }
    }, 60000); // 1 minute of inactivity
  }, [state, showPanel, states, userSegment]);

  useEffect(() => {
    if (showPanel) resetInactivity();
    return () => { if (inactivityTimer.current) clearTimeout(inactivityTimer.current); };
  }, [showPanel, resetInactivity]);

  const speak = useCallback((text: string) => {
    setState('speaking');
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.lang = 'en-IN';
    utterance.onend = () => setState('idle');
    utterance.onerror = () => setState('idle');
    synthRef.current.speak(utterance);
  }, []);

  const generateResponse = useCallback((intentData: { intent: Intent; segmentHint?: string }) => {
    const segId = intentData.segmentHint || userSegment;
    const seg = segments.find(s => s.id === segId);
    const segState = states.get(segId);
    const segName = seg?.name || 'your current road';

    if (!segState) {
      return `Nanba, I'm having trouble reading the traffic data right now. Please try again in a moment.`;
    }

    const congLabel = getCongestionLabel(segState.congestionLevel);
    const speedKmh = Math.round(segState.speedFactor * 65);
    const vehiclesAhead = Math.floor(segState.queueLength * 0.6);
    const timeToFront = vehiclesAhead > 0 ? Math.max(1, Math.round(vehiclesAhead * (2 - segState.speedFactor) * 0.4)) : 0;

    switch (intentData.intent) {
      case 'greeting':
        return `Nanba, welcome to Traffic Dhosth! I'm your traffic companion. You are currently on ${segName}. The traffic here is ${congLabel}. How can I help you?`;

      case 'location':
        return `Nanba, you are currently on ${segName}. There are approximately ${segState.vehicleCount} vehicles on this stretch, and the traffic queue ahead of you is about ${segState.queueLength} vehicles long.`;

      case 'density':
        return `Nanba, the current traffic density on ${segName} is ${congLabel}. Vehicles are ${segState.avgSpacing < 10 ? 'closely packed with limited spacing' : segState.avgSpacing < 25 ? 'moderately spaced' : 'well spaced'}, so movement is ${speedKmh < 15 ? 'very slow' : speedKmh < 30 ? 'slow' : 'moderate'}.`;

      case 'vehicle_count':
        return `Nanba, there are currently ${segState.vehicleCount} vehicles on ${segName}. The inflow rate is ${segState.inflowRate} vehicles per cycle, and ${segState.outflowRate} are moving out.`;

      case 'spacing':
        return `Nanba, the average spacing between vehicles on ${segName} is approximately ${Math.round(segState.avgSpacing)} meters. ${segState.avgSpacing < 8 ? 'Vehicles are bumper to bumper.' : segState.avgSpacing < 20 ? 'There is some room to maneuver.' : 'Spacing is comfortable for lane changes.'}`;

      case 'queue':
        return `Nanba, the current queue length on ${segName} is approximately ${segState.queueLength} vehicles. ${segState.trend === 'rising' ? 'The queue is growing.' : segState.trend === 'falling' ? 'The queue is shrinking.' : 'The queue is stable.'}`;

      case 'time_to_front': {
        if (timeToFront === 0) return `Nanba, great news! You are very close to the front of the queue on ${segName}. You should be moving freely very soon.`;
        return `Nanba, based on the current traffic flow rate, you will likely reach the front of the queue in approximately ${timeToFront} minute${timeToFront > 1 ? 's' : ''}. There are about ${vehiclesAhead} vehicles ahead of you.`;
      }

      case 'alternate_route': {
        // Find a less congested connected segment
        const connected = segments.filter(s =>
          s.id !== segId && (s.from === seg?.to || s.from === seg?.from || s.to === seg?.from || s.to === seg?.to)
        );
        const alternatives = connected
          .map(s => ({ seg: s, state: states.get(s.id) }))
          .filter(a => a.state && a.state.congestionLevel < (segState.congestionLevel - 0.1))
          .sort((a, b) => (a.state?.congestionLevel ?? 1) - (b.state?.congestionLevel ?? 1));

        if (alternatives.length > 0) {
          const best = alternatives[0];
          const altCong = getCongestionLabel(best.state!.congestionLevel);
          return `Nanba, I recommend taking ${best.seg.name}. Traffic there is ${altCong}, which is better than your current road. You could save significant time by switching.`;
        }
        return `Nanba, I checked nearby routes but they are all similarly congested right now. I suggest staying on ${segName} and being patient. I'll alert you when a better route opens up.`;
      }

      case 'movement': {
        const moveProbability = Math.round((1 - segState.congestionLevel) * 100);
        return `Nanba, your movement probability on ${segName} is about ${moveProbability}%. ${moveProbability > 60 ? 'You should be moving steadily.' : moveProbability > 30 ? 'Expect stop-and-go traffic.' : 'Movement is very limited right now. Hang tight.'}`;
      }

      case 'prediction': {
        const pred = predictCongestion(segId);
        return `Nanba, based on current trends, the predicted congestion level for ${segName} is ${Math.round(pred.prediction * 100)}%. The risk level is ${pred.risk}. ${pred.risk === 'high' ? 'It might get worse before it gets better. Consider an alternate route.' : pred.risk === 'medium' ? 'Traffic should stabilize soon.' : 'Things are looking good ahead.'}`;
      }

      default:
        return `Nanba, I can help you with traffic information. Try asking about your location, traffic density, queue length, estimated time to move, or alternate routes. I'm here for you!`;
    }
  }, [states, userSegment, predictCongestion]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setResponse('Nanba, speech recognition is not supported in your browser. Please try Chrome or Edge.');
      setShowPanel(true);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setState('listening');

    recognition.onresult = (event: any) => {
      const results = Array.from(event.results);
      const text = results.map((r: any) => r[0].transcript).join('');
      setTranscript(text);

      if (event.results[event.results.length - 1].isFinal) {
        setState('processing');
        const intentData = detectIntent(text);

        // If user mentions a segment, update simulated location
        if (intentData.segmentHint) {
          setUserSegment(intentData.segmentHint);
        }

        const reply = generateResponse(intentData);
        setResponse(reply);
        setShowPanel(true);
        resetInactivity();
        setTimeout(() => speak(reply), 300);
      }
    };

    recognition.onerror = (e: any) => {
      console.error('Speech recognition error', e.error);
      setState('idle');
      if (e.error === 'not-allowed') {
        setResponse('Nanba, please allow microphone access to use voice commands.');
        setShowPanel(true);
      }
    };

    recognition.onend = () => {
      if (state === 'listening') setState('idle');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [state, generateResponse, speak, resetInactivity]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    synthRef.current.cancel();
    setState('idle');
  }, []);

  const closePanel = useCallback(() => {
    setShowPanel(false);
    setResponse('');
    setTranscript('');
    synthRef.current.cancel();
    setState('idle');
  }, []);

  return (
    <>
      {/* Floating mic button */}
      <motion.button
        onClick={state === 'listening' ? stopListening : startListening}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
          state === 'listening'
            ? 'bg-destructive text-destructive-foreground'
            : state === 'speaking'
            ? 'bg-accent text-accent-foreground'
            : 'bg-primary text-primary-foreground'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={state === 'listening' ? { boxShadow: ['0 0 0 0 hsl(0 75% 55% / 0.4)', '0 0 0 20px hsl(0 75% 55% / 0)', '0 0 0 0 hsl(0 75% 55% / 0.4)'] } : {}}
        transition={state === 'listening' ? { duration: 1.5, repeat: Infinity } : {}}
      >
        {state === 'listening' ? <MicOff className="w-6 h-6" /> : state === 'speaking' ? <Volume2 className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
      </motion.button>

      {/* Label */}
      <div className="fixed bottom-[5.5rem] right-6 z-50 text-[9px] font-mono text-muted-foreground text-center w-14">
        {state === 'idle' ? 'NANBA' : state === 'listening' ? 'LISTENING...' : state === 'processing' ? 'THINKING...' : 'SPEAKING...'}
      </div>

      {/* Voice wave animation when listening */}
      <AnimatePresence>
        {state === 'listening' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-24 right-4 z-50 flex items-center gap-[3px]"
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full bg-primary"
                animate={{ height: [8, 24, 8] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Response panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-4 z-50 w-80 max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${state === 'speaking' ? 'bg-accent animate-pulse' : 'bg-primary'}`}
                  style={{ boxShadow: state === 'speaking' ? 'var(--glow-accent)' : 'var(--glow-primary)' }}
                />
                <span className="font-mono text-xs font-bold text-foreground tracking-wider">NANBA</span>
                <span className="text-[9px] font-mono text-muted-foreground">AI COMPANION</span>
              </div>
              <button onClick={closePanel} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Transcript */}
            {transcript && (
              <div className="px-4 py-2 border-b border-border/50">
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">You said:</p>
                <p className="text-xs text-foreground/80">{transcript}</p>
              </div>
            )}

            {/* Response */}
            <div className="px-4 py-3">
              {state === 'processing' ? (
                <div className="flex items-center gap-2">
                  <motion.div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-primary"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </motion.div>
                  <span className="text-xs text-muted-foreground font-mono">Processing...</span>
                </div>
              ) : (
                <p className="text-sm text-foreground leading-relaxed">{response}</p>
              )}
            </div>

            {/* Quick actions */}
            <div className="px-4 py-2 border-t border-border/50 flex flex-wrap gap-1.5">
              {['Where am I?', 'Traffic density?', 'Time to front?', 'Alternate route?'].map(q => (
                <button
                  key={q}
                  onClick={() => {
                    setTranscript(q);
                    setState('processing');
                    const intentData = detectIntent(q);
                    const reply = generateResponse(intentData);
                    setResponse(reply);
                    resetInactivity();
                    setTimeout(() => speak(reply), 200);
                  }}
                  className="px-2 py-1 text-[10px] font-mono bg-secondary/60 text-secondary-foreground rounded-md hover:bg-secondary transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
