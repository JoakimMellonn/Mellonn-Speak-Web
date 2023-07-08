import { ModelInit, MutableModel } from "@aws-amplify/datastore";
// @ts-ignore
import { LazyLoading, LazyLoadingDisabled, AsyncCollection } from "@aws-amplify/datastore";

export enum PromotionType {
  REFERRER = "REFERRER",
  REFERGROUP = "REFERGROUP",
  BENEFIT = "BENEFIT",
  DEV = "DEV",
  PERIODS = "PERIODS"
}

type ReferrerMetaData = {
  readOnlyFields: 'createdAt' | 'updatedAt';
}

type PromotionMetaData = {
  readOnlyFields: 'createdAt' | 'updatedAt';
}

type SettingsMetaData = {
  readOnlyFields: 'createdAt' | 'updatedAt';
}

type VersionMetaData = {
  readOnlyFields: 'createdAt' | 'updatedAt';
}

type RecordingMetaData = {
  readOnlyFields: 'createdAt' | 'updatedAt';
}

type EagerReferrer = {
  readonly id: string;
  readonly name: string;
  readonly members: number;
  readonly purchases: number;
  readonly seconds: number;
  readonly promotions?: Promotion[] | null;
  readonly discount: number;
  readonly isGroup: boolean;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyReferrer = {
  readonly id: string;
  readonly name: string;
  readonly members: number;
  readonly purchases: number;
  readonly seconds: number;
  readonly promotions: AsyncCollection<Promotion>;
  readonly discount: number;
  readonly isGroup: boolean;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Referrer = LazyLoading extends LazyLoadingDisabled ? EagerReferrer : LazyReferrer

export declare const Referrer: (new (init: ModelInit<Referrer, ReferrerMetaData>) => Referrer) & {
  copyOf(source: Referrer, mutator: (draft: MutableModel<Referrer, ReferrerMetaData>) => MutableModel<Referrer, ReferrerMetaData> | void): Referrer;
}

type EagerPromotion = {
  readonly id: string;
  readonly type: PromotionType | keyof typeof PromotionType;
  readonly code: string;
  readonly date: string;
  readonly freePeriods: number;
  readonly uses: number;
  readonly referrerID?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyPromotion = {
  readonly id: string;
  readonly type: PromotionType | keyof typeof PromotionType;
  readonly code: string;
  readonly date: string;
  readonly freePeriods: number;
  readonly uses: number;
  readonly referrerID?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Promotion = LazyLoading extends LazyLoadingDisabled ? EagerPromotion : LazyPromotion

export declare const Promotion: (new (init: ModelInit<Promotion, PromotionMetaData>) => Promotion) & {
  copyOf(source: Promotion, mutator: (draft: MutableModel<Promotion, PromotionMetaData>) => MutableModel<Promotion, PromotionMetaData> | void): Promotion;
}

type EagerSettings = {
  readonly id: string;
  readonly themeMode: string;
  readonly languageCode: string;
  readonly jumpSeconds: number;
  readonly primaryCard?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazySettings = {
  readonly id: string;
  readonly themeMode: string;
  readonly languageCode: string;
  readonly jumpSeconds: number;
  readonly primaryCard?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Settings = LazyLoading extends LazyLoadingDisabled ? EagerSettings : LazySettings

export declare const Settings: (new (init: ModelInit<Settings, SettingsMetaData>) => Settings) & {
  copyOf(source: Settings, mutator: (draft: MutableModel<Settings, SettingsMetaData>) => MutableModel<Settings, SettingsMetaData> | void): Settings;
}

type EagerVersion = {
  readonly id: string;
  readonly date: string;
  readonly recordingID: string;
  readonly editType: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyVersion = {
  readonly id: string;
  readonly date: string;
  readonly recordingID: string;
  readonly editType: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Version = LazyLoading extends LazyLoadingDisabled ? EagerVersion : LazyVersion

export declare const Version: (new (init: ModelInit<Version, VersionMetaData>) => Version) & {
  copyOf(source: Version, mutator: (draft: MutableModel<Version, VersionMetaData>) => MutableModel<Version, VersionMetaData> | void): Version;
}

type EagerRecording = {
  readonly id: string;
  readonly name: string;
  readonly date?: string | null;
  readonly description?: string | null;
  readonly fileKey?: string | null;
  readonly fileName?: string | null;
  readonly fileUrl?: string | null;
  readonly speakerCount: number;
  readonly languageCode?: string | null;
  readonly versions?: (Version | null)[] | null;
  readonly interviewers?: (string | null)[] | null;
  readonly labels?: (string | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyRecording = {
  readonly id: string;
  readonly name: string;
  readonly date?: string | null;
  readonly description?: string | null;
  readonly fileKey?: string | null;
  readonly fileName?: string | null;
  readonly fileUrl?: string | null;
  readonly speakerCount: number;
  readonly languageCode?: string | null;
  readonly versions: AsyncCollection<Version>;
  readonly interviewers?: (string | null)[] | null;
  readonly labels?: (string | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Recording = LazyLoading extends LazyLoadingDisabled ? EagerRecording : LazyRecording

export declare const Recording: (new (init: ModelInit<Recording, RecordingMetaData>) => Recording) & {
  copyOf(source: Recording, mutator: (draft: MutableModel<Recording, RecordingMetaData>) => MutableModel<Recording, RecordingMetaData> | void): Recording;
}