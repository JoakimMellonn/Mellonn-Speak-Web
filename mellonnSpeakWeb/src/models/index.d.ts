import { ModelInit, MutableModel, PersistentModelConstructor } from "@aws-amplify/datastore";





type SettingsMetaData = {
  readOnlyFields: 'createdAt' | 'updatedAt';
}

type VersionMetaData = {
  readOnlyFields: 'createdAt' | 'updatedAt';
}

type RecordingMetaData = {
  readOnlyFields: 'createdAt' | 'updatedAt';
}

export declare class Settings {
  readonly id: string;
  readonly themeMode: string;
  readonly languageCode: string;
  readonly jumpSeconds: number;
  readonly primaryCard?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  constructor(init: ModelInit<Settings, SettingsMetaData>);
  static copyOf(source: Settings, mutator: (draft: MutableModel<Settings, SettingsMetaData>) => MutableModel<Settings, SettingsMetaData> | void): Settings;
}

export declare class Version {
  readonly id: string;
  readonly date: string;
  readonly recordingID: string;
  readonly editType: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  constructor(init: ModelInit<Version, VersionMetaData>);
  static copyOf(source: Version, mutator: (draft: MutableModel<Version, VersionMetaData>) => MutableModel<Version, VersionMetaData> | void): Version;
}

export declare class Recording {
  readonly id: string;
  readonly name: string;
  readonly date?: string | null;
  readonly description?: string | null;
  readonly fileKey?: string | null;
  readonly fileName?: string | null;
  readonly fileUrl?: string | null;
  readonly speakerCount: number;
  readonly languageCode?: string | null;
  readonly interviewers?: (string | null)[] | null;
  readonly labels?: (string | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  constructor(init: ModelInit<Recording, RecordingMetaData>);
  static copyOf(source: Recording, mutator: (draft: MutableModel<Recording, RecordingMetaData>) => MutableModel<Recording, RecordingMetaData> | void): Recording;
}