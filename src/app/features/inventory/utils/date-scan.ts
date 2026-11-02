import { DateCrop } from './date-image';

interface DateObservation { date: string | null; confidence: number; at: number; }

/** Remember recent useful readings instead of discarding them after a blurred frame. */
export class DateScanConsensus {
  private readings: DateObservation[] = [];
  private ranked: { date: string; hits: number; confidence: number }[] = [];

  get candidate(): string | null {
    return this.ranked.length && this.ranked[0].hits > (this.ranked[1]?.hits ?? 0) ? this.ranked[0].date : null;
  }

  observe(dates: string[], confidence: number, now = Date.now()): string | null {
    this.readings.push({ date: dates.length === 1 && confidence >= 45 ? dates[0] : null, confidence, at: now });
    this.readings = this.readings.filter(reading => now - reading.at <= 10000).slice(-6);
    const votes = new Map<string, { date: string; hits: number; confidence: number }>();
    for (const reading of this.readings) {
      if (!reading.date) continue;
      const vote = votes.get(reading.date) ?? { date: reading.date, hits: 0, confidence: 0 };
      vote.hits++; vote.confidence += reading.confidence; votes.set(reading.date, vote);
    }
    this.ranked = [...votes.values()].sort((a, b) => b.hits - a.hits);
    const best = this.ranked[0];
    if (!best || !this.candidate) return null;
    const competing = this.ranked[1]?.hits ?? 0;
    const required = competing || best.confidence / best.hits < 65 ? 3 : 2;
    return best.hits >= required && best.hits >= competing + (competing ? 2 : 1) ? best.date : null;
  }
}

/** Map the on-screen guide through object-fit: cover to the camera's actual pixels. */
export function dateFrameRegion(sourceWidth: number, sourceHeight: number, previewWidth: number, previewHeight: number, guide: DateCrop): DateCrop {
  const scale = Math.max(previewWidth / sourceWidth, previewHeight / sourceHeight);
  const offsetX = (sourceWidth * scale - previewWidth) / 2;
  const offsetY = (sourceHeight * scale - previewHeight) / 2;
  return {
    left: (previewWidth * guide.left / 100 + offsetX) / scale / sourceWidth * 100,
    top: (previewHeight * guide.top / 100 + offsetY) / scale / sourceHeight * 100,
    width: previewWidth * guide.width / 100 / scale / sourceWidth * 100,
    height: previewHeight * guide.height / 100 / scale / sourceHeight * 100,
  };
}
