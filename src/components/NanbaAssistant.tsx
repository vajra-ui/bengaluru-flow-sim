import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Volume2, Send, MessageCircle } from 'lucide-react';
import { useTraffic } from '@/hooks/useTraffic';
import { allSegments } from '@/lib/tamilnadu-roads';
import { getSegmentSafetyScore, getTransportModes, emergencyContacts, getRecentIncidents } from '@/lib/safety-engine';

type AssistantState = 'idle' | 'listening' | 'processing' | 'speaking';

type Intent =
  | 'location' | 'density' | 'vehicle_count' | 'spacing' | 'queue'
  | 'time_to_front' | 'alternate_route' | 'movement' | 'prediction'
  | 'safety' | 'safe_route' | 'emergency' | 'transport'
  | 'traffic_advice' | 'best_time' | 'road_condition' | 'weather_traffic'
  | 'general' | 'greeting';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

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
  if (/best time|when.*travel|avoid.*traffic|peak.*hour|rush.*hour/.test(lower)) return { intent: 'best_time', segmentHint };
  if (/advice|suggest|recommend|tip|what.*do/.test(lower)) return { intent: 'traffic_advice', segmentHint };
  if (/road.*condition|pothole|construction|block/.test(lower)) return { intent: 'road_condition', segmentHint };
  if (/rain|weather|flood/.test(lower)) return { intent: 'weather_traffic', segmentHint };
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { states, predictCongestion, zoneStats } = useTraffic();
  const recognitionRef = useRef<any>(null);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInteraction = useRef(Date.now());

  const speechQueueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef(false);

  const processQueue = useCallback(() => {
    if (isSpeakingRef.current || speechQueueRef.current.length === 0) return;
    const textToSpeak = speechQueueRef.current.shift();
    if (!textToSpeak) return;
    isSpeakingRef.current = true;
    setState('speaking');
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-IN';
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang === 'en-IN') ||
      voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female')) ||
      voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (preferred) utterance.voice = preferred;
    const keepAlive = setInterval(() => {
      if (!window.speechSynthesis.speaking) clearInterval(keepAlive);
      else window.speechSynthesis.resume();
    }, 5000);
    utterance.onend = () => {
      clearInterval(keepAlive);
      isSpeakingRef.current = false;
      if (speechQueueRef.current.length > 0) processQueue();
      else setState('idle');
    };
    utterance.onerror = () => {
      clearInterval(keepAlive);
      isSpeakingRef.current = false;
      setState('idle');
      processQueue();
    };
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    window.speechSynthesis.getVoices();
    const onVoicesChanged = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
    return () => { window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged); window.speechSynthesis.cancel(); };
  }, []);

  const speak = useCallback((text: string) => {
    speechQueueRef.current = [text];
    window.speechSynthesis.cancel();
    isSpeakingRef.current = false;
    setTimeout(() => processQueue(), 100);
  }, [processQueue]);

  const resetInactivity = useCallback(() => {
    lastInteraction.current = Date.now();
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      if (state === 'idle' && showPanel) {
        const seg = states.get(userSegment);
        const trend = seg?.trend === 'falling' ? 'Traffic is gradually clearing.' : seg?.trend === 'rising' ? 'Traffic is building up.' : 'Traffic is steady.';
        const msg = `Nanba, are you still there? ${trend} Ask me anything!`;
        setResponse(msg);
        addAssistantMessage(msg);
      }
    }, 90000);
  }, [state, showPanel, states, userSegment]);

  useEffect(() => {
    if (showPanel) resetInactivity();
    return () => { if (inactivityTimer.current) clearTimeout(inactivityTimer.current); };
  }, [showPanel, resetInactivity]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const addAssistantMessage = (text: string) => {
    setChatMessages(prev => [...prev, { role: 'assistant', text, timestamp: Date.now() }]);
  };

  const generateResponse = useCallback((intentData: { intent: Intent; segmentHint?: string }) => {
    const segId = intentData.segmentHint || userSegment;
    const seg = allSegments.find(s => s.id === segId);
    const segState = states.get(segId);
    const segName = seg?.name || 'your current road';

    if (!segState) return `Nanba, I'm having trouble reading the traffic data right now. Please try again in a moment.`;

    const congLabel = getCongestionLabel(segState.congestionLevel);
    const speedKmh = Math.round(segState.speedFactor * 65);
    const vehiclesAhead = Math.floor(segState.queueLength * 0.6);
    const timeToFront = vehiclesAhead > 0 ? Math.max(1, Math.round(vehiclesAhead * (2 - segState.speedFactor) * 0.4)) : 0;

    switch (intentData.intent) {
      case 'greeting':
        return `Nanba, welcome! 🙏 I'm your traffic companion. You are on ${segName}. Traffic is ${congLabel}. Total ${zoneStats.totalVehicles.toLocaleString()} vehicles tracked across Tamil Nadu. How can I help?`;
      case 'location':
        return `📍 You are on ${segName}. ${segState.vehicleCount} vehicles on this stretch, queue length: ${segState.queueLength}. Speed: ${speedKmh} km/h.`;
      case 'density':
        return `Traffic on ${segName} is ${congLabel}. Vehicles are ${segState.avgSpacing < 10 ? 'closely packed' : segState.avgSpacing < 25 ? 'moderately spaced' : 'well spaced'}. Speed: ${speedKmh} km/h. ${segState.trend === 'rising' ? '⚠️ Getting worse.' : segState.trend === 'falling' ? '✅ Improving.' : 'Stable.'}`;
      case 'vehicle_count':
        return `🚗 ${segState.vehicleCount} vehicles on ${segName}. Inflow: ${segState.inflowRate}/cycle, outflow: ${segState.outflowRate}/cycle. ${segState.inflowRate > segState.outflowRate ? '⚠️ More vehicles entering than leaving.' : '✅ Flow is balanced.'}`;
      case 'spacing':
        return `Average spacing on ${segName}: ${Math.round(segState.avgSpacing)}m. ${segState.avgSpacing < 8 ? '🔴 Bumper to bumper! Exercise caution.' : segState.avgSpacing < 20 ? '🟡 Some room to maneuver.' : '🟢 Comfortable spacing.'}`;
      case 'queue':
        return `Queue on ${segName}: ~${segState.queueLength} vehicles. ${segState.trend === 'rising' ? '📈 Growing — consider alternate routes.' : segState.trend === 'falling' ? '📉 Shrinking — should clear soon!' : '➡️ Stable.'}`;
      case 'time_to_front':
        if (timeToFront === 0) return `🎉 Great news! You're near the front on ${segName}. You'll be moving freely very soon!`;
        return `⏱️ Estimated ${timeToFront} min to reach the front. ${vehiclesAhead} vehicles ahead. ${timeToFront > 15 ? 'Consider taking an alternate route.' : 'Hang tight!'}`;
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
          return `🛣️ I recommend ${best.seg.name}. Traffic there is ${getCongestionLabel(best.state!.congestionLevel)} at ${Math.round(best.state!.speedFactor * 65)} km/h. Much better than your current road!`;
        }
        return `All nearby routes are similarly congested. Stay on ${segName} — I'll alert you when a better route opens.`;
      }
      case 'movement': {
        const moveProbability = Math.round((1 - segState.congestionLevel) * 100);
        return `Movement probability: ${moveProbability}%. ${moveProbability > 60 ? '🟢 Steady movement expected.' : moveProbability > 30 ? '🟡 Expect stop-and-go.' : '🔴 Very limited movement. Consider waiting or alternate routes.'}`;
      }
      case 'prediction': {
        const pred = predictCongestion(segId);
        return `📊 Predicted congestion for ${segName}: ${Math.round(pred.prediction * 100)}%. Risk level: ${pred.risk}. ${pred.risk === 'high' ? '⚠️ Likely to get worse. Plan an alternate route.' : pred.risk === 'medium' ? 'Should stabilize soon.' : '✅ Looking good ahead!'}`;
      }
      case 'safety': {
        const safety = getSegmentSafetyScore(segId);
        return `🛡️ Safety score for ${segName}: ${safety.overall}/100 (Grade ${safety.grade} — ${safety.label}). Lighting: ${Math.round(safety.factors.lighting * 100)}%, Police: ${Math.round(safety.factors.policePresence * 100)}%, CCTV: ${Math.round(safety.factors.cctvCoverage * 100)}%. ${safety.overall < 50 ? '⚠️ Extra caution recommended. Share your live location with someone.' : '✅ Reasonably safe.'}`;
      }
      case 'safe_route': {
        const allSegs = allSegments.map(s => ({ s, score: getSegmentSafetyScore(s.id) })).sort((a, b) => b.score.overall - a.score.overall);
        const top3 = allSegs.slice(0, 3);
        return `🛡️ Top 3 safest routes right now:\n${top3.map((r, i) => `${i + 1}. ${r.s.name} — Score: ${r.score.overall}/100 (${r.score.grade})`).join('\n')}\nUse the Safety → Routes tab to search routes between specific locations with safety ratings.`;
      }
      case 'emergency':
        return `🚨 Emergency contacts:\n• Women's Helpline: 181\n• Police: 100\n• Kavalan SOS: 1091\n• TN Police Control: 044-28447777\n• Ambulance: 108\nStay calm. Share your live location from the SOS tab.`;
      case 'transport': {
        const modes = getTransportModes(segId);
        return `🚇 Transport options for ${segName} (by safety):\n${modes.map(m => `• ${m.name}: Safety ${m.safetyScore}/100 ${m.frequency ? `(${m.frequency})` : ''}`).join('\n')}\n${modes[0]?.note || ''}`;
      }
      case 'best_time':
        return `🕐 Best travel times in Tamil Nadu:\n• Early morning (5:30–7:30 AM): Least traffic\n• Mid-morning (10–11:30 AM): Good window\n• Afternoon (2–4 PM): Usually manageable\n❌ Avoid: 8–10 AM & 5–8 PM (peak hours)\nCurrently: ${zoneStats.avgCongestion > 0.5 ? '⚠️ Heavy period — delay if possible.' : '✅ Good time to travel!'}`;
      case 'traffic_advice': {
        const tips: string[] = [];
        if (segState.congestionLevel > 0.7) tips.push('🔴 Traffic is heavy — consider delaying your trip or using alternate routes.');
        if (segState.trend === 'rising') tips.push('📈 Traffic is building up. Leave now if you can or wait for it to peak and decline.');
        if (segState.trend === 'falling') tips.push('📉 Traffic is easing. Good time to start your journey soon.');
        if (zoneStats.hotspots.length > 0) tips.push(`🔥 Avoid hotspots: ${zoneStats.hotspots.slice(0, 3).join(', ')}`);
        tips.push('💡 Use the Safety tab to find routes with best safety scores.');
        return `Traffic advice for ${segName}:\n${tips.join('\n')}`;
      }
      case 'road_condition':
        return `🛣️ Road conditions for ${segName}: Speed factor at ${Math.round(segState.speedFactor * 100)}%. ${segState.speedFactor < 0.3 ? '⚠️ Very slow — possible obstruction or bad road conditions.' : segState.speedFactor < 0.6 ? '🟡 Moderate conditions.' : '🟢 Roads are in good condition.'}`;
      case 'weather_traffic':
        return `🌧️ Weather impact info: During monsoon season, Tamil Nadu roads can flood, especially in Chennai, Cuddalore, and delta regions. Always check local weather before long trips. Currently, traffic data shows ${getCongestionLabel(segState.congestionLevel)} conditions on ${segName}.`;
      default:
        return `I can help with:\n• 🚗 Traffic density & speed\n• 🛣️ Alternate routes\n• 🛡️ Safety scores\n• ⏱️ Best travel times\n• 🚇 Transport options\n• 🚨 Emergency contacts\n• 📊 Traffic predictions\nJust ask! Or use the quick buttons below.`;
    }
  }, [states, userSegment, predictCongestion, zoneStats]);

  const handleUserInput = useCallback((text: string) => {
    if (!text.trim()) return;
    
    setChatMessages(prev => [...prev, { role: 'user', text, timestamp: Date.now() }]);
    setTranscript(text);
    setState('processing');
    
    const intentData = detectIntent(text);
    if (intentData.segmentHint) setUserSegment(intentData.segmentHint);
    
    const reply = generateResponse(intentData);
    setResponse(reply);
    addAssistantMessage(reply);
    setShowPanel(true);
    resetInactivity();
    setState('idle');
  }, [generateResponse, resetInactivity]);

  const handleChatSubmit = useCallback(() => {
    if (!chatInput.trim()) return;
    handleUserInput(chatInput);
    setChatInput('');
  }, [chatInput, handleUserInput]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const msg = 'Speech recognition not supported. Please use text chat or try Chrome/Edge.';
      setResponse(msg);
      addAssistantMessage(msg);
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
        handleUserInput(text);
        setTimeout(() => speak(response), 300);
      }
    };
    recognition.onerror = (e: any) => {
      setState('idle');
      if (e.error === 'not-allowed') {
        const msg = 'Please allow microphone access to use voice commands. You can also type your question below.';
        setResponse(msg);
        addAssistantMessage(msg);
        setShowPanel(true);
      }
    };
    recognition.onend = () => { if (state === 'listening') setState('idle'); };
    recognitionRef.current = recognition;
    recognition.start();
  }, [state, handleUserInput, speak, response]);

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

  const togglePanel = useCallback(() => {
    if (showPanel) {
      closePanel();
    } else {
      setShowPanel(true);
      if (chatMessages.length === 0) {
        const greeting = generateResponse({ intent: 'greeting' });
        setResponse(greeting);
        addAssistantMessage(greeting);
      }
    }
  }, [showPanel, closePanel, chatMessages.length, generateResponse]);

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={togglePanel}
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
        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
      </motion.button>

      <div className="fixed bottom-[4.5rem] sm:bottom-[5.5rem] right-4 sm:right-6 z-50 text-[8px] sm:text-[9px] font-mono text-muted-foreground text-center w-12 sm:w-14">
        NANBA
      </div>

      {/* Voice wave */}
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

      {/* Chat panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-20 sm:bottom-24 right-2 sm:right-4 z-50 w-[calc(100vw-1rem)] sm:w-80 max-h-[70vh] flex flex-col rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${state === 'speaking' ? 'bg-accent animate-pulse' : 'bg-success'}`} />
                <span className="font-mono text-xs font-bold text-foreground tracking-wider">NANBA</span>
                <span className="text-[8px] font-mono text-muted-foreground">TRAFFIC AI</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={state === 'listening' ? stopListening : startListening}
                  className={`p-1.5 rounded-lg transition-colors ${state === 'listening' ? 'bg-destructive/20 text-destructive' : 'hover:bg-secondary text-muted-foreground'}`}
                  title={state === 'listening' ? 'Stop listening' : 'Voice input'}
                >
                  {state === 'listening' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
                <button onClick={closePanel} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2 min-h-[120px] max-h-[40vh]">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-secondary/70 text-foreground rounded-bl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {state === 'processing' && (
                <div className="flex justify-start">
                  <div className="bg-secondary/70 rounded-xl rounded-bl-sm px-3 py-2 flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} className="w-2 h-2 rounded-full bg-primary" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick actions */}
            <div className="px-3 py-1.5 border-t border-border/50 flex flex-wrap gap-1 shrink-0">
              {['Traffic now?', 'Safest route?', 'Best time?', 'Emergency', 'Advice'].map(q => (
                <button
                  key={q}
                  onClick={() => handleUserInput(q)}
                  className="px-2 py-1 text-[9px] font-mono bg-secondary/60 text-secondary-foreground rounded-md hover:bg-secondary transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Text input */}
            <div className="px-3 py-2 border-t border-border shrink-0">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleChatSubmit()}
                  placeholder="Ask about traffic, safety, routes..."
                  className="flex-1 text-xs bg-secondary/50 text-foreground border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  onClick={handleChatSubmit}
                  disabled={!chatInput.trim()}
                  className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
