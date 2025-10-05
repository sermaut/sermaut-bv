import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AudioRecorderProps {
  onAudioRecorded: (blob: Blob) => void;
}

export function AudioRecorder({ onAudioRecorded }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);

  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecording) return;
      
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current?.getByteTimeDomainData(dataArray);

      ctx.fillStyle = 'hsl(var(--background))';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = 'hsl(var(--primary))';
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        setAudioBlob(blob);
        onAudioRecorded(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      drawWaveform();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível acessar o microfone',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  };

  const deleteRecording = () => {
    setAudioURL(null);
    setAudioBlob(null);
    chunksRef.current = [];
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {!isRecording && !audioURL && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={startRecording}
          >
            <Mic className="h-4 w-4 mr-2" />
            Gravar Áudio
          </Button>
        )}

        {isRecording && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={stopRecording}
          >
            <Square className="h-4 w-4 mr-2" />
            Parar Gravação
          </Button>
        )}

        {audioURL && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={deleteRecording}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        )}
      </div>

      {isRecording && (
        <canvas
          ref={canvasRef}
          width={300}
          height={60}
          className="w-full border rounded-md"
        />
      )}

      {audioURL && (
        <audio src={audioURL} controls className="w-full" />
      )}
    </div>
  );
}
