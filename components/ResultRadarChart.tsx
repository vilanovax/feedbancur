"use client";

import { useEffect, useRef } from "react";

interface RadarChartProps {
  data: {
    labels: string[];
    values: number[];
  };
  maxValue?: number;
}

export function ResultRadarChart({ data, maxValue = 100 }: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // بررسی صحت داده‌ها
    if (!data || !data.labels || !data.values || data.labels.length === 0 || data.values.length === 0) {
      console.error("Invalid chart data:", data);
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 60;
    const angleStep = (Math.PI * 2) / data.labels.length;

    // Draw background circles
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius * i) / 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 1;
    for (let i = 0; i < data.labels.length; i++) {
      const angle = angleStep * i - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Draw labels
      const labelX = centerX + (radius + 30) * Math.cos(angle);
      const labelY = centerY + (radius + 30) * Math.sin(angle);

      ctx.fillStyle = "#374151";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(data.labels[i], labelX, labelY);
    }

    // Draw data polygon
    ctx.beginPath();
    for (let i = 0; i < data.values.length; i++) {
      const angle = angleStep * i - Math.PI / 2;
      const value = data.values[i];
      const distance = (value / maxValue) * radius;
      const x = centerX + distance * Math.cos(angle);
      const y = centerY + distance * Math.sin(angle);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();

    // Fill
    ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
    ctx.fill();

    // Stroke
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw points
    for (let i = 0; i < data.values.length; i++) {
      const angle = angleStep * i - Math.PI / 2;
      const value = data.values[i];
      const distance = (value / maxValue) * radius;
      const x = centerX + distance * Math.cos(angle);
      const y = centerY + distance * Math.sin(angle);

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#3b82f6";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [data, maxValue]);

  return (
    <div className="flex justify-center">
      <canvas ref={canvasRef} width={400} height={400} />
    </div>
  );
}
