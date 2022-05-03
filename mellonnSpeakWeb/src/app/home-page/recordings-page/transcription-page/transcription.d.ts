export interface Transcription {
    jobName: string;
    accountId: string;
    results: Results;
    status: string;
}

export interface Results {
    transcripts: Transcript[];
    speaker_labels: SpeakerLabels;
    items: Item[];
}

export interface Item {
    start_time:  string;
    end_time:    string;
    alternatives: Alternative[];
    type:         string;
}

export interface Alternative {
    confidence: string;
    content: string;
}

export interface SpeakerLabels {
    speakers: number;
    segments: Segment[];
}

export interface Segment {
    start_time: string;
    speaker_label: string;
    end_time: string;
    items: Item2[];
}

export interface Item2 {
    start_time: string
    speaker_label: string
    end_time: string
}

export interface Transcript {
    transcript: string;
}