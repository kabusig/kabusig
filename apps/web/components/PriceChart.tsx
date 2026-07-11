"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  type IChartApi,
  type Time,
} from "lightweight-charts";

type Candle = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};
type Line = { date: string; value: number | null };

export default function PriceChart({
  candles,
  sma5,
  sma25,
  sma75,
  markers,
}: {
  candles: Candle[];
  sma5: Line[];
  sma25: Line[];
  sma75: Line[];
  markers: { date: string; label: string }[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      height: 420,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#86868b",
      },
      grid: {
        vertLines: { color: "#f0f0f2" },
        horzLines: { color: "#f0f0f2" },
      },
      timeScale: { borderColor: "#e8e8ed" },
      rightPriceScale: { borderColor: "#e8e8ed" },
      autoSize: true,
    });
    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#e11d48",
      downColor: "#2563eb",
      borderUpColor: "#e11d48",
      borderDownColor: "#2563eb",
      wickUpColor: "#e11d48",
      wickDownColor: "#2563eb",
    });
    candleSeries.setData(
      candles.map((c) => ({
        time: c.date as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    const addLine = (data: Line[], color: string, title: string) => {
      const s = chart.addLineSeries({
        color,
        lineWidth: 1,
        title,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      s.setData(
        data
          .filter((d) => d.value != null)
          .map((d) => ({ time: d.date as Time, value: d.value as number }))
      );
    };
    addLine(sma5, "#facc15", "SMA5");
    addLine(sma25, "#34d399", "SMA25");
    addLine(sma75, "#a78bfa", "SMA75");

    const volSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
      color: "#475569",
    });
    chart.priceScale("vol").applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });
    volSeries.setData(
      candles.map((c) => ({ time: c.date as Time, value: c.volume }))
    );

    if (markers.length > 0) {
      const byDate = new Map<string, string[]>();
      for (const m of markers) {
        byDate.set(m.date, [...(byDate.get(m.date) ?? []), m.label]);
      }
      const sorted = [...byDate.entries()].sort(([a], [b]) =>
        a.localeCompare(b)
      );
      // ラベル文字は直近8日分のみ(それ以前は●のみ表示して視認性を保つ)
      const labelFrom = Math.max(0, sorted.length - 8);
      candleSeries.setMarkers(
        sorted.map(([date, labels], i) => ({
          time: date as Time,
          position: "aboveBar" as const,
          color: "#f59e0b",
          shape: "circle" as const,
          size: 0.6,
          text:
            i >= labelFrom
              ? labels.length > 2
                ? `${labels.length}件`
                : labels.join("・")
              : undefined,
        }))
      );
    }

    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [candles, sma5, sma25, sma75, markers]);

  return <div ref={ref} className="w-full" />;
}
