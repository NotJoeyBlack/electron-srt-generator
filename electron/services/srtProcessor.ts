import * as fs from 'fs';
import * as path from 'path';
import { ConfigManager } from '../utils/config';
import { FileProcessor } from './fileProcessor';

interface SRTSubtitle {
  index: number;
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export class SRTProcessor {
  private configManager: ConfigManager;
  private fileProcessor: FileProcessor;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
    this.fileProcessor = new FileProcessor(configManager);
  }

  async processSRT(transcriptionData: any, inputFilePath: string, characterLimit: number = 50): Promise<string> {
    try {
      // Ensure output directory exists
      await this.fileProcessor.ensureOutputDirectory();
      
      // Generate SRT from transcription data
      const srtContent = this.generateSRT(transcriptionData, characterLimit);
      
      // Apply timing adjustments
      const adjustedSRT = this.adjustTiming(srtContent);
      
      // Create output file path
      const outputPath = this.fileProcessor.createOutputPath(inputFilePath);
      
      // Write SRT file
      fs.writeFileSync(outputPath, adjustedSRT, 'utf-8');
      
      return outputPath;
    } catch (error: any) {
      throw new Error(`SRT processing failed: ${error.message}`);
    }
  }

  private generateSRT(transcriptionData: any, characterLimit: number): string {
    const { words, speakers } = transcriptionData;
    
    if (!words || !Array.isArray(words)) {
      throw new Error('Invalid transcription data: missing words array');
    }

    // Create speaker map for diarization
    const speakerMap = new Map();
    if (speakers && Array.isArray(speakers)) {
      speakers.forEach(speaker => {
        speakerMap.set(speaker.id, speaker.name || `Speaker ${speaker.id}`);
      });
    }

    // Group words into subtitles based on natural breaks and timing
    const subtitles: SRTSubtitle[] = [];
    let currentSubtitle: SRTSubtitle | null = null;
    let subtitleIndex = 1;

    for (const word of words) {
      const wordText = word.word || '';
      const wordStart = word.start || 0;
      const wordEnd = word.end || 0;
      const speakerId = word.speaker_id;

      // Determine if we need to start a new subtitle
      const shouldStartNew = !currentSubtitle || 
        (speakerId && currentSubtitle.speaker !== speakerId) ||
        (wordStart - currentSubtitle.end > 2.0) || // 2 second gap
        (currentSubtitle.text.length > characterLimit); // User-configured character limit

      if (shouldStartNew) {
        // Finish current subtitle
        if (currentSubtitle) {
          subtitles.push(currentSubtitle);
        }

        // Start new subtitle
        currentSubtitle = {
          index: subtitleIndex++,
          start: wordStart,
          end: wordEnd,
          text: wordText,
          speaker: speakerId ? speakerMap.get(speakerId) : undefined
        };
      } else if (currentSubtitle) {
        // Add word to current subtitle
        currentSubtitle.text += ' ' + wordText;
        currentSubtitle.end = wordEnd;
      }
    }

    // Add final subtitle
    if (currentSubtitle) {
      subtitles.push(currentSubtitle);
    }

    // Convert to SRT format
    return this.convertToSRTFormat(subtitles);
  }

  private adjustTiming(srtContent: string): string {
    const lines = srtContent.split('\n');
    const adjustedLines: string[] = [];
    
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      
      // Check if this is a subtitle index line
      if (/^\d+$/.test(line)) {
        const index = line;
        const timingLine = lines[i + 1];
        const textLines: string[] = [];
        
        // Get timing line
        if (timingLine && timingLine.includes('-->')) {
          // Collect text lines until we hit an empty line or end of file
          let j = i + 2;
          while (j < lines.length && lines[j].trim() !== '') {
            textLines.push(lines[j]);
            j++;
          }
          
          // Parse timing
          const timingMatch = timingLine.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
          if (timingMatch) {
            const startTime = timingMatch[1];
            let endTime = timingMatch[2];
            
            // Find next subtitle's start time
            let nextStartTime: string | null = null;
            let k = j + 1;
            while (k < lines.length) {
              if (/^\d+$/.test(lines[k].trim())) {
                const nextTimingLine = lines[k + 1];
                if (nextTimingLine && nextTimingLine.includes('-->')) {
                  const nextTimingMatch = nextTimingLine.match(/(\d{2}:\d{2}:\d{2},\d{3})/);
                  if (nextTimingMatch) {
                    nextStartTime = nextTimingMatch[1];
                    break;
                  }
                }
              }
              k++;
            }
            
            // Adjust end time to next subtitle's start time
            if (nextStartTime) {
              endTime = nextStartTime;
            }
            
            // Add adjusted subtitle
            adjustedLines.push(index);
            adjustedLines.push(`${startTime} --> ${endTime}`);
            textLines.forEach(textLine => adjustedLines.push(textLine));
            adjustedLines.push(''); // Empty line between subtitles
          }
          
          i = j;
        } else {
          i++;
        }
      } else {
        i++;
      }
    }
    
    return adjustedLines.join('\n');
  }

  private convertToSRTFormat(subtitles: SRTSubtitle[]): string {
    const srtLines: string[] = [];
    
    for (const subtitle of subtitles) {
      // Subtitle index
      srtLines.push(subtitle.index.toString());
      
      // Timing line
      const startTime = this.formatTime(subtitle.start);
      const endTime = this.formatTime(subtitle.end);
      srtLines.push(`${startTime} --> ${endTime}`);
      
      // Text with optional speaker label
      let text = subtitle.text.trim();
      if (subtitle.speaker) {
        text = `[${subtitle.speaker}] ${text}`;
      }
      srtLines.push(text);
      
      // Empty line between subtitles
      srtLines.push('');
    }
    
    return srtLines.join('\n');
  }

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
  }

  private parseTime(timeString: string): number {
    const match = timeString.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
    if (!match) {
      throw new Error(`Invalid time format: ${timeString}`);
    }
    
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = parseInt(match[3], 10);
    const milliseconds = parseInt(match[4], 10);
    
    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
  }
}