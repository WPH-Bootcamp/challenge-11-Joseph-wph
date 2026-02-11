"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
} from "lucide-react";

const tracks = [
  {
    title: "Vision",
    artist: "NAQT Vane",
    src: "/music/sample1.mp3",
    cover: "/cover/image.jpg",
  },
];

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const isSeekingRef = useRef(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(30);

  const [currentTrackIndex] = useState(0);
  const [customTrack, setCustomTrack] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);

  const currentTrack = customTrack || tracks[currentTrackIndex];

  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [energy, setEnergy] = useState(0);


  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (!audioContextRef.current) {
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaElementSource(audioRef.current);
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.8;

      source.connect(analyser);
      analyser.connect(audioContext.destination);

      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < 40; i++) {
          sum += dataArray[i];
        }

        const avg = sum / 40;
        const normalized = Math.min(avg / 255, 1);

        setEnergy(normalized);

        requestAnimationFrame(tick);
      };

      tick();
    }

    if (audioContextRef.current?.state === "suspended") {
      await audioContextRef.current.resume();
    }

    if (audioRef.current.paused) {
      await audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  };


  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoaded = () => {
      if (!isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener("loadedmetadata", handleLoaded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoaded);
    };
  }, [currentTrack]);

  useEffect(() => {
    setProgress(0);
  }, [currentTrack]);

  return (
    <motion.div
      className={`w-125 h-88 ${dragActive ? "ring-2 ring-purple-500" : ""}`}
    >
      <Card className="relative w-full h-full bg-zinc-900 text-white border-none p-6 rounded-2xl shadow-xl ring-1 ring-purple-500/40 shadow-purple-500/30">
        
        {dragActive && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-2xl z-50">
            <p className="text-purple-400 text-lg font-semibold">
              Drop your music here 🎵
            </p>
          </div>
        )}

        <audio
          ref={audioRef}
          src={currentTrack.src}
          preload="metadata"
          onTimeUpdate={() => {
            if (!audioRef.current) return;
            if (isSeekingRef.current) return;
            setProgress(audioRef.current.currentTime);
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* HEADER */}
        <div className="flex items-center gap-4 mb-6">
          <img
            src={currentTrack.cover}
            alt="cover"
            className="w-16 h-16 rounded-xl object-cover"
          />

          <div className="flex-1">
            <h3 className="font-semibold">{currentTrack.title}</h3>
            <p className="text-sm text-zinc-400">
              {currentTrack.artist}
            </p>

            <motion.div className="flex items-end gap-1 mt-2 h-6">
              {[0, 1, 2, 3].map((i) => (
                <motion.span
                  key={i}
                  className="w-1 bg-purple-400 rounded"
                  animate={{
                    height: 8 + energy * (10 + i * 4),
                  }}
                  transition={{ duration: 0.1 }}
                />
              ))}
            </motion.div>
          </div>
        </div>

        {/* PROGRESS */}
        <Slider
          value={[Math.min(progress, duration || 0)]}
          max={duration || 0}
          step={0.1}
          disabled={!duration}
          className="h-2"
          onValueChange={(v) => {
            isSeekingRef.current = true;
            setProgress(v[0]);
          }}
          onValueCommit={(v) => {
            if (!audioRef.current) return;
            audioRef.current.currentTime = v[0];
            isSeekingRef.current = false;
          }}
        />

        <div className="flex justify-between text-xs text-zinc-400 mt-1">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* CONTROLS */}
        <div className="flex justify-center items-center gap-4 mt-6">
          <Button variant="ghost" size="icon">
            <Shuffle />
          </Button>

          <Button variant="ghost" size="icon">
            <SkipBack />
          </Button>

          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-purple-500 flex items-center justify-center"
          >
            {isPlaying ? <Pause /> : <Play />}
          </motion.button>

          <Button variant="ghost" size="icon">
            <SkipForward />
          </Button>

          <Button variant="ghost" size="icon">
            <Repeat />
          </Button>
        </div>

        {/* VOLUME */}
        <div className="flex items-center gap-3 mt-6">
          <Volume2 className="text-zinc-400" />
          <Slider
            value={[volume]}
            max={100}
            step={1}
            className="h-2"
            onValueChange={(v) => setVolume(v[0])}
          />
        </div>
      </Card>
    </motion.div>
  );
}

function formatTime(time: number) {
  if (!time || isNaN(time)) return "0:00";
  const min = Math.floor(time / 60);
  const sec = Math.floor(time % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

