import { SessionMetadata, SessionMarker } from '../domain/types';

export class ExportManager {
  /**
   * Generates FHR CSV data.
   */
  public static generateFhrCsv(
    timeline: { timeSec: number; rawBpm: number | null; validatedBpm: number | null; confidence: number; quality: string }[]
  ): string {
    const rows = ['time_seconds,raw_bpm,validated_bpm,confidence,quality,processing_run'];
    for (const item of timeline) {
      rows.push(
        `${item.timeSec.toFixed(2)},${item.rawBpm ?? ''},${item.validatedBpm ?? ''},${item.confidence.toFixed(3)},${item.quality},autocorr-v1`
      );
    }
    return rows.join('\n');
  }

  /**
   * Generates Signal Quality CSV data.
   */
  public static generateQualityCsv(
    qualityTimeline: { timeSec: number; rmsDb: number; peakDb: number; clipping: boolean; snrDb: number; quality: string }[]
  ): string {
    const rows = ['time_seconds,rms_dbfs,peak_dbfs,clipping,snr_db,quality'];
    for (const item of qualityTimeline) {
      rows.push(
        `${item.timeSec.toFixed(2)},${item.rmsDb.toFixed(1)},${item.peakDb.toFixed(1)},${item.clipping ? 1 : 0},${item.snrDb.toFixed(1)},${item.quality}`
      );
    }
    return rows.join('\n');
  }

  /**
   * Generates Session Events CSV data.
   */
  public static generateEventsCsv(markers: SessionMarker[]): string {
    const rows = ['timestamp_ms,time_seconds,event_type,label'];
    for (const m of markers) {
      rows.push(`${m.timestampMs},${(m.timestampMs / 1000).toFixed(2)},${m.type},"${m.label.replace(/"/g, '""')}"`);
    }
    return rows.join('\n');
  }

  /**
   * Triggers a browser file download for a text string or blob.
   */
  public static downloadFile(content: string | Blob, filename: string, mimeType = 'text/csv'): void {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Download a complete session JSON manifest package.
   */
  public static downloadSessionBundle(
    session: SessionMetadata,
    markers: SessionMarker[],
    wavBlob?: Blob
  ): void {
    const manifest = {
      formatVersion: '1.0',
      exportedAt: new Date().toISOString(),
      session,
      markers,
      algorithm: {
        name: 'Doppler-Autocorrelation',
        version: '1.0.0',
        provenance: 'FhrEstimator.ts v1.0',
      },
    };

    this.downloadFile(JSON.stringify(manifest, null, 2), `session_${session.id}_manifest.json`, 'application/json');

    if (wavBlob) {
      this.downloadFile(wavBlob, `session_${session.id}_audio.wav`, 'audio/wav');
    }
  }
}
