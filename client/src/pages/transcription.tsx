import { useState } from "react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileAudio, Upload, Play, Save, Download, FileText, Loader2, CheckCircle, CircleAlert, Clock, Lightbulb, ListChecks, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface TranscriptionResult {
  success: boolean;
  transcript: string;
  rawText: string;
  segments: Array<{ id: number; start: number; end: number; text: string }>;
  duration: number;
  analysis: {
    summary?: string;
    keyPoints?: string[];
    actionItems?: string[];
  };
  fileName: string;
  fileSize: number;
}

export default function Transcription() {
  const [file, setFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState("");
  const [analysisData, setAnalysisData] = useState<TranscriptionResult["analysis"] | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const { toast } = useToast();

  const transcribeMutation = useMutation({
    mutationFn: async (audioFile: File) => {
      const formData = new FormData();
      formData.append("audio", audioFile);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Transcription failed");
      }

      return res.json() as Promise<TranscriptionResult>;
    },
    onSuccess: (data) => {
      setTranscript(data.transcript);
      setAnalysisData(data.analysis);
      setDuration(data.duration);
      toast({
        title: "Transcription complete",
        description: `Successfully transcribed ${Math.round(data.duration / 60)} minutes of audio.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Transcription failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];

      // Check file size (25MB limit for Whisper)
      if (selectedFile.size > 25 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 25MB for transcription.",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
      setTranscript("");
      setAnalysisData(null);
      setDuration(null);

      toast({
        title: "File uploaded",
        description: `${selectedFile.name} is ready for transcription.`,
      });
    }
  };

  const startTranscription = () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please upload an audio or video file first.",
        variant: "destructive",
      });
      return;
    }

    transcribeMutation.mutate(file);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const downloadFile = new Blob([transcript], { type: 'text/plain' });
    element.href = URL.createObjectURL(downloadFile);
    element.download = `transcript_${file?.name || 'audio'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SidebarLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <FileAudio className="h-8 w-8 text-primary" />
            AI Transcription
          </h1>
          <p className="text-muted-foreground">
            Convert legal depositions, meetings, and calls into accurate text transcripts using OpenAI Whisper.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Upload Audio/Video
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                  accept="audio/*,video/*,.mp3,.mp4,.m4a,.wav,.webm,.ogg,.flac"
                  disabled={transcribeMutation.isPending}
                />
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm font-medium">Click or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">MP3, WAV, MP4, M4A, WebM (Max 25MB)</p>
              </div>

              {file && (
                <div className="bg-muted p-3 rounded-md flex items-center gap-3">
                  <FileAudio className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  {transcript && <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />}
                </div>
              )}

              {transcribeMutation.isPending && (
                <div className="space-y-3 py-2">
                  <div className="flex items-center gap-3 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="font-medium">Processing with OpenAI Whisper...</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• Uploading audio to secure server</p>
                    <p>• Converting speech to text with AI</p>
                    <p>• Analyzing content for key insights</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary h-1.5 rounded-full animate-pulse w-2/3" />
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={startTranscription}
                disabled={transcribeMutation.isPending || !file}
              >
                {transcribeMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Transcribing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Transcription
                  </>
                )}
              </Button>

              {/* Duration display */}
              {duration && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Audio duration: {formatDuration(duration)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transcript Panel */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Transcript
              </CardTitle>
              {transcript && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save to Case
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {transcript ? (
                <Textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="min-h-[300px] font-mono text-sm leading-relaxed"
                  placeholder="Transcript will appear here..."
                />
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground border rounded-md bg-muted/20">
                  <Play className="h-12 w-12 mb-4 opacity-20" />
                  <p>Upload a file and start transcription to see the result here.</p>
                  <p className="text-xs mt-2">Powered by OpenAI Whisper AI</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Panel - Shows after transcription */}
          {analysisData && (analysisData.summary || analysisData.keyPoints?.length || analysisData.actionItems?.length) && (
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Summary */}
                  {analysisData.summary && (
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Summary
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {analysisData.summary}
                      </p>
                    </div>
                  )}

                  {/* Key Points */}
                  {analysisData.keyPoints && analysisData.keyPoints.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Key Points
                      </h4>
                      <ul className="space-y-1">
                        {analysisData.keyPoints.map((point, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary">•</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Items */}
                  {analysisData.actionItems && analysisData.actionItems.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <ListChecks className="h-4 w-4 text-blue-500" />
                        Action Items
                      </h4>
                      <ul className="space-y-1">
                        {analysisData.actionItems.map((item, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-blue-500">→</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
