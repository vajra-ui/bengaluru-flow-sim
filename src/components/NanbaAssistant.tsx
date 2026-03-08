import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Volume2 } from 'lucide-react';
import { useTraffic } from '@/hooks/useTraffic';
import { allSegments } from '@/lib/tamilnadu-roads';
import { getSegmentSafetyScore, getTransportModes, emergencyContacts, getRecentIncidents } from '@/lib/safety-engine';

type AssistantState = 'idle' | 'listening' | 'processing' | 'speaking';

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
  | 'safety'
  | 'safe_route'
  | 'emergency'
  | 'transport'
  | 'general'
  | 'greeting';

function detectIntent(text: string): { intent: Intent; segmentHint?: string } {
  const lower = text.toLowerCase();

  let segmentHint: string | undefined;
  for (const seg of allSegments) {
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
  if (/safe.*route|safest|women.*safe|safe.*travel/.test(lower)) return { intent: 'safe_route', segmentHint };
  if (/safe|safety|risk|danger|secure|women/.test(lower)) return { intent: 'safety', segmentHint };
  if (/emergency|sos|help|police|helpline/.test(lower)) return { intent: 'emergency', segmentHint };
  if (/bus|metro|auto|transport|how.*go|which.*transport/.test(lower)) return { intent: 'transport', segmentHint };
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
  const [userSegment, setUserSegment] = useState<string>('che-egmore-tnagar');
  const { states, predictCongestion } = useTraffic();
  const recognitionRef = useRef<any>(null);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInteraction = useRef(Date.now());

  // Robust speech queue management
  const speechQueueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef(false);

  const processQueue = useCallback(() => {
    if (isSpeakingRef.current || speechQueueRef.current.length === 0) return;

    const textToSpeak = speechQueueRef.current.shift();
    if (!textToSpeak) return;

    isSpeakingRef.current = true;
    setState('speaking');

    // Cancel any ongoing speech first
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-IN';

    // Try to pick a good English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang === 'en-IN') ||
      voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female')) ||
      voices.find(v => v.lang.startsWith('en')) ||
      voices[0];
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => {
      isSpeakingRef.current = false;
      if (speechQueueRef.current.length > 0) {
        processQueue();
      } else {
        setState('idle');
      }
    };

    utterance.onerror = (e) => {
      console.error('TTS error:', e.error);
      isSpeakingRef.current = false;
      setState('idle');
      processQueue();
    };

    // Chrome bug workaround: resume synth
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);

    // Chrome pause bug: keep synth alive
    const keepAlive = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        clearInterval(keepAlive);
      } else {
        window.speechSynthesis.resume();
      }
    }, 5000);

    utterance.onend = () => {
      clearInterval(keepAlive);
      isSpeakingRef.current = false;
      if (speechQueueRef.current.length > 0) {
        processQueue();
      } else {
        setState('idle');
      }
    };
  }, []);

  // Load voices
  useEffect(() => {
    window.speechSynthesis.getVoices();
    const onVoicesChanged = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback((text: string) => {
    speechQueueRef.current = [text]; // Replace queue (latest response)
    window.speechSynthesis.cancel();
    isSpeakingRef.current = false;
    // Small delay to let cancel() take effect
    setTimeout(() => processQueue(), 100);
  }, [processQueue]);

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
    }, 60000);
  }, [state, showPanel, states, userSegment, speak]);

  useEffect(() => {
    if (showPanel) resetInactivity();
    return () => { if (inactivityTimer.current) clearTimeout(inactivityTimer.current); };
  }, [showPanel, resetInactivity]);

  const generateResponse = useCallback((intentData: { intent: Intent; segmentHint?: string }) => {
    const segId = intentData.segmentHint || userSegment;
    const seg = allSegments.find(s => s.id === segId);
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
        const connected = allSegments.filter(s =>
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
      case 'safety': {
        const safety = getSegmentSafetyScore(segId);
        return `Nanba, the safety score for ${segName} is ${safety.overall} out of 100, which is grade ${safety.grade}, meaning ${safety.label}. Lighting is at ${Math.round(safety.factors.lighting * 100)} percent, police presence is ${Math.round(safety.factors.policePresence * 100)} percent, and CCTV coverage is ${Math.round(safety.factors.cctvCoverage * 100)} percent. ${safety.overall < 50 ? 'I recommend extra caution on this route. Consider sharing your live location with a trusted contact.' : 'This route has reasonable safety levels.'}`;
      }
      case 'safe_route': {
        const safety = getSegmentSafetyScore(segId);
        const allSegs = allSegments.map(s => ({ s, score: getSegmentSafetyScore(s.id) })).sort((a, b) => b.score.overall - a.score.overall);
        const safest = allSegs[0];
        return `Nanba, your current route ${segName} has a safety score of ${safety.overall}. The safest route in the city right now is ${safest.s.name} with a score of ${safest.score.overall}. I always recommend choosing well-lit routes with police presence over shorter alternatives. You can check the Safety tab for detailed route comparisons.`;
      }
      case 'emergency': {
        return `Nanba, I'm here for you. For emergencies, dial the Women's Helpline at 181, or Police at 100. The TN Police Control Room can be reached at 044-28447777. You can also use Kavalan SOS App by calling 1091. Stay calm, I am with you.`;
      }
      case 'transport': {
        const modes = getTransportModes(segId);
        const safest = modes[0];
        const modeList = modes.map(m => `${m.name} with safety score ${m.safetyScore}`).join(', ');
        return `Nanba, for ${segName}, the available transport options ranked by safety are: ${modeList}. I recommend ${safest?.name ?? 'metro'} as the safest option. ${safest?.note ?? ''}`;
      }
      default:
        return `Nanba, I can help you with traffic information and safety guidance. Try asking about your location, traffic density, safety score, safest route, transport options, or emergency contacts. I'm here for you!`;
    }
  }, [states, userSegment, predictCongestion]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const msg = 'Nanba, speech recognition is not supported in your browser. Please try Chrome or Edge.';
      setResponse(msg);
      setShowPanel(true);
      speak(msg);
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
        if (intentData.segmentHint) setUserSegment(intentData.segmentHint);

        const reply = generateResponse(intentData);
        setResponse(reply);
        setShowPanel(true);
        resetInactivity();
        // Speak the reply out loud
        setTimeout(() => speak(reply), 300);
      }
    };

    recognition.onerror = (e: any) => {
      console.error('Speech recognition error', e.error);
      setState('idle');
      if (e.error === 'not-allowed') {
        const msg = 'Nanba, please allow microphone access to use voice commands.';
        setResponse(msg);
        setShowPanel(true);
        speak(msg);
      }
    };

    recognition.onend = () => {
      if (state === 'listening') setState('idle');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [state, generateResponse, speak, resetInactivity]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) recognitionRef.current.stop();
    window.speechSynthesis.cancel();
    isSpeakingRef.current = false;
    speechQueueRef.current = [];
    setState('idle');
  }, []);

  const closePanel = useCallback(() => {
    setShowPanel(false);
    setResponse('');
    setTranscript('');
    window.speechSynthesis.cancel();
    isSpeakingRef.current = false;
    speechQueueRef.current = [];
    setState('idle');
  }, []);

  return (
    <>
      {/* Floating mic button */}
      <motion.button
        onClick={state === 'listening' ? stopListening : startListening}
        className={`fixed bottom-4 right-4 z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
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
        {state === 'listening' ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : state === 'speaking' ? <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
      </motion.button>

      {/* Label */}
      <div className="fixed bottom-[4.5rem] sm:bottom-[5.5rem] right-4 sm:right-6 z-50 text-[8px] sm:text-[9px] font-mono text-muted-foreground text-center w-12 sm:w-14">
        {state === 'idle' ? 'NANBA' : state === 'listening' ? 'LISTENING...' : state === 'processing' ? 'THINKING...' : 'SPEAKING...'}
      </div>

      {/* Voice wave animation when listening */}
      <AnimatePresence>
        {state === 'listening' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-20 sm:bottom-24 right-4 z-50 flex items-center gap-[3px]"
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

      {/* Response panel - responsive width */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-20 sm:bottom-24 right-2 sm:right-4 z-50 w-[calc(100vw-1rem)] sm:w-80 max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${state === 'speaking' ? 'bg-accent animate-pulse' : 'bg-primary'}`}
                  style={{ boxShadow: state === 'speaking' ? 'var(--glow-accent)' : 'var(--glow-primary)' }}
                />
                <span className="font-mono text-xs font-bold text-foreground tracking-wider">NANBA</span>
                <span className="text-[8px] sm:text-[9px] font-mono text-muted-foreground">AI COMPANION</span>
              </div>
              <button onClick={closePanel} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Transcript */}
            {transcript && (
              <div className="px-3 sm:px-4 py-2 border-b border-border/50">
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">You said:</p>
                <p className="text-xs text-foreground/80">{transcript}</p>
              </div>
            )}

            {/* Response */}
            <div className="px-3 sm:px-4 py-3">
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
                <div>
                  <p className="text-sm text-foreground leading-relaxed">{response}</p>
                  {state === 'speaking' && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <Volume2 className="w-3 h-3 text-accent animate-pulse" />
                      <span className="text-[10px] font-mono text-accent">Speaking...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="px-3 sm:px-4 py-2 border-t border-border/50 flex flex-wrap gap-1.5">
              {['Where am I?', 'Traffic density?', 'Safety score?', 'Safest route?', 'Emergency help', 'Transport options?'].map(q => (
                <button
                  key={q}
                  onClick={() => {
                    setTranscript(q);
                    setState('processing');
                    const intentData = detectIntent(q);
                    const reply = generateResponse(intentData);
                    setResponse(reply);
                    setShowPanel(true);
                    resetInactivity();
                    setTimeout(() => speak(reply), 200);
                  }}
                  className="px-2 py-1 text-[9px] sm:text-[10px] font-mono bg-secondary/60 text-secondary-foreground rounded-md hover:bg-secondary transition-colors"
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
