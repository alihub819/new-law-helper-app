import { useState, useEffect, useRef, useCallback } from "react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Video, Mic, MicOff, VideoOff, PhoneOff, Settings, Users,
  MessageSquare, Monitor, ShieldCheck, FileText, Download,
  Radio, Loader2, CircleAlert, CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TranscriptSegment {
  id: number;
  timestamp: string;
  text: string;
  speaker: "you" | "remote";
  isFinal: boolean;
}

export default function VideoCall() {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Live Transcription State
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [showTranscript, setShowTranscript] = useState(true);

  const recognitionRef = useRef<any>(null);
  const segmentIdRef = useRef(0);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Format current time as timestamp
  const getTimestamp = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  };

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let interim = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interim += transcript;
            }
          }

          setInterimTranscript(interim);

          if (finalTranscript) {
            const newSegment: TranscriptSegment = {
              id: segmentIdRef.current++,
              timestamp: getTimestamp(),
              text: finalTranscript.trim(),
              speaker: "you",
              isFinal: true
            };
            setTranscriptSegments(prev => [...prev, newSegment]);
            setInterimTranscript("");
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            toast({
              title: "Microphone Access Denied",
              description: "Please allow microphone access for live transcription.",
              variant: "destructive"
            });
            setIsTranscribing(false);
          }
        };

        recognition.onend = () => {
          // Auto-restart if still transcribing and in call
          if (isTranscribing && isInCall && !isMuted) {
            try {
              recognition.start();
            } catch (e) {
              // Already started
            }
          }
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) { }
      }
    };
  }, [isTranscribing, isInCall, isMuted, toast]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptSegments, interimTranscript]);

  // Start live transcription
  const startTranscription = useCallback(() => {
    if (recognitionRef.current && !isTranscribing) {
      try {
        recognitionRef.current.start();
        setIsTranscribing(true);
        toast({
          title: "Live Transcription Started",
          description: "Your speech is now being transcribed in real-time."
        });
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
  }, [isTranscribing, toast]);

  // Stop live transcription
  const stopTranscription = useCallback(() => {
    if (recognitionRef.current && isTranscribing) {
      try {
        recognitionRef.current.stop();
        setIsTranscribing(false);
        toast({
          title: "Transcription Paused",
          description: "Live transcription has been stopped."
        });
      } catch (e) { }
    }
  }, [isTranscribing, toast]);

  // Start call with auto-transcription
  const startCall = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsInCall(true);
      // Auto-start transcription when call begins
      setTimeout(() => {
        if (recognitionRef.current && !isMuted) {
          startTranscription();
        }
      }, 500);
    }, 2000);
  };

  // End call and stop transcription
  const endCall = () => {
    stopTranscription();
    setIsInCall(false);

    if (transcriptSegments.length > 0) {
      toast({
        title: "Call Ended",
        description: `Transcript saved with ${transcriptSegments.length} segments.`
      });
    }
  };

  // Toggle mute with transcription control
  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);

    if (newMuted && isTranscribing) {
      stopTranscription();
    } else if (!newMuted && isInCall && !isTranscribing) {
      startTranscription();
    }
  };

  // Download transcript
  const downloadTranscript = () => {
    const content = transcriptSegments
      .map(seg => `[${seg.timestamp}] ${seg.speaker === 'you' ? 'Attorney' : 'Client'}: ${seg.text}`)
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `call_transcript_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Transcript Downloaded",
      description: "The call transcript has been saved."
    });
  };

  // Add simulated remote speech (for demo purposes)
  useEffect(() => {
    if (isInCall && transcriptSegments.length > 0) {
      const lastSegment = transcriptSegments[transcriptSegments.length - 1];

      // Simulate remote response occasionally
      if (lastSegment.speaker === 'you' && Math.random() > 0.7) {
        const responses = [
          "I understand your point.",
          "Could you elaborate on that?",
          "That's an important consideration.",
          "I'll need to review the documents.",
          "Let me check my records on that."
        ];

        setTimeout(() => {
          const remoteSegment: TranscriptSegment = {
            id: segmentIdRef.current++,
            timestamp: getTimestamp(),
            text: responses[Math.floor(Math.random() * responses.length)],
            speaker: "remote",
            isFinal: true
          };
          setTranscriptSegments(prev => [...prev, remoteSegment]);
        }, 1500 + Math.random() * 2000);
      }
    }
  }, [transcriptSegments, isInCall]);

  return (
    <SidebarLayout>
      <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
        {!isInCall ? (
          <div className="flex-1 flex items-center justify-center p-6 relative">
            {isConnecting && (
              <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6" />
                <div className="flex items-center gap-2 text-primary font-bold text-xl mb-2">
                  <ShieldCheck className="h-6 w-6" />
                  Securing Connection...
                </div>
                <p className="text-slate-400 max-w-xs">
                  Establishing end-to-end encrypted link for a confidential legal session.
                </p>
              </div>
            )}
            <Card className="max-w-md w-full bg-slate-900 border-slate-800 text-white">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Video className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Legal Video Consultation</h1>
                <p className="text-slate-400 mb-4">
                  Join a secure, encrypted video meeting for client consultations and depositions.
                </p>

                {/* Live Transcription Badge */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-6">
                  <div className="flex items-center justify-center gap-2 text-green-400">
                    <Radio className="h-4 w-4" />
                    <span className="text-sm font-medium">AI Live Transcription Enabled</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Automatic speech-to-text during your call
                  </p>
                </div>

                <div className="space-y-4">
                  <Button className="w-full h-12 text-lg" onClick={startCall}>
                    Start New Meeting
                  </Button>
                  <Button variant="outline" className="w-full h-12 text-lg border-slate-700 hover:bg-slate-800">
                    Join with Code
                  </Button>
                </div>
                <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="h-4 w-4" />
                  End-to-end encrypted & HIPAA compliant
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex-1 flex relative">
            {/* Main Video Area */}
            <div className={`flex-1 flex flex-col ${showTranscript ? 'mr-80' : ''} transition-all duration-300`}>
              {/* Video Grid */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                {/* Remote Participant */}
                <div className="relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 group min-h-[200px]">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center text-3xl font-bold">
                      JS
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 font-medium flex items-center gap-2">
                    John Sterling (Client)
                    <Mic className="h-4 w-4 text-green-500" />
                  </div>
                </div>

                {/* Local Participant */}
                <div className="relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 group min-h-[200px]">
                  <div className="absolute inset-0 bg-slate-800/50 flex items-center justify-center">
                    {!isVideoOff ? (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                        <Video className="h-16 w-16 text-slate-700" />
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center text-3xl font-bold">
                        YOU
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 font-medium flex items-center gap-2">
                    You (Attorney)
                    {isMuted && <MicOff className="h-4 w-4 text-red-500" />}
                  </div>

                  {/* Transcription Status */}
                  {isTranscribing && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/20 px-3 py-1.5 rounded-full">
                      <Radio className="h-3 w-3 text-red-500 animate-pulse" />
                      <span className="text-xs text-red-400 font-medium">LIVE</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Controls */}
              <div className="h-24 bg-slate-900/80 backdrop-blur-md border-t border-slate-800 flex items-center justify-center gap-4 px-6">
                <div className="flex items-center gap-3">
                  <Button
                    variant={isMuted ? "destructive" : "outline"}
                    size="icon"
                    className="rounded-full w-12 h-12"
                    onClick={toggleMute}
                  >
                    {isMuted ? <MicOff /> : <Mic />}
                  </Button>
                  <Button
                    variant={isVideoOff ? "destructive" : "outline"}
                    size="icon"
                    className="rounded-full w-12 h-12"
                    onClick={() => setIsVideoOff(!isVideoOff)}
                  >
                    {isVideoOff ? <VideoOff /> : <Video />}
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full w-12 h-12">
                    <Monitor />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="rounded-full w-12 h-12"
                    onClick={endCall}
                  >
                    <PhoneOff />
                  </Button>
                </div>

                <div className="absolute right-8 flex items-center gap-2">
                  <Button
                    variant={showTranscript ? "default" : "ghost"}
                    size="icon"
                    className="text-slate-400"
                    onClick={() => setShowTranscript(!showTranscript)}
                  >
                    <FileText className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-slate-400">
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-slate-400">
                    <Users className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-slate-400">
                    <Settings className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Live Transcript Panel */}
            {showTranscript && (
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Live Transcript</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {isTranscribing ? (
                      <div className="flex items-center gap-1.5 text-green-400">
                        <Radio className="h-3 w-3 animate-pulse" />
                        <span className="text-xs">Recording</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <MicOff className="h-3 w-3" />
                        <span className="text-xs">Paused</span>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={downloadTranscript}
                      disabled={transcriptSegments.length === 0}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {transcriptSegments.length === 0 && !interimTranscript && (
                      <div className="text-center text-slate-500 py-8">
                        <Mic className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Start speaking to see transcription...</p>
                      </div>
                    )}

                    {transcriptSegments.map((segment) => (
                      <div
                        key={segment.id}
                        className={`p-3 rounded-lg ${segment.speaker === 'you'
                            ? 'bg-primary/10 border border-primary/20'
                            : 'bg-slate-800 border border-slate-700'
                          }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium ${segment.speaker === 'you' ? 'text-primary' : 'text-blue-400'
                            }`}>
                            {segment.speaker === 'you' ? 'You (Attorney)' : 'John Sterling'}
                          </span>
                          <span className="text-xs text-slate-500">{segment.timestamp}</span>
                        </div>
                        <p className="text-sm text-slate-200">{segment.text}</p>
                      </div>
                    ))}

                    {/* Interim (in-progress) transcript */}
                    {interimTranscript && (
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 animate-pulse">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-primary/70">You (Attorney)</span>
                          <Loader2 className="h-3 w-3 animate-spin text-primary/50" />
                        </div>
                        <p className="text-sm text-slate-400 italic">{interimTranscript}...</p>
                      </div>
                    )}

                    <div ref={transcriptEndRef} />
                  </div>
                </ScrollArea>

                {/* Transcript Actions */}
                <div className="p-4 border-t border-slate-800 space-y-2">
                  <Button
                    variant={isTranscribing ? "destructive" : "default"}
                    className="w-full"
                    onClick={isTranscribing ? stopTranscription : startTranscription}
                    disabled={isMuted}
                  >
                    {isTranscribing ? (
                      <>
                        <MicOff className="h-4 w-4 mr-2" />
                        Stop Transcription
                      </>
                    ) : (
                      <>
                        <Radio className="h-4 w-4 mr-2" />
                        Start Transcription
                      </>
                    )}
                  </Button>
                  {isMuted && !isTranscribing && (
                    <p className="text-xs text-center text-slate-500">
                      Unmute to enable transcription
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
